import { getSupabase } from './supabase'

// ──────────────────────────────────────────────
// Sync helpers — localStorage ↔ Supabase
// Works offline-first: localStorage is always
// the source of truth; Supabase is a backup.
// ──────────────────────────────────────────────

const SYNC_KEY = 'patteuf_last_sync'

// ── Push local data → Supabase ──
export async function pushToSupabase(localData) {
  const sb = getSupabase()
  if (!sb) return { ok: false, reason: 'not_configured' }

  try {
    // Upsert each table as a single JSON row keyed by "singleton_id"
    // This avoids complex row-level syncing for an offline-first MVP.
    const payload = [
      { singleton_id: 'main', stock: localData.stock, updated_at: new Date().toISOString() },
    ]

    // Upsert stock
    const { error: stockErr } = await sb
      .from('app_stock')
      .upsert(payload, { onConflict: 'singleton_id' })
    if (stockErr) throw stockErr

    // Upsert sales array
    const { error: salesErr } = await sb
      .from('app_sales')
      .upsert(
        [{ singleton_id: 'main', sales: localData.sales, updated_at: new Date().toISOString() }],
        { onConflict: 'singleton_id' }
      )
    if (salesErr) throw salesErr

    // Upsert cagnottes array
    const { error: cagErr } = await sb
      .from('app_cagnottes')
      .upsert(
        [{ singleton_id: 'main', cagnottes: localData.cagnottes, updated_at: new Date().toISOString() }],
        { onConflict: 'singleton_id' }
      )
    if (cagErr) throw cagErr

    // Upsert clients array
    const { error: cliErr } = await sb
      .from('app_clients')
      .upsert(
        [{ singleton_id: 'main', clients: localData.clients, updated_at: new Date().toISOString() }],
        { onConflict: 'singleton_id' }
      )
    if (cliErr) throw cliErr

    localStorage.setItem(SYNC_KEY, new Date().toISOString())
    return { ok: true }
  } catch (err) {
    console.error('[PATTEUF] Push Supabase error:', err)
    return { ok: false, reason: err.message }
  }
}

// ── Pull Supabase → local data ──
export async function pullFromSupabase() {
  const sb = getSupabase()
  if (!sb) return { ok: false, reason: 'not_configured' }

  try {
    const [stockRes, salesRes, cagRes, cliRes] = await Promise.all([
      sb.from('app_stock').select('stock').eq('singleton_id', 'main').maybeSingle(),
      sb.from('app_sales').select('sales').eq('singleton_id', 'main').maybeSingle(),
      sb.from('app_cagnottes').select('cagnottes').eq('singleton_id', 'main').maybeSingle(),
      sb.from('app_clients').select('clients').eq('singleton_id', 'main').maybeSingle(),
    ])

    if (stockRes.error) throw stockRes.error
    if (salesRes.error) throw salesRes.error
    if (cagRes.error) throw cagRes.error
    if (cliRes.error) throw cliRes.error

    const remoteData = {
      stock: stockRes.data?.stock || null,
      sales: salesRes.data?.sales || null,
      cagnottes: cagRes.data?.cagnottes || null,
      clients: cliRes.data?.clients || null,
    }

    return { ok: true, data: remoteData }
  } catch (err) {
    console.error('[PATTEUF] Pull Supabase error:', err)
    return { ok: false, reason: err.message }
  }
}

// ── Full sync: merge remote into local ──
// Strategy: if remote is newer, use it; otherwise keep local.
export async function syncWithSupabase(localData) {
  const sb = getSupabase()
  if (!sb) return { synced: false, reason: 'not_configured' }

  try {
    // 1. Pull remote
    const pullResult = await pullFromSupabase()
    if (!pullResult.ok) return { synced: false, reason: pullResult.reason }

    const remote = pullResult.data
    const lastSync = localStorage.getItem(SYNC_KEY)

    // 2. Decide merge strategy
    // If no local data exists yet (fresh install), use remote
    const hasLocalData = localData.sales.length > 0 || Object.values(localData.stock).some(v => v > 0)

    let merged = { ...localData }

    if (!hasLocalData && remote.sales) {
      // Fresh install — use remote data
      merged = {
        stock: remote.stock || localData.stock,
        sales: remote.sales || [],
        cagnottes: remote.cagnottes || [],
        clients: remote.clients || [],
      }
    } else if (remote.sales && lastSync) {
      // Existing data — merge: keep the longer/newer arrays
      if ((remote.sales?.length || 0) > localData.sales.length) {
        merged.sales = remote.sales
      }
      if ((remote.clients?.length || 0) > localData.clients.length) {
        merged.clients = remote.clients
      }
      if ((remote.cagnottes?.length || 0) > localData.cagnottes.length) {
        merged.cagnottes = remote.cagnottes
      }
      // For stock, keep the higher values (conservative merge)
      if (remote.stock) {
        const mergedStock = { ...localData.stock }
        for (const [key, val] of Object.entries(remote.stock)) {
          if (!(key in mergedStock) || val > mergedStock[key]) {
            mergedStock[key] = val
          }
        }
        merged.stock = mergedStock
      }
    }

    // 3. Push merged data back to Supabase
    await pushToSupabase(merged)

    return { synced: true, data: merged }
  } catch (err) {
    console.error('[PATTEUF] Sync error:', err)
    return { synced: false, reason: err.message }
  }
}
