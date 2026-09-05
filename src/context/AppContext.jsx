import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { generateId } from '../utils/helpers'
import { products as defaultProducts, PARRAIN_CASHBACK } from '../data/products'
import { isSupabaseConfigured } from '../utils/supabase'
import { syncWithSupabase, pushToSupabase } from '../utils/supabaseSync'

const AppContext = createContext(null)

const STORAGE_KEY = 'patteuf_data'
const PRODUCTS_KEY = 'patteuf_products'

function loadInitialStock(products) {
  const stockMap = {}
  products.forEach(p => { stockMap[p.id] = p.stock })
  return stockMap
}

function loadSavedData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return null
}

function loadSavedProducts() {
  try {
    const saved = localStorage.getItem(PRODUCTS_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return null
}

export function AppProvider({ children }) {
  const saved = loadSavedData()
  const savedProducts = loadSavedProducts()

  const [products, setProducts] = useState(() => savedProducts || [...defaultProducts])
  const [stock, setStock] = useState(() => saved?.stock || loadInitialStock(savedProducts || defaultProducts))
  const [sales, setSales] = useState(() => saved?.sales || [])
  const [cagnottes, setCagnottes] = useState(() => saved?.cagnottes || [])
  const [clients, setClients] = useState(() => saved?.clients || [])
  const [syncStatus, setSyncStatus] = useState('idle')
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // ── Persist products ──
  useEffect(() => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  }, [products])

  // ── Persist other data ──
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stock, sales, cagnottes, clients }))
  }, [stock, sales, cagnottes, clients])

  // ── Online/offline detection ──
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ── Auto-sync on mount ──
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const doInitialSync = async () => {
      setSyncStatus('syncing')
      const result = await syncWithSupabase({ stock, sales, cagnottes, clients })
      if (result.synced && result.data) {
        setStock(result.data.stock || loadInitialStock(products))
        setSales(result.data.sales || [])
        setCagnottes(result.data.cagnottes || [])
        setClients(result.data.clients || [])
        setSyncStatus('synced')
      } else {
        setSyncStatus(result.reason === 'not_configured' ? 'idle' : 'error')
      }
    }
    doInitialSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Debounced push to Supabase ──
  const pushTimerRef = useRef(null)
  useEffect(() => {
    if (!isSupabaseConfigured() || !isOnline) return
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    pushTimerRef.current = setTimeout(async () => {
      setSyncStatus('syncing')
      const result = await pushToSupabase({ stock, sales, cagnottes, clients })
      setSyncStatus(result.ok ? 'synced' : 'error')
    }, 2000)
    return () => { if (pushTimerRef.current) clearTimeout(pushTimerRef.current) }
  }, [stock, sales, cagnottes, clients, isOnline])

  // ── Manual sync trigger ──
  const forceSync = useCallback(async () => {
    if (!isSupabaseConfigured()) return { ok: false, reason: 'not_configured' }
    setSyncStatus('syncing')
    const result = await syncWithSupabase({ stock, sales, cagnottes, clients })
    if (result.synced && result.data) {
      setStock(result.data.stock || loadInitialStock(products))
      setSales(result.data.sales || [])
      setCagnottes(result.data.cagnottes || [])
      setClients(result.data.clients || [])
      setSyncStatus('synced')
    } else {
      setSyncStatus('error')
    }
    return result
  }, [stock, sales, cagnottes, clients, products])

  // ── Products CRUD ──
  const addProduct = useCallback(({ name, price, type, cashback, parrainBonus, stock: initialStock }) => {
    const product = {
      id: generateId(),
      name: name.trim(),
      price: Number(price) || 0,
      type: type || 'simple',
      cashback: type === 'pack' ? (Number(cashback) || 0) : 0,
      parrainBonus: type === 'pack' ? (Number(parrainBonus) || 0) : 0,
      stock: Number(initialStock) || 0,
    }
    setProducts(prev => [...prev, product])
    setStock(prev => ({ ...prev, [product.id]: product.stock }))
    return product
  }, [])

  const updateProduct = useCallback((productId, updates) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p
      const updated = { ...p, ...updates }
      // Reset cashback/parrainBonus if switched to simple
      if (updates.type === 'simple') {
        updated.cashback = 0
        updated.parrainBonus = 0
      }
      return updated
    }))
    // Sync stock if initial stock was updated
    if (updates.stock !== undefined) {
      setStock(prev => ({ ...prev, [productId]: Math.max(0, Number(updates.stock) || 0) }))
    }
  }, [])

  const removeProduct = useCallback((productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
    setStock(prev => {
      const updated = { ...prev }
      delete updated[productId]
      return updated
    })
  }, [])

  // ── Clients CRUD ──
  const addClient = useCallback(({ name, phone, address }) => {
    const client = {
      id: generateId(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      createdAt: new Date().toISOString(),
      totalPurchases: 0,
      totalSpent: 0,
    }
    setClients(prev => [client, ...prev])
    return client
  }, [])

  const updateClient = useCallback((clientId, updates) => {
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, ...updates } : c
    ))
  }, [])

  const removeClient = useCallback((clientId) => {
    setClients(prev => prev.filter(c => c.id !== clientId))
  }, [])

  const getClient = useCallback((clientId) => {
    return clients.find(c => c.id === clientId) || null
  }, [clients])

  const searchClients = useCallback((query) => {
    const q = query.toLowerCase().trim()
    if (!q) return clients
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q)
    )
  }, [clients])

  const updateClientStats = useCallback((clientId, saleTotal) => {
    setClients(prev => prev.map(c =>
      c.id === clientId
        ? { ...c, totalPurchases: c.totalPurchases + 1, totalSpent: c.totalSpent + saleTotal }
        : c
    ))
  }, [])

  // Get product by ID
  const getProduct = useCallback((id) => {
    return products.find(p => p.id === id)
  }, [products])

  // Get all products with current stock
  const getProductsWithStock = useCallback(() => {
    return products.map(p => ({
      ...p,
      currentStock: stock[p.id] ?? p.stock,
    }))
  }, [products, stock])

  // Update stock for a product
  const updateStock = useCallback((productId, newQty) => {
    setStock(prev => ({
      ...prev,
      [productId]: Math.max(0, newQty),
    }))
  }, [])

  // Process a sale
  const processSale = useCallback(({ items, buyerName, buyerPhone, parrainRefCode, clientId }) => {
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
    const hasPack = items.some(i => i.type === 'pack')
    const totalCashback = hasPack ? items.reduce((sum, i) => {
      const prod = products.find(p => p.id === i.id)
      return sum + (prod?.cashback || 0) * i.qty
    }, 0) : 0

    const sale = {
      id: generateId(),
      date: new Date().toISOString(),
      items: items.map(i => ({
        id: i.id, name: i.name, price: i.price, qty: i.qty, type: i.type,
      })),
      total,
      buyerName: buyerName || 'Anonyme',
      buyerPhone: buyerPhone || '',
      clientId: clientId || '',
      refCode: generateId().toUpperCase().slice(0, 8),
      cashback: totalCashback,
      hasPack,
      parrainRefCode: parrainRefCode || '',
    }

    // Deduct stock
    setStock(prev => {
      const updated = { ...prev }
      items.forEach(item => {
        updated[item.id] = Math.max(0, (updated[item.id] ?? 0) - item.qty)
      })
      return updated
    })

    setSales(prev => [sale, ...prev])

    if (clientId) {
      setClients(prev => prev.map(c =>
        c.id === clientId
          ? { ...c, totalPurchases: c.totalPurchases + 1, totalSpent: c.totalSpent + total }
          : c
      ))
    }

    if (hasPack) {
      setCagnottes(prev => {
        let updated = [...prev]
        const buyerRef = sale.refCode
        const buyerIdx = updated.findIndex(c => c.refCode === buyerRef)
        if (buyerIdx >= 0) {
          updated[buyerIdx] = {
            ...updated[buyerIdx],
            balance: updated[buyerIdx].balance + totalCashback,
            cashbacks: [...updated[buyerIdx].cashbacks, {
              amount: totalCashback, date: sale.date, type: 'purchase', saleId: sale.id,
            }],
          }
        } else {
          updated.push({
            refCode: buyerRef, buyerName: sale.buyerName, buyerPhone: sale.buyerPhone,
            balance: totalCashback,
            cashbacks: [{ amount: totalCashback, date: sale.date, type: 'purchase', saleId: sale.id }],
          })
        }
        if (parrainRefCode) {
          const parrainIdx = updated.findIndex(c => c.refCode === parrainRefCode)
          if (parrainIdx >= 0) {
            updated[parrainIdx] = {
              ...updated[parrainIdx],
              balance: updated[parrainIdx].balance + PARRAIN_CASHBACK,
              cashbacks: [...updated[parrainIdx].cashbacks, {
                amount: PARRAIN_CASHBACK, date: sale.date, type: 'parrainage',
                saleId: sale.id, from: sale.buyerName,
              }],
            }
          }
        }
        return updated
      })
    }

    return sale
  }, [products])

  // Stats
  const getStats = useCallback(() => {
    const totalStock = Object.values(stock).reduce((sum, qty) => sum + qty, 0)
    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
    const totalCashbackDistributed = cagnottes.reduce((sum, c) => {
      return sum + c.cashbacks.reduce((s, cb) => s + cb.amount, 0)
    }, 0)
    const lowStockProducts = products
      .filter(p => (stock[p.id] ?? p.stock) <= 10)
      .map(p => ({ ...p, currentStock: stock[p.id] ?? p.stock }))

    return {
      totalStock, totalSales, totalRevenue,
      totalCashback: totalCashbackDistributed,
      lowStockProducts,
      totalCagnottes: cagnottes.length,
      totalClients: clients.length,
      totalProducts: products.length,
    }
  }, [stock, sales, cagnottes, clients, products])

  const value = {
    products,
    stock,
    sales,
    cagnottes,
    clients,
    // Sync
    syncStatus,
    isOnline,
    forceSync,
    // Products CRUD
    addProduct,
    updateProduct,
    removeProduct,
    // Client CRUD
    addClient,
    updateClient,
    removeClient,
    getClient,
    searchClients,
    updateClientStats,
    // Products & Stock
    getProduct,
    getProductsWithStock,
    updateStock,
    // Sales
    processSale,
    // Stats
    getStats,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
