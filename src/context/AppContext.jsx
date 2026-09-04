import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { generateId } from '../utils/helpers'
import { products as initialProducts, PARRAIN_CASHBACK } from '../data/products'

const AppContext = createContext(null)

const STORAGE_KEY = 'patteuf_data'

function loadInitialStock() {
  const stockMap = {}
  initialProducts.forEach(p => { stockMap[p.id] = p.stock })
  return stockMap
}

function loadSavedData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return null
}

export function AppProvider({ children }) {
  const saved = loadSavedData()

  const [stock, setStock] = useState(() => saved?.stock || loadInitialStock())
  const [sales, setSales] = useState(() => saved?.sales || [])
  const [cagnottes, setCagnottes] = useState(() => saved?.cagnottes || [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stock, sales, cagnottes }))
  }, [stock, sales, cagnottes])

  // Get product by ID
  const getProduct = useCallback((id) => {
    return initialProducts.find(p => p.id === id)
  }, [])

  // Get all products with current stock
  const getProductsWithStock = useCallback(() => {
    return initialProducts.map(p => ({
      ...p,
      currentStock: stock[p.id] ?? p.stock,
    }))
  }, [stock])

  // Update stock for a product
  const updateStock = useCallback((productId, newQty) => {
    setStock(prev => ({
      ...prev,
      [productId]: Math.max(0, newQty),
    }))
  }, [])

  // Process a sale
  const processSale = useCallback(({ items, buyerName, buyerPhone, parrainRefCode }) => {
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

    // Determine cashback: only packs generate cashback
    const hasPack = items.some(i => i.type === 'pack')
    const totalCashback = hasPack ? items.reduce((sum, i) => {
      const prod = initialProducts.find(p => p.id === i.id)
      return sum + (prod?.cashback || 0) * i.qty
    }, 0) : 0

    const sale = {
      id: generateId(),
      date: new Date().toISOString(),
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        type: i.type,
      })),
      total,
      buyerName: buyerName || 'Anonyme',
      buyerPhone: buyerPhone || '',
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

    // Add sale to history
    setSales(prev => [sale, ...prev])

    // Update cagnottes (only for packs)
    if (hasPack) {
      setCagnottes(prev => {
        let updated = [...prev]
        const buyerRef = sale.refCode

        // Buyer cashback
        const buyerIdx = updated.findIndex(c => c.refCode === buyerRef)
        if (buyerIdx >= 0) {
          updated[buyerIdx] = {
            ...updated[buyerIdx],
            balance: updated[buyerIdx].balance + totalCashback,
            cashbacks: [...updated[buyerIdx].cashbacks, {
              amount: totalCashback,
              date: sale.date,
              type: 'purchase',
              saleId: sale.id,
            }],
          }
        } else {
          updated.push({
            refCode: buyerRef,
            buyerName: sale.buyerName,
            buyerPhone: sale.buyerPhone,
            balance: totalCashback,
            cashbacks: [{
              amount: totalCashback,
              date: sale.date,
              type: 'purchase',
              saleId: sale.id,
            }],
          })
        }

        // Parrain bonus
        if (parrainRefCode) {
          const parrainIdx = updated.findIndex(c => c.refCode === parrainRefCode)
          if (parrainIdx >= 0) {
            updated[parrainIdx] = {
              ...updated[parrainIdx],
              balance: updated[parrainIdx].balance + PARRAIN_CASHBACK,
              cashbacks: [...updated[parrainIdx].cashbacks, {
                amount: PARRAIN_CASHBACK,
                date: sale.date,
                type: 'parrainage',
                saleId: sale.id,
                from: sale.buyerName,
              }],
            }
          }
        }

        return updated
      })
    }

    return sale
  }, [])

  // Stats
  const getStats = useCallback(() => {
    const totalStock = Object.values(stock).reduce((sum, qty) => sum + qty, 0)
    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
    const totalCashbackDistributed = cagnottes.reduce((sum, c) => {
      return sum + c.cashbacks.reduce((s, cb) => s + cb.amount, 0)
    }, 0)

    // Low stock products
    const lowStockProducts = initialProducts
      .filter(p => (stock[p.id] ?? p.stock) <= 10)
      .map(p => ({ ...p, currentStock: stock[p.id] ?? p.stock }))

    return {
      totalStock,
      totalSales,
      totalRevenue,
      totalCashback: totalCashbackDistributed,
      lowStockProducts,
      totalCagnottes: cagnottes.length,
    }
  }, [stock, sales, cagnottes])

  const value = {
    products: initialProducts,
    stock,
    sales,
    cagnottes,
    getProduct,
    getProductsWithStock,
    updateStock,
    processSale,
    getStats,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
