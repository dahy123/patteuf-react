import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatAr } from '../utils/helpers'
import {
  Package, Plus, Pencil, Trash2, X, Check, Tag, Gift, Search,
} from 'lucide-react'

export default function Products() {
  const { products, addProduct, updateProduct, removeProduct } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({
    name: '', price: '', type: 'simple', cashback: '', parrainBonus: '', stock: '',
  })
  const [formError, setFormError] = useState('')

  const filteredProducts = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products

  const packs = filteredProducts.filter(p => p.type === 'pack')
  const simples = filteredProducts.filter(p => p.type === 'simple')

  const resetForm = () => {
    setForm({ name: '', price: '', type: 'simple', cashback: '', parrainBonus: '', stock: '' })
    setFormError('')
    setEditId(null)
    setShowForm(false)
  }

  const startEdit = (product) => {
    setForm({
      name: product.name,
      price: product.price.toString(),
      type: product.type,
      cashback: product.cashback?.toString() || '',
      parrainBonus: product.parrainBonus?.toString() || '',
      stock: product.stock?.toString() || '',
    })
    setEditId(product.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) {
      setFormError('Le nom est requis')
      return
    }
    if (!form.price || Number(form.price) <= 0) {
      setFormError('Le prix doit etre superieur a 0')
      return
    }

    if (editId) {
      updateProduct(editId, {
        name: form.name.trim(),
        price: Number(form.price),
        type: form.type,
        cashback: form.type === 'pack' ? Number(form.cashback) || 0 : 0,
        parrainBonus: form.type === 'pack' ? Number(form.parrainBonus) || 0 : 0,
        stock: Number(form.stock) || 0,
      })
    } else {
      addProduct({
        name: form.name.trim(),
        price: Number(form.price),
        type: form.type,
        cashback: form.type === 'pack' ? Number(form.cashback) || 0 : 0,
        parrainBonus: form.type === 'pack' ? Number(form.parrainBonus) || 0 : 0,
        stock: Number(form.stock) || 0,
      })
    }
    resetForm()
  }

  const handleDelete = (product) => {
    if (window.confirm(`Supprimer le produit "${product.name}" ?`)) {
      removeProduct(product.id)
    }
  }

  const ProductCard = ({ product }) => {
    const isPack = product.type === 'pack'
    return (
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPack ? 'bg-brand-50' : 'bg-slate-50'}`}>
              {isPack ? (
                <Tag className="w-5 h-5 text-brand-500" />
              ) : (
                <Package className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 text-sm">{product.name}</h3>
                {isPack && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Pack</span>}
              </div>
              <p className="text-xs text-slate-400">{formatAr(product.price)}</p>
              {isPack && product.cashback > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Gift className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-medium">+{formatAr(product.cashback)} cashback</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => startEdit(product)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDelete(product)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Produits</h1>
          <p className="text-slate-500 text-sm mt-0.5">{products.length} produit{products.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn btn-primary">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">{editId ? 'Modifier le produit' : 'Nouveau produit'}</h3>
            <button onClick={resetForm} className="btn btn-ghost p-1"><X className="w-4 h-4" /></button>
          </div>
          {formError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 mb-3">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Nom du produit</label>
              <input type="text" placeholder="Ex: 1 Patte + 2 Oeufs" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input" autoFocus required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, type: 'simple' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition ${form.type === 'simple' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                  <Package className="w-4 h-4" /> Simple
                </button>
                <button type="button" onClick={() => setForm({ ...form, type: 'pack' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition ${form.type === 'pack' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                  <Tag className="w-4 h-4" /> Pack
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Prix (Ar)</label>
                <input type="number" placeholder="0" value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  className="input" min="0" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Stock initial</label>
                <input type="number" placeholder="0" value={form.stock}
                  onChange={e => setForm({ ...form, stock: e.target.value })}
                  className="input" min="0" />
              </div>
            </div>
            {form.type === 'pack' && (
              <div className="grid grid-cols-2 gap-3 animate-scale-in">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">Cashback (Ar)</label>
                  <input type="number" placeholder="0" value={form.cashback}
                    onChange={e => setForm({ ...form, cashback: e.target.value })}
                    className="input" min="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">Bonus parrain (Ar)</label>
                  <input type="number" placeholder="0" value={form.parrainBonus}
                    onChange={e => setForm({ ...form, parrainBonus: e.target.value })}
                    className="input" min="0" />
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-success flex-1">
                <Check className="w-4 h-4" /> {editId ? 'Modifier' : 'Creer'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-outline">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Rechercher un produit..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} className="input pl-10" />
        </div>
      </div>

      {/* Packs */}
      {packs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-semibold text-slate-700">Packs ({packs.length})</h3>
            <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">+Cashback</span>
          </div>
          <div className="space-y-2">
            {packs.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      )}

      {/* Simples */}
      {simples.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Produits simples ({simples.length})</h3>
          </div>
          <div className="space-y-2">
            {simples.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">{searchQuery ? 'Aucun produit trouve' : 'Aucun produit'}</p>
        </div>
      )}
    </div>
  )
}
