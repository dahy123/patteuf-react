import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatAr } from '../utils/helpers'
import { Package, Pencil, X, Check, ArrowUpCircle, Tag, Gift } from 'lucide-react'

export default function Stock() {
  const { getProductsWithStock, updateStock } = useApp()
  const products = getProductsWithStock()
  const [editId, setEditId] = useState(null)
  const [editQty, setEditQty] = useState('')

  const handleSaveQty = (productId) => {
    updateStock(productId, parseInt(editQty) || 0)
    setEditId(null)
    setEditQty('')
  }

  const totalStock = products.reduce((s, p) => s + p.currentStock, 0)
  const totalValue = products.reduce((s, p) => s + p.currentStock * p.price, 0)

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Gestion des stocks</h1>
        <p className="text-slate-500 text-sm mt-0.5">{products.length} produits configurés</p>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-200 text-xs font-medium uppercase tracking-wider">Stock total</p>
            <p className="text-4xl font-bold mt-1 tabular-nums">{totalStock}</p>
            <p className="text-brand-300 text-sm mt-0.5">unités disponibles</p>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Package className="w-8 h-8 text-white/80" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-brand-200 text-sm">Valeur du stock</span>
          <span className="text-lg font-bold">{formatAr(totalValue)}</span>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {products.map(product => {
          const pct = Math.min(100, (product.currentStock / 100) * 100)
          const barColor = product.currentStock <= 10 ? 'bg-rose-500' : product.currentStock <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
          const badgeColor = product.currentStock <= 10 ? 'bg-rose-100 text-rose-700' : product.currentStock <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          const isPack = product.type === 'pack'

          return (
            <div key={product.id} className="card card-interactive p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${product.currentStock <= 10 ? 'bg-rose-50' : isPack ? 'bg-brand-50' : 'bg-slate-50'}`}>
                    {isPack ? (
                      <Tag className={`w-5 h-5 ${product.currentStock <= 10 ? 'text-rose-500' : 'text-brand-500'}`} />
                    ) : (
                      <Package className={`w-5 h-5 ${product.currentStock <= 10 ? 'text-rose-500' : 'text-slate-500'}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800 text-sm">{product.name}</h3>
                      {isPack && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Pack</span>}
                    </div>
                    <p className="text-xs text-slate-400">{formatAr(product.price)} / unité</p>
                    {isPack && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Gift className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 font-medium">+{formatAr(product.cashback)} cashback</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditId(product.id); setEditQty(product.currentStock.toString()) }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`badge ${badgeColor}`}>{product.currentStock <= 10 ? 'Critique' : product.currentStock <= 30 ? 'Bas' : 'OK'}</span>
                  <span className="text-sm font-bold text-slate-700 tabular-nums">{product.currentStock} <span className="text-xs font-normal text-slate-400">unités</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {editId === product.id ? (
                <div className="flex items-center gap-2 animate-scale-in">
                  <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} className="input flex-1" min="0" autoFocus />
                  <button onClick={() => handleSaveQty(product.id)} className="btn btn-success px-3 py-2"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditId(null)} className="btn btn-ghost px-3 py-2"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {[{ val: 10, label: '+10' }, { val: 50, label: '+50' }, { val: 100, label: '+100' }].map(btn => (
                    <button key={btn.val} onClick={() => updateStock(product.id, product.currentStock + btn.val)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-50 hover:bg-brand-50 text-slate-600 hover:text-brand-700 text-xs font-semibold transition border border-slate-100 hover:border-brand-200">
                      <ArrowUpCircle className="w-3.5 h-3.5" />{btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
