import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatAr } from '../utils/helpers'
import { Package, Plus, Pencil, Trash2, X, Check, ArrowUpCircle } from 'lucide-react'

export default function Stock() {
  const { packs, updatePackQuantity, addPack, removePack } = useApp()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPack, setNewPack] = useState({ name: '', quantity: '', price: 3000 })
  const [editId, setEditId] = useState(null)
  const [editQty, setEditQty] = useState('')

  const handleAddPack = (e) => {
    e.preventDefault()
    if (!newPack.name || !newPack.quantity) return
    addPack(newPack.name, parseInt(newPack.quantity), parseInt(newPack.price) || 3000)
    setNewPack({ name: '', quantity: '', price: 3000 })
    setShowAddForm(false)
  }

  const handleSaveQty = (packId) => {
    updatePackQuantity(packId, parseInt(editQty))
    setEditId(null)
    setEditQty('')
  }

  const handleRemovePack = (packId, packName) => {
    if (window.confirm(`Supprimer "${packName}" ?`)) removePack(packId)
  }

  const totalStock = packs.reduce((s, p) => s + p.quantity, 0)
  const totalValue = packs.reduce((s, p) => s + p.quantity * p.price, 0)

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Gestion des stocks</h1>
          <p className="text-slate-500 text-sm mt-0.5">{packs.length} packs configurés</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Ajouter</span>
        </button>
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

      {/* Add Form */}
      {showAddForm && (
        <div className="card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Nouveau Pack</h3>
            <button onClick={() => setShowAddForm(false)} className="btn btn-ghost p-1"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleAddPack} className="space-y-3">
            <input type="text" placeholder="Nom du pack" value={newPack.name} onChange={e => setNewPack({ ...newPack, name: e.target.value })} className="input" required />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Quantité</label>
                <input type="number" placeholder="0" value={newPack.quantity} onChange={e => setNewPack({ ...newPack, quantity: e.target.value })} className="input" min="0" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Prix (Ar)</label>
                <input type="number" placeholder="3000" value={newPack.price} onChange={e => setNewPack({ ...newPack, price: e.target.value })} className="input" min="0" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-success flex-1"><Check className="w-4 h-4" /> Enregistrer</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-outline">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Pack List */}
      <div className="space-y-3">
        {packs.map(pack => {
          const pct = Math.min(100, (pack.quantity / 100) * 100)
          const barColor = pack.quantity <= 10 ? 'bg-rose-500' : pack.quantity <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
          const badgeColor = pack.quantity <= 10 ? 'bg-rose-100 text-rose-700' : pack.quantity <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'

          return (
            <div key={pack.id} className="card card-interactive p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pack.quantity <= 10 ? 'bg-rose-50' : pack.quantity <= 30 ? 'bg-amber-50' : 'bg-brand-50'}`}>
                    <Package className={`w-5 h-5 ${pack.quantity <= 10 ? 'text-rose-500' : pack.quantity <= 30 ? 'text-amber-500' : 'text-brand-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{pack.name}</h3>
                    <p className="text-xs text-slate-400">{formatAr(pack.price)} / unité</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditId(pack.id); setEditQty(pack.quantity.toString()) }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleRemovePack(pack.id, pack.name)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`badge ${badgeColor}`}>{pack.quantity <= 10 ? 'Critique' : pack.quantity <= 30 ? 'Bas' : 'OK'}</span>
                  <span className="text-sm font-bold text-slate-700 tabular-nums">{pack.quantity} <span className="text-xs font-normal text-slate-400">unités</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {editId === pack.id ? (
                <div className="flex items-center gap-2 animate-scale-in">
                  <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} className="input flex-1" min="0" autoFocus />
                  <button onClick={() => handleSaveQty(pack.id)} className="btn btn-success px-3 py-2"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditId(null)} className="btn btn-ghost px-3 py-2"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {[{ val: 10, label: '+10' }, { val: 50, label: '+50' }, { val: 100, label: '+100' }].map(btn => (
                    <button key={btn.val} onClick={() => updatePackQuantity(pack.id, pack.quantity + btn.val)}
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

      {packs.length === 0 && (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aucun pack configuré</p>
          <p className="text-slate-400 text-sm mt-1">Ajoutez votre premier pack pour commencer</p>
        </div>
      )}
    </div>
  )
}
