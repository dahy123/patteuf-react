import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { generateId, CASHBACK_AMOUNT, PARRAIN_CASHBACK } from '../utils/helpers'

const AppContext = createContext(null)

const STORAGE_KEY = 'patteuf_data'

const initialData = {
  // Packs: { id, name, quantity, price }
  packs: [
    { id: 'pack-1', name: 'Pack Standard', quantity: 50, price: 3000 },
    { id: 'pack-2', name: 'Pack Premium', quantity: 30, price: 3000 },
    { id: 'pack-3', name: 'Pack Mini', quantity: 100, price: 3000 },
  ],
  // Sales history: { id, date, items, total, buyerName, buyerPhone, refCode, cashback, parrainRefCode }
  sales: [],
  // Cagnottes: { refCode, buyerName, buyerPhone, balance, cashbacks }
  cagnottes: [],
}

export function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : initialData
    } catch {
      return initialData
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  // ── Stock Management ──
  const updatePackQuantity = useCallback((packId, newQuantity) => {
    setData(prev => ({
      ...prev,
      packs: prev.packs.map(p =>
        p.id === packId ? { ...p, quantity: Math.max(0, newQuantity) } : p
      ),
    }))
  }, [])

  const addPack = useCallback((name, quantity, price = 3000) => {
    setData(prev => ({
      ...prev,
      packs: [...prev.packs, { id: generateId(), name, quantity, price }],
    }))
  }, [])

  const removePack = useCallback((packId) => {
    setData(prev => ({
      ...prev,
      packs: prev.packs.filter(p => p.id !== packId),
    }))
  }, [])

  // ── Sales (POS) ──
  const processSale = useCallback((saleData) => {
    const { items, buyerName, buyerPhone, refCode, parrainRefCode } = saleData
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)

    const sale = {
      id: generateId(),
      date: new Date().toISOString(),
      items,
      total,
      buyerName: buyerName || 'Anonyme',
      buyerPhone: buyerPhone || '',
      refCode: refCode || generateId().toUpperCase().slice(0, 8),
      cashback: CASHBACK_AMOUNT,
      parrainRefCode: parrainRefCode || '',
    }

    // Deduct stock
    setData(prev => {
      const updatedPacks = prev.packs.map(p => {
        const item = items.find(i => i.id === p.id)
        if (item) {
          return { ...p, quantity: Math.max(0, p.quantity - item.qty) }
        }
        return p
      })

      // Create or update buyer cagnotte
      const buyerRef = sale.refCode
      let updatedCagnottes = [...prev.cagnottes]

      const buyerIdx = updatedCagnottes.findIndex(c => c.refCode === buyerRef)
      if (buyerIdx >= 0) {
        updatedCagnottes[buyerIdx] = {
          ...updatedCagnottes[buyerIdx],
          balance: updatedCagnottes[buyerIdx].balance + CASHBACK_AMOUNT,
          cashbacks: [...updatedCagnottes[buyerIdx].cashbacks, {
            amount: CASHBACK_AMOUNT,
            date: sale.date,
            type: 'purchase',
            saleId: sale.id,
          }],
        }
      } else {
        updatedCagnottes.push({
          refCode: buyerRef,
          buyerName: sale.buyerName,
          buyerPhone: sale.buyerPhone,
          balance: CASHBACK_AMOUNT,
          cashbacks: [{
            amount: CASHBACK_AMOUNT,
            date: sale.date,
            type: 'purchase',
            saleId: sale.id,
          }],
        })
      }

      // Handle parrain cashback
      if (parrainRefCode) {
        const parrainIdx = updatedCagnottes.findIndex(c => c.refCode === parrainRefCode)
        if (parrainIdx >= 0) {
          updatedCagnottes[parrainIdx] = {
            ...updatedCagnottes[parrainIdx],
            balance: updatedCagnottes[parrainIdx].balance + PARRAIN_CASHBACK,
            cashbacks: [...updatedCagnottes[parrainIdx].cashbacks, {
              amount: PARRAIN_CASHBACK,
              date: sale.date,
              type: 'parrainage',
              saleId: sale.id,
              from: sale.buyerName,
            }],
          }
        }
      }

      return {
        ...prev,
        packs: updatedPacks,
        sales: [sale, ...prev.sales],
        cagnottes: updatedCagnottes,
      }
    })

    return sale
  }, [])

  // ── Stats ──
  const getStats = useCallback(() => {
    const totalStock = data.packs.reduce((sum, p) => sum + p.quantity, 0)
    const totalSales = data.sales.length
    const totalRevenue = data.sales.reduce((sum, s) => sum + s.total, 0)
    const totalCashback = data.cagnottes.reduce((sum, c) => {
      return sum + c.cashbacks.reduce((s, cb) => s + cb.amount, 0)
    }, 0)
    const lowStockPacks = data.packs.filter(p => p.quantity <= 10)

    return {
      totalStock,
      totalSales,
      totalRevenue,
      totalCashback,
      lowStockPacks,
      totalCagnottes: data.cagnottes.length,
    }
  }, [data])

  const value = {
    packs: data.packs,
    sales: data.sales,
    cagnottes: data.cagnottes,
    updatePackQuantity,
    addPack,
    removePack,
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
