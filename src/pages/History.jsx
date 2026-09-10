import { useState } from 'react'
import { useActionHistory, ACTION_TYPES, ACTION_LABELS } from '../context/ActionHistoryContext'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  Clock, Trash2, Package, Users, ShoppingCart, Wallet, Shield, Settings,
  Cloud, CloudOff, RefreshCw, Check,
} from 'lucide-react'

const CATEGORY_ICONS = {
  product: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
  stock: { icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
  client: { icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  sale: { icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50' },
  user: { icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50' },
  cagnotte: { icon: Wallet, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  settings: { icon: Settings, color: 'text-gray-500', bg: 'bg-gray-50' },
}

const ACTION_TYPE_TO_CATEGORY = {
  [ACTION_TYPES.PRODUCT_CREATED]: 'product',
  [ACTION_TYPES.PRODUCT_UPDATED]: 'product',
  [ACTION_TYPES.PRODUCT_DELETED]: 'product',
  [ACTION_TYPES.STOCK_UPDATED]: 'stock',
  [ACTION_TYPES.CLIENT_CREATED]: 'client',
  [ACTION_TYPES.CLIENT_UPDATED]: 'client',
  [ACTION_TYPES.CLIENT_DELETED]: 'client',
  [ACTION_TYPES.SALE_COMPLETED]: 'sale',
  [ACTION_TYPES.USER_CREATED]: 'user',
  [ACTION_TYPES.USER_UPDATED]: 'user',
  [ACTION_TYPES.USER_DELETED]: 'user',
  [ACTION_TYPES.USER_ROLE_CHANGED]: 'user',
  [ACTION_TYPES.CAGNOTTE_WITHDRAWAL]: 'cagnotte',
  [ACTION_TYPES.SETTINGS_UPDATED]: 'settings',
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'Tout' },
  { value: 'product', label: 'Produits' },
  { value: 'client', label: 'Clients' },
  { value: 'sale', label: 'Ventes' },
  { value: 'user', label: 'Utilisateurs' },
  { value: 'stock', label: 'Stock' },
  { value: 'cagnotte', label: 'Cagnotte' },
]

function formatTimestamp(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffH < 24) return `Il y a ${diffH}h`
  if (diffD < 7) return `Il y a ${diffD}j`

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDetails(type, details) {
  if (!details || Object.keys(details).length === 0) return null

  const parts = []
  if (details.productName) parts.push(details.productName)
  if (details.clientName) parts.push(details.clientName)
  if (details.userName) parts.push(details.userName)
  if (details.buyerName) parts.push(`Acheteur: ${details.buyerName}`)
  if (details.oldValue !== undefined && details.newValue !== undefined) {
    parts.push(`${details.oldValue} → ${details.newValue}`)
  }
  if (details.amount) parts.push(`${details.amount} Ar`)
  if (details.saleTotal) parts.push(`Total: ${details.saleTotal} Ar`)
  if (details.items && Array.isArray(details.items)) {
    parts.push(details.items.map(i => `${i.name} x${i.qty}`).join(', '))
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

export default function History() {
  const { history, clearHistory, syncStatus } = useActionHistory()
  const { isAdmin } = useAuth()
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  if (!isAdmin) {
    return (
      <div className="p-4 animate-fade-in">
        <div className="card p-12 text-center">
          <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Accès réservé aux administrateurs</p>
        </div>
      </div>
    )
  }

  const filteredHistory = history.filter(entry => {
    // Category filter
    if (filter !== 'all') {
      const category = ACTION_TYPE_TO_CATEGORY[entry.type]
      if (category !== filter) return false
    }
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const label = (ACTION_LABELS[entry.type] || '').toLowerCase()
      const userName = (entry.userName || '').toLowerCase()
      const detailsStr = formatDetails(entry.type, entry.details)?.toLowerCase() || ''
      if (!label.includes(q) && !userName.includes(q) && !detailsStr.includes(q)) return false
    }
    return true
  })

  const handleClear = () => {
    setShowClearConfirm(true)
  }

  const confirmClear = () => {
    clearHistory()
    setShowClearConfirm(false)
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Historique</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-slate-500 text-sm">
              {history.length} action{history.length > 1 ? 's' : ''} enregistrée{history.length > 1 ? 's' : ''}
            </p>
            {syncStatus !== 'idle' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                {syncStatus === 'synced' && <Check className="w-3 h-3 text-emerald-500" />}
                {syncStatus === 'error' && <CloudOff className="w-3 h-3 text-rose-400" />}
                {syncStatus === 'syncing' ? 'Sync...' : syncStatus === 'synced' ? 'Cloud OK' : 'Erreur sync'}
              </span>
            )}
          </div>
        </div>
        {history.length > 0 && (
          <button onClick={handleClear} className="btn btn-outline text-rose-500 border-rose-200 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card p-3">
        <input
          type="text"
          placeholder="Rechercher dans l'historique..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input text-sm"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              filter === opt.value
                ? 'bg-gray-900 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filteredHistory.length === 0 ? (
        <div className="card p-12 text-center">
          <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {history.length === 0 ? 'Aucune action enregistrée' : 'Aucun résultat'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHistory.map(entry => {
            const category = ACTION_TYPE_TO_CATEGORY[entry.type] || 'settings'
            const catStyle = CATEGORY_ICONS[category] || CATEGORY_ICONS.settings
            const CatIcon = catStyle.icon
            const detailText = formatDetails(entry.type, entry.details)

            return (
              <div key={entry.id} className="card p-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${catStyle.bg}`}>
                  <CatIcon className={`w-4 h-4 ${catStyle.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {ACTION_LABELS[entry.type] || entry.type}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  {detailText && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{detailText}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">par {entry.userName}</p>
                </div>
              </div>        )}
      )}

      <ConfirmDialog
        open={showClearConfirm}
        title="Tout supprimer ?"
        message="Tout l'historique des actions sera définitivement effacé."
        confirmLabel="Tout supprimer"
        onConfirm={confirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  )
}
    </div>
  )
}
