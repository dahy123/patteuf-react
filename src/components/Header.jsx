import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Package, ShoppingCart, Wallet, Megaphone, Users, Boxes,
  Cloud, CloudOff, RefreshCw, Check, LogOut, Shield, UserCog,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { to: '/stock', label: 'Stock', icon: Package, permission: 'stock' },
  { to: '/vente', label: 'Vente', icon: ShoppingCart, permission: 'vente' },
  { to: '/produits', label: 'Produits', icon: Boxes, permission: 'produits' },
  { to: '/clients', label: 'Clients', icon: Users, permission: 'clients' },
  { to: '/cagnotte', label: 'Cagnotte', icon: Wallet, permission: 'cagnotte' },
  { to: '/marketing', label: 'Marketing', icon: Megaphone, permission: 'marketing' },
]

export default function Header() {
  const { syncStatus, isOnline, forceSync } = useApp()
  const { currentUser, logout, isAdmin, hasPermission } = useAuth()

  const syncIcon = {
    idle: <Cloud className="w-3.5 h-3.5 text-white/40" />,
    syncing: <RefreshCw className="w-3.5 h-3.5 text-white/60 animate-spin" />,
    synced: <Check className="w-3.5 h-3.5 text-white/80" />,
    error: <CloudOff className="w-3.5 h-3.5 text-white/60" />,
  }[syncStatus] || <Cloud className="w-3.5 h-3.5 text-white/40" />

  const syncLabel = {
    idle: 'Hors-ligne',
    syncing: 'Sync...',
    synced: 'Sync OK',
    error: 'Erreur',
  }[syncStatus] || 'Hors-ligne'

  const visibleNavItems = navItems.filter(item => hasPermission(item.permission))
  const allNavItems = isAdmin && hasPermission('users')
    ? [...visibleNavItems, { to: '/users', label: 'Users', icon: UserCog, permission: 'users' }]
    : visibleNavItems

  return (
    <header className="sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900">
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
              <span className="text-gray-400 text-[10px] font-medium leading-none mt-0.5">Gestion & Vente</span>
            </div>
          </NavLink>
          <div className="flex items-center gap-2">
            {/* User info */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/10 text-white/70 text-[11px]">
              {isAdmin && <Shield className="w-3 h-3 text-white/50" />}
              <span className="font-medium">{currentUser?.name || currentUser?.username}</span>
            </div>

            {/* Sync button */}
            <button
              onClick={forceSync}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white/70 hover:text-white disabled:opacity-40"
              title={isOnline ? 'Synchroniser avec Supabase' : 'Hors-ligne — sync indisponible'}
            >
              {syncIcon}
              <span className="text-[10px] font-medium hidden sm:inline">{syncLabel}</span>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white/70 hover:text-white"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>

            <span className="badge bg-white/10 text-white/60 text-[10px]">MVP v1.0</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80">
        <div className="max-w-5xl mx-auto px-2">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide py-1.5">
            {allNavItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 no-underline ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
