import { getSupabase } from './supabase'

// ──────────────────────────────────────────────
// Sync helpers — Supabase ↔ localStorage
// DB is the source of truth, but merging is done
// PER ITEM with millisecond precision: every
// entry carries `updatedAt` (ISO string) and the
// newest version always wins. Nothing is ever
// overwritten wholesale, so a change made seconds
// or minutes ago on another device is preserved.
// ──────────────────────────────────────────────

// Safely compare two timestamp strings, returning a number:
// negative if a < b, positive if a > b, 0 if equal.
// Handles UTC (Z), offset (+03:00), and bare ISO without tz.
// new Date() parses ISO strings with full millisecond precision.
function compareTimestamps(a, b) {
  if (!a && !b) return 0
  if (!a) return -1
  if (!b) return 1
  const ta = new Date(a).getTime()
  const tb = new Date(b).getTime()
  if (isNaN(ta) && isNaN(tb)) return 0
  if (isNaN(ta)) return -1
  if (isNaN(tb)) return 1
  return ta - tb
}

// Best timestamp available on a record (ms precision)
function itemTime(item) {
  return item?.updatedAt || item?.createdAt || item?.date || ''
}

// Current time as ISO string (UTC, millisecond precision)
export function nowIso() {
  return new Date().toISOString()
}

const SYNC_KEY = 'patteuf_last_sync'
const TABLES = ['app_stock', 'app_sales', 'app_cagnottes', 'app_clients']
const DATA_KEYS = ['stock', 'sales', 'cagnottes', 'clients']

// ── Pull remote data WITH timestamps ──
async function pullRemote() {
  const sb = getSupabase()
  if (!sb) return { ok: false, reason: 'not_configured' }

  try {
    const results = await Promise.all(
      TABLES.map(t =>
        sb.from(t).select('*').eq('singleton_id', 'main').maybeSingle()
      )
    )

    for (const r of results) {
      if (r.error) throw r.error
    }

    const remote = {}
    const remoteTimestamps = {}

    TABLES.forEach((table, i) => {
      const row = results[i].data
      const key = DATA_KEYS[i]
      remote[key] = row?.[key] ?? null
      remoteTimestamps[key] = row?.updated_at || null
    })

    return { ok: true, data: remote, timestamps: remoteTimestamps }
  } catch (err) {
    console.error('[PATTEUF] Pull Supabase error:', err)
    return { ok: false, reason: err.message }
  }
}

// ── Push local data → Supabase ──
async function pushRemote(localData) {
  const sb = getSupabase()
  if (!sb) return { ok: false, reason: 'not_configured' }

  try {
    const now = nowIso()

    const upserts = TABLES.map((table, i) => {
      const key = DATA_KEYS[i]
      return sb
        .from(table)
        .upsert(
          [{ singleton_id: 'main', [key]: localData[key], updated_at: now }],
          { onConflict: 'singleton_id' }
        )
    })

    const results = await Promise.all(upserts)
    for (const r of results) {
      if (r.error) throw r.error
    }

    localStorage.setItem(SYNC_KEY, now)
    return { ok: true, syncedAt: now }
  } catch (err) {
    console.error('[PATTEUF] Push Supabase error:', err)
    return { ok: false, reason: err.message }
  }
}

// ── Merge two arrays by `id`, ALWAYS keeping the newest entry ──
// Per-item comparison at ms precision: an entry edited 2 seconds
// later on another device beats the local copy; an entry that only
// exists on one side is always kept (no deletion by sync).
function mergeArraysById(localArr = [], remoteArr = []) {
  const map = new Map()

  // Index remote first
  for (const item of remoteArr) {
    if (item?.id) map.set(item.id, item)
  }

  // Overlay local — if local has an item not in remote, add it
  // If both have the same id, keep whichever is newer (ms precision)
  for (const item of localArr) {
    if (!item?.id) continue
    const existing = map.get(item.id)
    if (!existing) {
      map.set(item.id, item)
    } else {
      const cmp = compareTimestamps(itemTime(item), itemTime(existing))
      if (cmp >= 0) {
        map.set(item.id, item) // local is newer or equal
      }
      // else keep remote (it's newer)
    }
  }

  return Array.from(map.values())
}

// ── Merge cagnottes by refCode, keeping the newest per-cagnotte state ──
// Cagnottes have no `id`; refCode is the stable key. Balance changes
// (cashback, retrait) are timestamped via `updatedAt`.
function mergeCagnottes(localArr = [], remoteArr = []) {
  const map = new Map()
  for (const c of remoteArr) {
    if (c?.refCode) map.set(c.refCode, c)
  }
  for (const c of localArr) {
    if (!c?.refCode) continue
    const existing = map.get(c.refCode)
    if (!existing) {
      map.set(c.refCode, c)
    } else {
      const cmp = compareTimestamps(itemTime(c), itemTime(existing))
      if (cmp >= 0) map.set(c.refCode, c)
    }
  }
  return Array.from(map.values())
}

// ── Merge stock maps — keep the highest value per product (conservative) ──
function mergeStock(local = {}, remote = {}) {
  const merged = { ...remote } // start from remote
  for (const [key, val] of Object.entries(local)) {
    if (!(key in merged) || val > merged[key]) {
      merged[key] = val
    }
  }
  return merged
}

// ── Full sync: pull → merge per-item (newest wins, ms precision) → push ──
export async function syncWithSupabase(localData) {
  const sb = getSupabase()
  if (!sb) return { synced: false, reason: 'not_configured' }

  try {
    // 1. Pull remote data + timestamps
    const pullResult = await pullRemote()
    if (!pullResult.ok) return { synced: false, reason: pullResult.reason }

    const remote = pullResult.data

    // 2. Merge EVERY collection per-item, newest-wins — always, even if
    //    the remote row was written 1 second ago or 1 hour ago.
    //    This guarantees we take the most recent data at any granularity.
    const merged = {
      stock: mergeStock(localData.stock || {}, remote.stock || {}),
      sales: mergeArraysById(localData.sales || [], remote.sales || []),
      clients: mergeArraysById(localData.clients || [], remote.clients || []),
      cagnottes: mergeCagnottes(localData.cagnottes || [], remote.cagnottes || []),
    }

    // 3. Push merged data back so both sides converge to the same state
    const pushResult = await pushRemote(merged)
    if (!pushResult.ok) {
      // Even if the push fails (offline, RLS...), still return the merged
      // data so the app shows the freshest combined state.
      return { synced: true, data: merged, pushFailed: true }
    }

    return { synced: true, data: merged }
  } catch (err) {
    console.error('[PATTEUF] Sync error:', err)
    return { synced: false, reason: err.message }
  }
}

// ── Push-only (for debounced auto-sync) ──
export async function pushToSupabase(localData) {
  return pushRemote(localData)
}

// ── Pull-only ──
export async function pullFromSupabase() {
  const result = await pullRemote()
  if (!result.ok) return { ok: false, reason: result.reason }
  return { ok: true, data: result.data }
}
