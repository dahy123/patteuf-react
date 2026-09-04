import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatAr } from '../utils/helpers'
import {
  Users, Plus, Search, Phone, MapPin, Edit3, Trash2, X, Check,
  TrendingUp, User,
} from 'lucide-react'

export default function Clients() {
  const { clients, sales, addClient, updateClient, removeClient, searchClients } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [selectedClient, setSelectedClient] = useState(null)

  const filteredClients = searchQuery ? searchClients(searchQuery) : clients

  // Get sales for a specific client
  const getClientSales = (clientId) => {
    return sales.filter(s => s.clientId === clientId)
  }

  const resetForm = () => {
    setForm({ name: '', phone: '', address: '' })
    setEditId(null)
    setShowForm(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    if (editId) {
      updateClient(editId, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      })
    } else {
      addClient(form)
    }
    resetForm()
  }

  const handleEdit = (client) => {
    setForm({ name: client.name, phone: client.phone, address: client.address })
    setEditId(client.id)
    setShowForm(true)
  }

  const handleDelete = (client) => {
    if (window.confirm(`Supprimer le client "${client.name}" ?`)) {
      removeClient(client.id)
      if (selectedClient?.id === client.id) setSelectedClient(null)
    }
  }

  const handleViewClient = (client) => {
    setSelectedClient(selectedClient?.id === client.id ? null : client)
  }

  const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0)

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clients.length} client{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }} className="btn btn-primary">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 tabular-nums">{clients.length}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Clients totaux</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">{formatAr(totalRevenue)}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Revenu clients</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">
              {editId ? 'Modifier le client' : 'Nouveau client'}
            </h3>
            <button onClick={resetForm} className="btn btn-ghost p-1"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <User className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nom complet *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input pl-10"
                required
                autoFocus
              />
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="Numéro de téléphone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-300 absolute left-3 top-3" />
              <textarea
                placeholder="Adresse"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="input pl-10 min-h-[60px] resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-success flex-1">
                <Check className="w-4 h-4" /> {editId ? 'Enregistrer' : 'Ajouter'}
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
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou adresse..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Client Detail View */}
      {selectedClient && (
        <div className="card p-5 animate-scale-in border-brand-200 bg-brand-50/30">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center">
                <User className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{selectedClient.name}</h3>
                <p className="text-xs text-slate-400">
                  Client depuis {new Date(selectedClient.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedClient(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {selectedClient.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                {selectedClient.phone}
              </div>
            )}
            {selectedClient.address && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                {selectedClient.address}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
              <p className="text-xl font-bold text-brand-700 tabular-nums">{selectedClient.totalPurchases}</p>
              <p className="text-xs text-slate-500">Achats</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
              <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatAr(selectedClient.totalSpent)}</p>
              <p className="text-xs text-slate-500">Dépensé</p>
            </div>
          </div>

          {/* Client sales history */}
          {(() => {
            const clientSales = getClientSales(selectedClient.id)
            return clientSales.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Historique des achats</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {clientSales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between py-2 bg-white rounded-lg px-3 border border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500">
                          {new Date(sale.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex gap-1 mt-0.5">
                          {sale.items.map((it, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                              {it.name} x{it.qty}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-brand-700 tabular-nums">{formatAr(sale.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center">Aucun achat enregistré</p>
            )
          })()}

          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
            <button onClick={() => handleEdit(selectedClient)} className="btn btn-outline flex-1 text-sm">
              <Edit3 className="w-3.5 h-3.5" /> Modifier
            </button>
            <button onClick={() => handleDelete(selectedClient)} className="btn btn-ghost text-rose-500 hover:bg-rose-50 flex-1 text-sm">
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Client List */}
      <div className="space-y-2">
        {filteredClients.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">
              {searchQuery ? 'Aucun client trouvé' : 'Aucun client enregistré'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier client pour commencer'}
            </p>
          </div>
        ) : (
          filteredClients.map(client => {
            const isSelected = selectedClient?.id === client.id
            const clientSalesCount = client.totalPurchases
            return (
              <div
                key={client.id}
                onClick={() => handleViewClient(client)}
                className={`card card-interactive p-4 cursor-pointer transition-all duration-150 ${isSelected ? 'ring-2 ring-brand-400 border-brand-300' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-brand-100' : 'bg-slate-100'}`}>
                      <User className={`w-5 h-5 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm truncate">{client.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {client.phone}
                          </span>
                        )}
                        {client.address && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3" /> {client.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-brand-700 tabular-nums">{formatAr(client.totalSpent)}</p>
                    <p className="text-[10px] text-slate-400">{clientSalesCount} achat{clientSalesCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
