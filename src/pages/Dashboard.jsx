import { useApp } from '../context/AppContext'
import { formatAr } from '../utils/helpers'
import {
  Package, ShoppingCart, TrendingUp, Gift,
  AlertTriangle, Users, ArrowRight, Clock,
} from 'lucide-react'

export default function Dashboard() {
  const { getStats, sales, packs } = useApp()
  const stats = getStats()

  const statCards = [
    {
      label: 'Stock Total',
      value: stats.totalStock,
      sub: `${packs.length} packs`,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      darkGradient: 'from-blue-600 to-blue-700',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      valueColor: 'text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Ventes',
      value: stats.totalSales,
      sub: 'transactions',
      icon: ShoppingCart,
      gradient: 'from-emerald-500 to-emerald-600',
      darkGradient: 'from-emerald-600 to-emerald-700',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      valueColor: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Revenu',
      value: formatAr(stats.totalRevenue),
      sub: 'total',
      icon: TrendingUp,
      gradient: 'from-violet-500 to-violet-600',
      darkGradient: 'from-violet-600 to-violet-700',
      bg: 'bg-violet-50 dark:bg-violet-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
      valueColor: 'text-violet-700 dark:text-violet-300',
    },
    {
      label: 'Cashback',
      value: formatAr(stats.totalCashback),
      sub: 'distribué',
      icon: Gift,
      gradient: 'from-amber-500 to-amber-600',
      darkGradient: 'from-amber-600 to-amber-700',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      valueColor: 'text-amber-700 dark:text-amber-300',
    },
  ]

  const recentSales = sales.slice(0, 5)

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tableau de bord</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Vue d'ensemble de votre activité</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shadow-sm shadow-brand-100 dark:shadow-brand-500/10">
          <span className="text-lg">🐾</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, idx) => (
          <div key={card.label} className="card p-4 animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4.5 h-4.5 ${card.iconColor}`} strokeWidth={2} />
              </div>
            </div>
            <div>
              <p className={`text-2xl font-bold leading-tight tabular-nums ${card.valueColor}`}>
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockPacks.length > 0 && (
        <div className="card border-rose-200 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Stock faible</h3>
          </div>
          <div className="space-y-1.5">
            {stats.lowStockPacks.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-sm text-rose-600 dark:text-rose-400">{p.name}</span>
                <span className="badge bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400">{p.quantity} restants</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Overview */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">État des stocks</h3>
          </div>
          <a href="/stock" className="text-xs text-brand-600 dark:text-brand-400 font-medium no-underline flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
            Gérer <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        <div className="space-y-3">
          {packs.map(pack => {
            const pct = Math.min(100, (pack.quantity / 100) * 100)
            const color = pack.quantity <= 10
              ? 'bg-rose-500'
              : pack.quantity <= 30
              ? 'bg-amber-500'
              : 'bg-emerald-500'
            return (
              <div key={pack.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{pack.name}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">{pack.quantity}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ventes récentes</h3>
          </div>
          <a href="/vente" className="text-xs text-brand-600 dark:text-brand-400 font-medium no-underline flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
            Voir tout <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        {recentSales.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-slate-400 dark:text-slate-500 text-sm">Aucune vente enregistrée</p>
            <a href="/vente" className="text-brand-600 dark:text-brand-400 text-sm font-medium no-underline mt-1 inline-block">
              Commencer une vente →
            </a>
          </div>
        ) : (
          <div className="space-y-0">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{sale.buyerName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(sale.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {' · '}
                      <span className="font-mono text-slate-500 dark:text-slate-400">{sale.refCode}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-700 dark:text-brand-400">{formatAr(sale.total)}</p>
                  <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium">+{formatAr(sale.cashback)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
