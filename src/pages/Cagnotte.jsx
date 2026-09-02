import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatAr } from '../utils/helpers'
import { Search, Wallet, Gift, Users, TrendingUp, ArrowRight, Crown, Award } from 'lucide-react'

export default function Cagnotte() {
  const { cagnottes } = useApp()
  const [searchCode, setSearchCode] = useState('')
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = () => {
    setError(''); setFound(null)
    const code = searchCode.trim().toUpperCase()
    if (!code) { setError('Veuillez entrer un code'); return }
    const cagnotte = cagnottes.find(c => c.refCode === code)
    if (cagnotte) setFound(cagnotte)
    else setError('Aucune cagnotte trouvée pour ce code')
  }

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Mes cagnottes</h1>
        <p className="text-slate-500 text-sm mt-0.5">Consultez votre solde avec votre code</p>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Rechercher une cagnotte</h3>
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Votre code (ex: A1B2C3D4)" value={searchCode}
            onChange={e => setSearchCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="input font-mono uppercase tracking-wider text-center text-sm flex-1" maxLength={8} />
          <button onClick={handleSearch} className="btn btn-primary px-5"><Search className="w-4 h-4" /></button>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-3 text-rose-600 text-sm bg-rose-50 rounded-lg px-3 py-2">
            <span className="text-xs">✕</span> {error}
          </div>
        )}
      </div>

      {/* Found Cagnotte */}
      {found && (
        <div className="animate-slide-up">
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm"><Wallet className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-lg">{found.buyerName || 'Anonyme'}</h3>
                <p className="text-emerald-100 text-xs font-mono tracking-wider">{found.refCode}</p>
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-emerald-200 text-xs font-medium uppercase tracking-widest mb-1">Solde</p>
              <p className="text-5xl font-bold tabular-nums">{formatAr(found.balance)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{found.cashbacks.length}</p>
                <p className="text-emerald-200 text-xs">Gains totaux</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{found.cashbacks.filter(c => c.type === 'parrainage').length}</p>
                <p className="text-emerald-200 text-xs">Parrainages</p>
              </div>
            </div>
          </div>

          <div className="card p-4 mt-3">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" /> Historique des gains
            </h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {found.cashbacks.map((cb, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cb.type === 'purchase' ? 'bg-emerald-50' : 'bg-violet-50'}`}>
                    {cb.type === 'purchase' ? <Gift className="w-4 h-4 text-emerald-500" /> : <Users className="w-4 h-4 text-violet-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{cb.type === 'purchase' ? 'Cashback achat' : 'Bonus parrainage'}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(cb.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {cb.from && ` · De: ${cb.from}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 tabular-nums">+{formatAr(cb.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Cagnottes */}
      {cagnottes.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" /> Toutes les cagnottes
            </h3>
            <span className="badge bg-slate-100 text-slate-600">{cagnottes.length}</span>
          </div>
          <div className="space-y-0">
            {[...cagnottes].sort((a, b) => b.balance - a.balance).map((c, idx) => (
              <div key={c.refCode} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                  {idx === 0 ? <Award className="w-4 h-4" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{c.buyerName || 'Anonyme'}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{c.refCode}</p>
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

      {cagnottes.length === 0 && !found && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-slate-600 font-medium">Aucune cagnotte encore</p>
          <p className="text-slate-400 text-sm mt-1">Faites une vente pour générer du cashback</p>
          <a href="/vente" className="btn btn-primary mt-4 text-sm inline-flex">Commencer une vente <ArrowRight className="w-4 h-4" /></a>
        </div>
      )}
    </div>
  )
}
