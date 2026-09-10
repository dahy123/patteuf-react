import { useState } from 'react'
import { useActionHistory, ACTION_LABELS } from '../context/ActionHistoryContext'
import {
  Clock, ChevronDown, ChevronUp, Package, Users, ShoppingCart, Shield,
} from 'lucide-react'

const CATEGORY_STYLES = {
  product: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
  stock: { icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
  client: { icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  sale: { icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50' },
  user: { icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50' },
}

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
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function formatDetails(details) {
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

export default function PageHistory({ category, maxItems = 10, label = 'Dernières actions' }) {
  const { history } = useActionHistory()
  const [expanded, setExpanded] = useState(false)

  // Filter by category
  const CATEGORY_MAP = {
    product: ['product_created', 'product_updated', 'product_deleted'],
    stock: ['stock_updated'],
    client: ['client_created', 'client_updated', 'client_deleted'],
    sale: ['sale_completed'],
    user: ['user_created', 'user_updated', 'user_deleted', 'user_role_changed'],
  }

  const actionTypes = CATEGORY_MAP[category] || []
  const filtered = history.filter(entry => actionTypes.includes(entry.type))
  const visibleItems = expanded ? filtered.slice(0, 20) : filtered.slice(0, maxItems)

  if (filtered.length === 0) return null

  const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.product
  const CatIcon = catStyle.icon

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm text-slate-500 hover:text-slate-700 py-2 transition"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{label} ({filtered.length})</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="space-y-1.5 animate-slide-up">
          {visibleItems.map(entry => {
            const detailText = formatDetails(entry.details)
            return (
              <div key={entry.id} className="card p-3 flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${catStyle.bg}`}>
                  <CatIcon className={`w-3.5 h-3.5 ${catStyle.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      {ACTION_LABELS[entry.type] || entry.type}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  {detailText && (
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{detailText}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">par {entry.userName}</p>
                </div>
              </div>
            )
          })}
          {filtered.length > visibleItems.length && (
            <p className="text-[10px] text-slate-400 text-center py-1">
              +{filtered.length - visibleItems.length} autres actions...
            </p>
          )}
        </div>
      )}
    </div>
  )
}
