import { useApp } from '../context/AppContext'
import { formatAr, CASHBACK_AMOUNT, PARRAIN_CASHBACK } from '../utils/helpers'
import { products } from '../data/products'
import { Gift, Users, ShoppingCart, Sparkles, Trophy, ChevronRight, Zap, TrendingUp, HelpCircle, Award } from 'lucide-react'

export default function Marketing() {
  const { cagnottes, getStats } = useApp()
  const stats = getStats()
  const topCagnottes = [...cagnottes].sort((a, b) => b.balance - a.balance).slice(0, 10)

  // Get pack prices from products
  const pack1 = products.find(p => p.id === 'pack-1')
  const pack2 = products.find(p => p.id === 'pack-2')
  const packPrices = [pack1?.price, pack2?.price].filter(Boolean)
  const minPackPrice = packPrices.length > 0 ? Math.min(...packPrices) : 2600

  const steps = [
    { num: 1, icon: ShoppingCart, title: 'Achetez un Pack', desc: `Chaque pack coûte à partir de ${formatAr(minPackPrice)}. Vous recevez votre code unique.`, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
    { num: 2, icon: Gift, title: `Gagnez ${formatAr(CASHBACK_AMOUNT)}`, desc: 'Immédiatement, 200 Ar sont ajoutés à votre cagnotte !', bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { num: 3, icon: Users, title: 'Parrainez vos amis', desc: `Partagez votre code. Quand un ami l'utilise, vous gagnez ${formatAr(PARRAIN_CASHBACK)} !`, bg: 'bg-violet-50', iconColor: 'text-violet-500' },
  ]

  const faq = [
    { q: 'Comment utiliser mon code ?', a: 'Lors de votre prochain achat, entrez votre code dans le champ "Code Parrain" à la caisse.' },
    { q: 'Puis-je cumuler les cashbacks ?', a: `Oui ! Chaque achat génère un nouveau cashback de ${formatAr(CASHBACK_AMOUNT)}.` },
    { q: 'Comment consulter ma cagnotte ?', a: 'Allez dans l\'onglet "Cagnotte" et entrez votre code unique.' },
    { q: 'Y a-t-il une limite au cashback ?', a: 'Non ! Plus vous achetez et plus vous parrainez, plus votre cagnotte grossit.' },
    { q: 'Les produits simples génèrent-ils du cashback ?', a: 'Non, seuls les packs "Acheter et Gagner" génèrent du cashback et des bonus de parrainage.' },
  ]

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-700 via-brand-800 to-violet-900 rounded-2xl p-6 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-20 h-20 border-2 border-white rounded-full" />
          <div className="absolute bottom-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-white rounded-full" />
        </div>
        <div className="relative">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"><Sparkles className="w-7 h-7" /></div>
          <h1 className="text-2xl font-bold">Acheter et Gagner</h1>
          <p className="text-brand-200 text-sm mt-2 max-w-xs mx-auto">Programme de cashback exclusif pour chaque achat de pack</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Comment ça marche
        </h2>
        {steps.map((step, idx) => (
          <div key={step.num} className="card card-interactive p-4 animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl ${step.bg} flex items-center justify-center shrink-0`}>
                <step.icon className={`w-6 h-6 ${step.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{step.num}</span>
                  <h3 className="font-semibold text-slate-800 text-sm">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-4 text-center">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2"><Gift className="w-5 h-5 text-emerald-600" /></div>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">{formatAr(CASHBACK_AMOUNT)}</p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">Cashback / pack</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200 rounded-2xl p-4 text-center">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-2"><Users className="w-5 h-5 text-violet-600" /></div>
          <p className="text-2xl font-bold text-violet-700 tabular-nums">{formatAr(PARRAIN_CASHBACK)}</p>
          <p className="text-xs text-violet-600 mt-1 font-medium">Bonus parrain</p>
        </div>
      </div>

      {/* Stats */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" /> Statistiques
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-brand-700 tabular-nums">{stats.totalCagnottes}</p>
            <p className="text-xs text-slate-500 mt-0.5">Clients actifs</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatAr(stats.totalCashback)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Cashback distribué</p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {topCagnottes.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Top Cagnottes
            </h3>
            <span className="badge bg-amber-100 text-amber-700">Podium</span>
          </div>
          <div className="space-y-0">
            {topCagnottes.map((c, idx) => (
              <div key={c.refCode} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-300/50' : idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' : idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {idx === 0 ? <Award className="w-4 h-4" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{c.buyerName || 'Anonyme'}</p>
                  <p className="text-[11px] text-slate-400">{c.cashbacks.length} gains · {c.refCode}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600 tabular-nums">{formatAr(c.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-400" /> Questions fréquentes
        </h2>
        {faq.map((item, idx) => (
          <details key={idx} className="card group">
            <summary className="p-4 cursor-pointer flex items-center justify-between list-none text-sm font-medium text-slate-700 hover:text-brand-600 transition">
              <span>{item.q}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="px-4 pb-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-3">{item.a}</div>
          </details>
        ))}
      </div>
    </div>
  )
}
