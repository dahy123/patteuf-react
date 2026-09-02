import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatAr, CASHBACK_AMOUNT } from '../utils/helpers'
import {
  ShoppingCart, Plus, Minus, X, Check, User,
  Phone, Gift, ChevronDown, ChevronUp, History,
  Sparkles, Tag, PartyPopper,
} from 'lucide-react'

export default function Sale() {
  const { packs, processSale, sales } = useApp()
  const [items, setItems] = useState([])
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [parrainRefCode, setParrainRefCode] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  const addItem = (pack) => {
    if (pack.quantity <= 0) return
    const existing = items.find(i => i.id === pack.id)
    if (existing) {
      if (existing.qty >= pack.quantity) return
      setItems(items.map(i => i.id === pack.id ? { ...i, qty: i.qty + 1 } : i))
    } else {
      setItems([...items, { id: pack.id, name: pack.name, price: pack.price, qty: 1, maxQty: pack.quantity }])
    }
  }

  const updateItemQty = (itemId, newQty) => {
    if (newQty <= 0) {
      setItems(items.filter(i => i.id !== itemId))
    } else {
      setItems(items.map(i => i.id === itemId ? { ...i, qty: Math.min(newQty, i.maxQty) } : i))
    }
  }

  const removeItem = (itemId) => setItems(items.filter(i => i.id !== itemId))
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0)

  const handleSale = () => {
    if (items.length === 0) return
    const sale = processSale({
      items,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      parrainRefCode: parrainRefCode.trim().toUpperCase(),
    })
    setLastSale(sale)
    setShowSuccess(true)
    setItems([])
    setBuyerName('')
    setBuyerPhone('')
    setParrainRefCode('')
  }

  const recentSales = sales.slice(0, 15)

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Success Modal */}
      {showSuccess && lastSale && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-sm w-full text-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto">
              <PartyPopper className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Vente réalisée !</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Transaction enregistrée avec succès</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Acheteur</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{lastSale.buyerName || 'Anonyme'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Montant</span>
                <span className="text-sm font-bold text-brand-700 dark:text-brand-400">{formatAr(lastSale.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Code réf.</span>
                <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/50 px-2 py-0.5 rounded-md">{lastSale.refCode}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Gift className="w-4 h-4" />
                  <span className="text-sm font-semibold">+{formatAr(lastSale.cashback)} cashback</span>
                </div>
                {lastSale.parrainRefCode && (
                  <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-medium">Parrain reçoit {formatAr(200)} de bonus</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setShowSuccess(false)} className="btn btn-primary w-full">Continuer</button>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Point de vente</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Sélectionnez les packs à vendre</p>
      </div>

      {/* Pack Selection */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Packs disponibles</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {packs.map(pack => {
            const outOfStock = pack.quantity <= 0
            const lowStock = pack.quantity > 0 && pack.quantity <= 10
            return (
              <button key={pack.id} onClick={() => addItem(pack)} disabled={outOfStock}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 ${
                  outOfStock
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50/30 dark:hover:bg-brand-900/20 active:scale-[0.98] cursor-pointer'
                }`}>
                <div className="text-left flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${outOfStock ? 'bg-slate-100 dark:bg-slate-700' : 'bg-brand-50 dark:bg-brand-900/50'}`}>
                    <Tag className={`w-5 h-5 ${outOfStock ? 'text-slate-300 dark:text-slate-600' : 'text-brand-500 dark:text-brand-400'}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{pack.name}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{formatAr(pack.price)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold tabular-nums ${outOfStock ? 'text-slate-300 dark:text-slate-600' : lowStock ? 'text-rose-500 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {pack.quantity}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {outOfStock ? 'Épuisé' : 'restants'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cart */}
      {items.length > 0 && (
        <div className="card p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-brand-100 dark:bg-brand-900/50 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-brand-700 dark:text-brand-400">{totalItems}</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Panier</h3>
            </div>
            <button onClick={() => setItems([])} className="text-xs text-rose-500 dark:text-rose-400 font-medium hover:text-rose-600 dark:hover:text-rose-300">Vider</button>
          </div>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatAr(item.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateItemQty(item.id, item.qty - 1)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-slate-800 dark:text-slate-200 tabular-nums">{item.qty}</span>
                  <button onClick={() => updateItemQty(item.id, item.qty + 1)} disabled={item.qty >= item.maxQty} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-30">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">{formatAr(item.price * item.qty)}</span>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buyer Info */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Informations acheteur</h3>
        </div>
        <div className="relative">
          <User className="w-4 h-4 text-slate-300 dark:text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Nom de l'acheteur" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="input pl-10" />
        </div>
        <div className="relative">
          <Phone className="w-4 h-4 text-slate-300 dark:text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="tel" placeholder="Numéro de téléphone" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="input pl-10" />
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <label className="text-xs font-semibold text-amber-700 dark:text-amber-400">Code Parrain</label>
          </div>
          <input type="text" placeholder="Ex: A1B2C3D4" value={parrainRefCode} onChange={e => setParrainRefCode(e.target.value.toUpperCase())}
            className="input border-amber-300 dark:border-amber-700 focus:border-amber-500 font-mono uppercase tracking-wider text-center text-sm" maxLength={8} />
          <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Le parrain recevra 200 Ar de bonus
          </p>
        </div>
      </div>

      {/* Total & Checkout */}
      {items.length > 0 && (
        <div className="card p-5 animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">{formatAr(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 dark:text-slate-500">{totalItems} article{totalItems > 1 ? 's' : ''}</p>
              <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">+{formatAr(CASHBACK_AMOUNT)} cashback</p>
            </div>
          </div>
          <button onClick={handleSale} className="btn btn-success w-full py-3.5 text-base">
            <Check className="w-5 h-5" /> Encaisser {formatAr(total)}
          </button>
        </div>
      )}

      {/* History */}
      <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-2 transition">
        <History className="w-4 h-4" />
        {showHistory ? 'Masquer' : 'Historique des ventes'}
        {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showHistory && (
        <div className="card p-4 animate-slide-up">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Historique ({sales.length} ventes)</h3>
          {recentSales.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-slate-500 text-sm">Aucune vente enregistrée</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{sale.buyerName}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(sale.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · '}<span className="font-mono">{sale.refCode}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-brand-700 dark:text-brand-400 tabular-nums">{formatAr(sale.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
