import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { generateId } from '../utils/helpers'
import { getSupabase, isSupabaseConfigured } from '../utils/supabase'

// Safely compare two timestamp strings (handles UTC, offset, bare ISO)
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

const ActionHistoryContext = createContext(null)

const HISTORY_KEY = 'patteuf_action_history'
const SYNC_KEY = 'patteuf_history_last_sync'
const MAX_HISTORY_ITEMS = 500

// Extracted merge so mount-pull and periodic re-pull share the same logic
function mergeHistories(local, remote) {
  const map = new Map()
  for (const entry of remote) {
    if (entry?.id) map.set(entry.id, entry)
  }
  for (const entry of local) {
    if (!entry?.id) continue
    const existing = map.get(entry.id)
    if (!existing) {
      map.set(entry.id, entry)
    } else if (compareTimestamps(entry.timestamp || '', existing.timestamp || '') >= 0) {
      map.set(entry.id, entry)
    }
  }
  return Array.from(map.values())
    .sort((a, b) => compareTimestamps(b.timestamp || '', a.timestamp || ''))
    .slice(0, MAX_HISTORY_ITEMS)
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return []
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

// ── Supabase helpers ──

async function pushHistoryToSupabase(history) {
  const sb = getSupabase()
  if (!sb) return { ok: false, reason: 'not_configured' }

  try {
    const { error } = await sb
      .from('app_action_history')
      .upsert(
        [{ singleton_id: 'main', history, updated_at: new Date().toISOString() }],
        { onConflict: 'singleton_id' }
      )
    if (error) throw error

    localStorage.setItem(SYNC_KEY, new Date().toISOString())
    return { ok: true }
  } catch (err) {
    console.error('[PATTEUF] Push history Supabase error:', err)
    return { ok: false, reason: err.message }
  }
}

async function pullHistoryFromSupabase() {
  const sb = getSupabase()
  if (!sb) return { ok: false, reason: 'not_configured' }

  try {
    const { data, error } = await sb
      .from('app_action_history')
      .select('history, updated_at')
      .eq('singleton_id', 'main')
      .maybeSingle()

    if (error) throw error

    return {
      ok: true,
      history: data?.history || [],
      updatedAt: data?.updated_at || null,
    }
  } catch (err) {
    console.error('[PATTEUF] Pull history Supabase error:', err)
    return { ok: false, reason: err.message }
  }
}

// Action types enum
export const ACTION_TYPES = {
  // Products
  PRODUCT_CREATED: 'product_created',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  // Stock
  STOCK_UPDATED: 'stock_updated',
  // Clients
  CLIENT_CREATED: 'client_created',
  CLIENT_UPDATED: 'client_updated',
  CLIENT_DELETED: 'client_deleted',
  // Sales
  SALE_COMPLETED: 'sale_completed',
  // Users
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ROLE_CHANGED: 'user_role_changed',
  // Cagnotte
  CAGNOTTE_WITHDRAWAL: 'cagnotte_withdrawal',
  // Settings
  SETTINGS_UPDATED: 'settings_updated',
}

// French labels for action types
export const ACTION_LABELS = {
  [ACTION_TYPES.PRODUCT_CREATED]: 'Produit ajouté',
  [ACTION_TYPES.PRODUCT_UPDATED]: 'Produit modifié',
  [ACTION_TYPES.PRODUCT_DELETED]: 'Produit supprimé',
  [ACTION_TYPES.STOCK_UPDATED]: 'Stock mis à jour',
  [ACTION_TYPES.CLIENT_CREATED]: 'Client ajouté',
  [ACTION_TYPES.CLIENT_UPDATED]: 'Client modifié',
  [ACTION_TYPES.CLIENT_DELETED]: 'Client supprimé',
  [ACTION_TYPES.SALE_COMPLETED]: 'Vente effectuée',
  [ACTION_TYPES.USER_CREATED]: 'Utilisateur créé',
  [ACTION_TYPES.USER_UPDATED]: 'Utilisateur modifié',
  [ACTION_TYPES.USER_DELETED]: 'Utilisateur supprimé',
  [ACTION_TYPES.USER_ROLE_CHANGED]: 'Rôle modifié',
  [ACTION_TYPES.CAGNOTTE_WITHDRAWAL]: 'Retrait cagnotte',
  [ACTION_TYPES.SETTINGS_UPDATED]: 'Paramètres modifiés',
}

export function ActionHistoryProvider({ children }) {
  const [history, setHistory] = useState(() => loadHistory())
  const [syncStatus, setSyncStatus] = useState('idle')
  const initialPullDone = useRef(false)

  // ── Persist to localStorage ──
  useEffect(() => {
    saveHistory(history)
  }, [history])

  // ── Pull from Supabase on mount (DB is priority) ──
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSyncStatus('idle')
      initialPullDone.current = true
      return
    }
    const pull = async () => {
      setSyncStatus('syncing')
      const result = await pullHistoryFromSupabase()
      initialPullDone.current = true
      if (result.ok) {
        const remote = result.history || []

        setHistory(prev => {
          const localHasData = prev.length > 0
          const remoteHasData = remote.length > 0

          // No remote data → keep local
          if (!remoteHasData) return prev

          // No local data → use remote
          if (!localHasData) return remote.slice(0, MAX_HISTORY_ITEMS)

          // Both have data → ALWAYS merge per-entry, newest wins (ms precision).
          // Each entry carries its own `timestamp`, so no coarse last-sync gate:
          // an action logged 2 seconds ago on another device shows up here.
          return mergeHistories(prev, remote)
        })
        setSyncStatus('synced')
      } else {
        setSyncStatus(result.reason === 'not_configured' ? 'idle' : 'error')
      }
    }
    pull()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Periodic re-pull: actions logged seconds/minutes ago on ANOTHER
  //    device appear here without a manual refresh (newest-wins merge). ──
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const interval = setInterval(async () => {
      if (!navigator.onLine) return
      const result = await pullHistoryFromSupabase()
      if (!result.ok) return
      const remote = result.history || []
      if (remote.length === 0) return
      setHistory(prev => {
        const localHasData = prev.length > 0
        if (!localHasData) return remote.slice(0, MAX_HISTORY_ITEMS)
        return mergeHistories(prev, remote)
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // ── Debounced push to Supabase (skip until first pull is done) ──
  const pushTimerRef = useRef(null)
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    if (!initialPullDone.current) return
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    pushTimerRef.current = setTimeout(async () => {
      setSyncStatus('syncing')
      const result = await pushHistoryToSupabase(history)
      setSyncStatus(result.ok ? 'synced' : 'error')
    }, 2000)
    return () => { if (pushTimerRef.current) clearTimeout(pushTimerRef.current) }
  }, [history])

  const logAction = useCallback((type, details, userName) => {
    const entry = {
      id: generateId(),
      type,
      details: details || {},
      userName: userName || 'Système',
      timestamp: new Date().toISOString(),
    }
    setHistory(prev => {
      const updated = [entry, ...prev]
      return updated.length > MAX_HISTORY_ITEMS ? updated.slice(0, MAX_HISTORY_ITEMS) : updated
    })
  }, [])

  const getHistory = useCallback(() => {
    return history
  }, [history])

  const clearHistory = useCallback(() => {
    setHistory([])
    // Also clear from Supabase
    if (isSupabaseConfigured()) {
      pushHistoryToSupabase([])
    }
  }, [])

  const value = {
    history,
    syncStatus,
    logAction,
    getHistory,
    clearHistory,
  }

  return <ActionHistoryContext.Provider value={value}>{children}</ActionHistoryContext.Provider>
}

export function useActionHistory() {
  const ctx = useContext(ActionHistoryContext)
  if (!ctx) throw new Error('useActionHistory must be used within ActionHistoryProvider')
  return ctx
}
