import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatAr } from '../utils/helpers'
import { PARRAIN_CASHBACK } from '../data/products'
import {
  Plus, Minus, X, Check, User, Phone, MapPin,
  Gift, ChevronDown, ChevronUp, History, Sparkles, Tag, PartyPopper,
  Package, Egg, Drumstick, Search, UserPlus,
} from 'lucide-react'

const productIcons = {
  'pack-1': Tag,
  'pack-2': Tag,
  'simple-3': Package,
  'simple-4': Egg,
  'simple-5': Drumstick,
}

export default function Sale() {
  const { getProductsWithStock, processSale, sales, clients, addClient, searchClients } = useApp()
  const products = getProductsWithStock()
  const [items, setItems] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  // Client selection state
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickClient, setQuickClient] = useState({ name: '', phone: '', address: '' })

  const filteredClients = clientSearchQuery ? searchClients(clientSearchQuery) : clients
  const selectedClient = clients.find(c => c.id === selectedClientId) || null

  // Auto-fill buyer info from selected client
  const buyerName = selectedClient?.name || quickClient.name || ''
  const buyerPhone = selectedClient?.phone || quickClient.phone || ''

  const addItem = (product) => {
    if (product.currentStock <= 0) return
    const existing = items.find(i => i.id === product.id)
    if (existing) {
      if (existing.qty >= product.currentStock) return
      setItems(items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
    } else {
      setItems([...items, {
        id: product.id,
        name: product.name,
        price: product.price,
        type: product.type,
        qty: 1,
        maxQty: product.currentStock,
      }])
    }
  }

  const updateItemQty = (itemId, newQty) => {
    if (newQty <= 0) setItems(items.filter(i => i.id !== itemId))
    else setItems(items.map(i => i.id === itemId ? { ...i, qty: Math.min(newQty, i.maxQty) } : i))
  }

  const removeItem = (itemId) => setItems(items.filter(i => i.id !== itemId))
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0)

  const cartHasPack = items.some(i => i.type === 'pack')
  const totalCashback = items.reduce((sum, i) => {
    const prod = products.find(p => p.id === i.id)
    return sum + (prod?.cashback || 0) * i.qty
  }, 0)

  const handleQuickCreate = () => {
    if (!quickClient.name.trim()) return
    const newClient = addClient(quickClient)
    setSelectedClientId(newClient.id)
    setQuickClient({ name: '', phone: '', address: '' })
    setShowQuickCreate(false)
    setShowClientDropdown(false)
  }

  const handleSelectClient = (client) => {
    setSelectedClientId(client.id)
    setClientSearchQuery('')
    setShowClientDropdown(false)
  }

  const handleClearClient = () => {
    setSelectedClientId('')
    setQuickClient({ name: '', phone: '', address: '' })
  }

  const handleSale = () => {
    if (items.length === 0) return
    const sale = processSale({
      items,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      clientId: selectedClientId || '',
    })
    setLastSale(sale)
    setShowSuccess(true)
    setItems([])
    setSelectedClientId('')
    setQuickClient({ name: '', phone: '', address: '' })
  }

  const recentSales = sales.slice(0, 15)
  const packs = products.filter(p => p.type === 'pack')
  const simples = products.filter(p => p.type === 'simple')

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Success Modal */}
      {showSuccess && lastSale && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-sm w-full text-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <PartyPopper className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Vente réalisée !</h2>
              <p className="text-sm text-slate-500 mt-1">Transaction enregistrée avec succès</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Acheteur</span>
                <span className="text-sm font-semibold text-slate-700">{lastSale.buyerName || 'Anonyme'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Montant</span>
                <span className="text-sm font-bold text-brand-700">{formatAr(lastSale.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Code réf.</span>
                <span className="font-mono text-sm font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">{lastSale.refCode}</span>
              </div>
              {lastSale.clientId && (
                <div className="flex items-center gap-2 text-brand-600">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-medium">Client lié au profil</span>
                </div>
              )}
              {lastSale.hasPack && (
                <div className="border-t border-slate-200 pt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Gift className="w-4 h-4" />
                    <span className="text-sm font-semibold">+{formatAr(lastSale.cashback)} cashback</span>
                  </div>
                  {lastSale.parrainRefCode && (
                    <div className="flex items-center gap-2 text-violet-600">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-medium">Parrain reçoit {formatAr(PARRAIN_CASHBACK)} de bonus</span>
                    </div>
                  )}
                </div>
              )}
              {!lastSale.hasPack && (
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs text-slate-400 italic">Produit simple — pas de cashback</p>
                </div>
              )}
            </div>
            <button onClick={() => setShowSuccess(false)} className="btn btn-primary w-full">Continuer</button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-slate-800">Point de vente</h1>
        <p className="text-slate-500 text-sm mt-0.5">Sélectionnez les produits à vendre</p>
      </div>

      {/* Packs */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-slate-700">Packs — Acheter et Gagner</h3>
          <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">+Cashback</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {packs.map(product => {
            const Icon = productIcons[product.id] || Tag
            const outOfStock = product.currentStock <= 0
            const lowStock = product.currentStock > 0 && product.currentStock <= 10
            return (
              <button key={product.id} onClick={() => addItem(product)} disabled={outOfStock}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 ${outOfStock ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60' : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 active:scale-[0.98] cursor-pointer'}`}>
                <div className="text-left flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${outOfStock ? 'bg-slate-100' : 'bg-brand-50'}`}>
                    <Icon className={`w-5 h-5 ${outOfStock ? 'text-slate-300' : 'text-brand-500'}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{product.name}</div>
                    <div className="text-xs text-slate-400">{formatAr(product.price)}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Gift className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] text-emerald-600 font-medium">+{formatAr(product.cashback)} cashback</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold tabular-nums ${outOfStock ? 'text-slate-300' : lowStock ? 'text-rose-500' : 'text-slate-700'}`}>{product.currentStock}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{outOfStock ? 'Épuisé' : 'restants'}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Produits simples */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Produits simples</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {simples.map(product => {
            const Icon = productIcons[product.id] || Package
            const outOfStock = product.currentStock <= 0
            const lowStock = product.currentStock > 0 && product.currentStock <= 10
            return (
              <button key={product.id} onClick={() => addItem(product)} disabled={outOfStock}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 ${outOfStock ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] cursor-pointer'}`}>
                <div className="text-left flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${outOfStock ? 'bg-slate-100' : 'bg-slate-50'}`}>
                    <Icon className={`w-5 h-5 ${outOfStock ? 'text-slate-300' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{product.name}</div>
                    <div className="text-xs text-slate-400">{formatAr(product.price)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold tabular-nums ${outOfStock ? 'text-slate-300' : lowStock ? 'text-rose-500' : 'text-slate-700'}`}>{product.currentStock}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{outOfStock ? 'Épuisé' : 'restants'}</div>
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
              <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-brand-700">{totalItems}</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Panier</h3>
            </div>
            <button onClick={() => setItems([])} className="text-xs text-rose-500 font-medium hover:text-rose-600">Vider</button>
          </div>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                    {item.type === 'pack' && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Pack</span>}
                  </div>
                  <p className="text-xs text-slate-400">{formatAr(item.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateItemQty(item.id, item.qty - 1)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="w-8 text-center font-bold text-slate-800 tabular-nums">{item.qty}</span>
                  <button onClick={() => updateItemQty(item.id, item.qty + 1)} disabled={item.qty >= item.maxQty} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition disabled:opacity-30"><Plus className="w-3.5 h-3.5" /></button>
                </div>
                <div className="w-20 text-right"><span className="text-sm font-bold text-slate-800 tabular-nums">{formatAr(item.price * item.qty)}</span></div>
                <button onClick={() => removeItem(item.id)} className="p-1 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Selection */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Client</h3>
          </div>
          {!selectedClientId && (
            <button onClick={() => setShowQuickCreate(!showQuickCreate)} className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:text-brand-700">
              <UserPlus className="w-3.5 h-3.5" /> Nouveau
            </button>
          )}
        </div>

        {/* Selected client display */}
        {selectedClient ? (
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-800">{selectedClient.name}</p>
                  <div className="flex items-center gap-2 text-xs text-brand-600">
                    {selectedClient.phone && <span>{selectedClient.phone}</span>}
                    {selectedClient.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedClient.address}</span>}
                  </div>
                </div>
              </div>
              <button onClick={handleClearClient} className="p-1.5 rounded-lg hover:bg-brand-100 text-brand-400 hover:text-brand-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedClient.refCode && (
              <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-brand-100">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Code parrainage</span>
                <span className="font-mono text-sm font-bold text-brand-700 tracking-wider">{selectedClient.refCode}</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Search existing clients */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un client existant..."
                value={clientSearchQuery}
                onChange={e => { setClientSearchQuery(e.target.value); setShowClientDropdown(true) }}
                onFocus={() => setShowClientDropdown(true)}
                className="input pl-10"
              />
            </div>

            {/* Client dropdown */}
            {showClientDropdown && clientSearchQuery && (
              <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto bg-white">
                {filteredClients.length === 0 ? (
                  <div className="p-3 text-center text-sm text-slate-400">
                    Aucun client trouvé
                  </div>
                ) : (
                  filteredClients.slice(0, 8).map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition text-left border-b border-slate-100 last:border-0"
                    >
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{client.name}</p>
                        <p className="text-[11px] text-slate-400">{client.phone || 'Pas de téléphone'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Quick create form */}
            {showQuickCreate && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 animate-scale-in">
                <div className="relative">
                  <User className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Nom du client *"
                    value={quickClient.name}
                    onChange={e => setQuickClient({ ...quickClient, name: e.target.value })}
                    className="input pl-10 text-sm"
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={quickClient.phone}
                    onChange={e => setQuickClient({ ...quickClient, phone: e.target.value })}
                    className="input pl-10 text-sm"
                  />
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={quickClient.address}
                    onChange={e => setQuickClient({ ...quickClient, address: e.target.value })}
                    className="input pl-10 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleQuickCreate} disabled={!quickClient.name.trim()} className="btn btn-success flex-1 text-sm py-2">
                    <Check className="w-3.5 h-3.5" /> Créer et sélectionner
                  </button>
                  <button onClick={() => { setShowQuickCreate(false); setQuickClient({ name: '', phone: '', address: '' }) }} className="btn btn-ghost text-sm py-2">Annuler</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Manual entry fallback */}
        {!selectedClientId && !showQuickCreate && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <p className="text-xs text-slate-400 italic">Ou saisissez manuellement :</p>
            <div className="relative">
              <User className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Nom de l'acheteur" value={quickClient.name} onChange={e => setQuickClient({ ...quickClient, name: e.target.value })} className="input pl-10 text-sm" />
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="tel" placeholder="Numéro de téléphone" value={quickClient.phone} onChange={e => setQuickClient({ ...quickClient, phone: e.target.value })} className="input pl-10 text-sm" />
            </div>
          </div>
        )}

        {/* Parrainage auto */}
        {cartHasPack && selectedClient?.parrainRefCode && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-semibold text-amber-700">
                Parrainage auto — <span className="font-mono">{selectedClient.parrainRefCode}</span> recevra {formatAr(PARRAIN_CASHBACK)} de bonus
              </p>
            </div>
          </div>
        )}
        {cartHasPack && !selectedClient?.parrainRefCode && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-xs text-slate-400 italic">Pas de parrain associé à ce client. Ajoutez un parrain dans la gestion clients.</p>
          </div>
        )}
        {!cartHasPack && items.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-xs text-slate-400 italic">Les produits simples ne génèrent pas de cashback ni de bonus parrainage.</p>
          </div>
        )}
      </div>

      {/* Total & Checkout */}
      {items.length > 0 && (
        <div className="card p-5 animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total</p>
              <p className="text-3xl font-bold text-slate-800 tabular-nums">{formatAr(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">{totalItems} article{totalItems > 1 ? 's' : ''}</p>
              {cartHasPack && (
                <p className="text-xs text-emerald-500 font-medium">+{formatAr(totalCashback)} cashback</p>
              )}
              {selectedClient && (
                <p className="text-[10px] text-brand-500 font-medium mt-0.5">Client: {selectedClient.name}</p>
              )}
            </div>
          </div>
          <button onClick={handleSale} className="btn btn-success w-full py-3.5 text-base">
            <Check className="w-5 h-5" /> Encaisser {formatAr(total)}
          </button>
        </div>
      )}

      {/* History */}
      <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 py-2 transition">
        <History className="w-4 h-4" />
        {showHistory ? 'Masquer' : 'Historique des ventes'}
        {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showHistory && (
        <div className="card p-4 animate-slide-up">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Historique ({sales.length} ventes)</h3>
          {recentSales.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Aucune vente enregistrée</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      {sale.hasPack ? <Gift className="w-3.5 h-3.5 text-emerald-500" /> : <Package className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{sale.buyerName}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(sale.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · '}<span className="font-mono">{sale.refCode}</span>
                      </p>
                      <div className="flex gap-1 mt-0.5">
                        {sale.items.map((it, idx) => (
                          <span key={idx} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                            {it.name} x{it.qty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-brand-700 tabular-nums">{formatAr(sale.total)}</span>
                    {sale.hasPack && <p className="text-[10px] text-emerald-500 font-medium">+{formatAr(sale.cashback)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
