import { useApp } from '../context/AppContext'
import { formatAr } from '../utils/helpers'
import {
  Package, ShoppingCart, TrendingUp, Gift,
  AlertTriangle, Users, ArrowRight, Clock, Wallet, Tag,
} from 'lucide-react'

export default function Dashboard() {
  const { getStats, sales, getProductsWithStock, cagnottes } = useApp()
  const stats = getStats()
  const products = getProductsWithStock()

  const statCards = [
    {
      label: 'Stock Total',
      value: stats.totalStock,
      icon: Package,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-700',
    },
    {
      label: 'Ventes',
      value: stats.totalSales,
      icon: ShoppingCart,
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-700',
    },
    {
      label: 'Revenu',
      value: formatAr(stats.totalRevenue),
      icon: TrendingUp,
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      valueColor: 'text-violet-700',
    },
    {
      label: 'Cashback',
      value: formatAr(stats.totalCashback),
      icon: Gift,
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-700',
    },
  ]

  const recentSales = sales.slice(0, 5)
  const topCagnottes = [...cagnottes].sort((a, b) => b.balance - a.balance).slice(0, 5)

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Tableau de bord</h1>
          <p className="text-slate-500 text-sm mt-0.5">Vue d'ensemble de votre activité</p>
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
              <p className="text-xs text-slate-500 mt-1 font-medium">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts.length > 0 && (
        <div className="card border-rose-200 bg-rose-50/80 p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-rose-700">Stock faible</h3>
          </div>
          <div className="space-y-1.5">
            {stats.lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-sm text-rose-600">{p.name}</span>
                <span className="badge bg-rose-100 text-rose-700">{p.currentStock} restants</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Overview */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">État des stocks</h3>
          </div>
          <a href="/stock" className="text-xs text-brand-600 font-medium no-underline flex items-center gap-1 hover:text-brand-700 transition-colors">
            Gérer <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        <div className="space-y-3">
          {products.map(product => {
            const pct = Math.min(100, (product.currentStock / 100) * 100)
            const color = product.currentStock <= 10 ? 'bg-rose-500' : product.currentStock <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
            const isPack = product.type === 'pack'
            return (
              <div key={product.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 font-medium">{product.name}</span>
                    {isPack && <Tag className="w-3 h-3 text-brand-400" />}
                  </div>
                  <span className="text-sm font-bold text-slate-800 tabular-nums">{product.currentStock}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Ventes récentes</h3>
          </div>
          <a href="/vente" className="text-xs text-brand-600 font-medium no-underline flex items-center gap-1 hover:text-brand-700 transition-colors">
            Voir tout <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        {recentSales.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Aucune vente enregistrée</p>
            <a href="/vente" className="text-brand-600 text-sm font-medium no-underline mt-1 inline-block">
              Commencer une vente →
            </a>
          </div>
        ) : (
          <div className="space-y-0">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center">
                    {sale.hasPack ? <Gift className="w-4 h-4 text-brand-500" /> : <Users className="w-4 h-4 text-brand-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{sale.buyerName}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(sale.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {' · '}
                      <span className="font-mono text-slate-500">{sale.refCode}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-700">{formatAr(sale.total)}</p>
                  {sale.hasPack && <p className="text-[10px] text-emerald-500 font-medium">+{formatAr(sale.cashback)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Cagnottes */}
      {topCagnottes.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">Top Cagnottes</h3>
            </div>
            <a href="/cagnotte" className="text-xs text-brand-600 font-medium no-underline flex items-center gap-1 hover:text-brand-700 transition-colors">
              Voir tout <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-0">
            {topCagnottes.map((c, idx) => (
              <div key={c.refCode} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{c.buyerName || 'Anonyme'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{c.refCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600 tabular-nums">{formatAr(c.balance)}</p>
                  <p className="text-[10px] text-slate-400">{c.cashbacks.length} gains</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
