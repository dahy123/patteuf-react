import { NavLink } from 'react-router-dom'
import { useDarkMode } from '../context/DarkModeContext'
import {
  LayoutDashboard, Package, ShoppingCart, Wallet,
  Megaphone, Sun, Moon,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/stock', label: 'Stock', icon: Package },
  { to: '/vente', label: 'Vente', icon: ShoppingCart },
  { to: '/cagnotte', label: 'Cagnotte', icon: Wallet },
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
]

export default function Header() {
  const { dark, toggle } = useDarkMode()

  return (
    <header className="sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-800 dark:from-brand-900 dark:via-brand-800 dark:to-brand-900 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <NavLink to="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center group-hover:bg-white/25 transition">
              <svg viewBox="0 0 120 120" className="w-5 h-5" fill="none">
                <ellipse cx="60" cy="72" rx="28" ry="24" fill="white"/>
                <ellipse cx="32" cy="38" rx="12" ry="14" transform="rotate(-15 32 38)" fill="white"/>
                <ellipse cx="88" cy="38" rx="12" ry="14" transform="rotate(15 88 38)" fill="white"/>
                <ellipse cx="20" cy="62" rx="10" ry="12" transform="rotate(-25 20 62)" fill="white"/>
                <ellipse cx="100" cy="62" rx="10" ry="12" transform="rotate(25 100 62)" fill="white"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-none tracking-tight">PATTEUF</span>
              <span className="text-brand-200 text-[10px] font-medium leading-none mt-0.5">Gestion & Vente</span>
            </div>
          </NavLink>

          <div className="flex items-center gap-2">
            <span className="badge bg-white/10 text-white/60 text-[10px] hidden sm:block">MVP v1.0</span>
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 group"
              aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {dark
                ? <Sun className="w-4 h-4 text-amber-300 group-hover:text-amber-200 transition-colors" />
                : <Moon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-700/80 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-2">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide py-1.5">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 no-underline ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400 shadow-sm shadow-brand-100 dark:shadow-brand-500/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" strokeWidth={2} />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}
