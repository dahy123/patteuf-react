import { getSupabase } from './supabase'

// ──────────────────────────────────────────────
// Sync helpers — Supabase ↔ localStorage
// DB is the source of truth. On conflict we
// compare `updated_at` timestamps and keep the
// newest version per collection.
// ──────────────────────────────────────────────

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
    const now = new Date().toISOString()

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
    return { ok: true }
  } catch (err) {
    console.error('[PATTEUF] Push Supabase error:', err)
    return { ok: false, reason: err.message }
  }
}

// ── Merge two arrays by `id`, keeping the newest entry ──
function mergeArraysById(localArr = [], remoteArr = []) {
  const map = new Map()

  // Index remote first
  for (const item of remoteArr) {
    if (item?.id) map.set(item.id, item)
  }

  // Overlay local — if local has an item not in remote, add it
  // If both have the same id, keep whichever has the newer `date`/`createdAt`/`updatedAt`
  for (const item of localArr) {
    if (!item?.id) continue
    const existing = map.get(item.id)
    if (!existing) {
      map.set(item.id, item)
    } else {
      // Compare by any timestamp field the item might have
      const localTime = item.updatedAt || item.createdAt || item.date || ''
      const remoteTime = existing.updatedAt || existing.createdAt || existing.date || ''
      if (localTime >= remoteTime) {
        map.set(item.id, item) // local is newer or equal
      }
      // else keep remote (it's newer)
    }
  }

  return Array.from(map.values())
}

// ── Merge stock maps — keep higher value (conservative) ──
function mergeStock(local = {}, remote = {}) {
  const merged = { ...remote } // start from remote
  for (const [key, val] of Object.entries(local)) {
    if (!(key in merged) || val > merged[key]) {
      merged[key] = val
    }
  }
  return merged
}

// ── Full sync: pull → compare timestamps → merge → push ──
export async function syncWithSupabase(localData) {
  const sb = getSupabase()
  if (!sb) return { synced: false, reason: 'not_configured' }

  try {
    // 1. Pull remote data + timestamps
    const pullResult = await pullRemote()
    if (!pullResult.ok) return { synced: false, reason: pullResult.reason }

    const remote = pullResult.data
    const remoteTs = pullResult.timestamps
    const lastSync = localStorage.getItem(SYNC_KEY)

    // 2. Check if remote has any data at all
    const remoteHasData =
      (remote.sales?.length || 0) > 0 ||
      (remote.clients?.length || 0) > 0 ||
      Object.values(remote.stock || {}).some(v => v > 0)

    // 3. Check if local has any user data (not just defaults)
    const localHasData =
      (localData.sales?.length || 0) > 0 ||
      (localData.clients?.length || 0) > 0

    // ── Strategy ──
    // Case A: No remote data → push local (first sync / fresh DB)
    // Case B: No local data → use remote (fresh install on new device)
    // Case C: Both have data → compare timestamps per table, merge newest
    // Case D: Never synced before → prefer remote if it has data

    let merged = { ...localData }

    if (!remoteHasData) {
      // Case A: Remote is empty, push local
      merged = { ...localData }
    } else if (!localHasData && !lastSync) {
      // Case D: Never synced, remote has data → use remote
      merged = {
        stock: mergeStock(localData.stock, remote.stock),
        sales: remote.sales || [],
        cagnottes: remote.cagnottes || [],
        clients: remote.clients || [],
      }
    } else if (!localHasData && remoteHasData) {
      // Case B: Fresh install, remote has data → use remote
      merged = {
        stock: mergeStock(localData.stock, remote.stock),
        sales: remote.sales || [],
        cagnottes: remote.cagnottes || [],
        clients: remote.clients || [],
      }
    } else {
      // Case C: Both have data → merge by timestamp per table
      const tablesToMerge = [
        { key: 'sales', hasArray: true },
        { key: 'clients', hasArray: true },
        { key: 'cagnottes', hasArray: true },
        { key: 'stock', hasArray: false },
      ]

      for (const { key, hasArray } of tablesToMerge) {
        const localTime = lastSync || ''
        const remoteTime = remoteTs[key] || ''

        if (!remoteTime || remoteTime < localTime) {
          // Local is newer → keep local (will push later)
          continue
        }

        if (remoteTime > localTime) {
          // Remote is newer
          if (hasArray) {
            merged[key] = mergeArraysById(localData[key] || [], remote[key] || [])
          } else {
            merged[key] = mergeStock(localData[key] || {}, remote[key] || {})
          }
        }
        // If timestamps are equal, keep local (no change needed)
      }
    }

    // 4. Push merged data back to Supabase
    await pushRemote(merged)

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
