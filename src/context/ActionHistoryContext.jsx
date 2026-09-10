import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { generateId } from '../utils/helpers'
import { getSupabase, isSupabaseConfigured } from '../utils/supabase'

const ActionHistoryContext = createContext(null)

const HISTORY_KEY = 'patteuf_action_history'
const SYNC_KEY = 'patteuf_history_last_sync'
const MAX_HISTORY_ITEMS = 500

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
      .select('history')
      .eq('singleton_id', 'main')
      .maybeSingle()

    if (error) throw error

    return { ok: true, history: data?.history || [] }
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

  // ── Pull from Supabase on mount ──
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
          // Merge: keep the longer/newer array
          if (remote.length > prev.length) {
            return remote.slice(0, MAX_HISTORY_ITEMS)
          }
          return prev
        })
        setSyncStatus('synced')
      } else {
        setSyncStatus(result.reason === 'not_configured' ? 'idle' : 'error')
      }
    }
    pull()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
