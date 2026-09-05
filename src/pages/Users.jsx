import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Users, Plus, Shield, User, Key, Trash2, X, Check,
  Search, ChevronDown, Crown, Eye, EyeOff, Lock,
  LayoutDashboard, Package, ShoppingCart, Wallet, Megaphone, UserCog,
} from 'lucide-react'
import { ALL_PERMISSIONS } from '../context/AuthContext'

const PERMISSION_META = {
  dashboard: { label: 'Dashboard', icon: LayoutDashboard },
  stock: { label: 'Stock', icon: Package },
  vente: { label: 'Vente', icon: ShoppingCart },
  clients: { label: 'Clients', icon: Users },
  cagnotte: { label: 'Cagnotte', icon: Wallet },
  marketing: { label: 'Marketing', icon: Megaphone },
  users: { label: 'Utilisateurs', icon: UserCog },
}

export default function UsersPage() {
  const { users, currentUser, register, removeUser, resetPassword, changeUserRole, updatePermissions } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'moderator' })
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // Permissions panel
  const [permUserId, setPermUserId] = useState(null)

  // Reset password state
  const [resetId, setResetId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showResetPw, setShowResetPw] = useState(false)

  const filteredUsers = searchQuery
    ? users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

  const handleCreate = (e) => {
    e.preventDefault()
    setFormError('')
    const result = register(form)
    if (result.ok) {
      setForm({ name: '', username: '', password: '', role: 'moderator' })
      setShowForm(false)
    } else {
      setFormError(result.error)
    }
  }

  const handleDelete = (user) => {
    if (window.confirm(`Supprimer le compte de "${user.name}" ?`)) {
      const result = removeUser(user.id)
      if (!result.ok) alert(result.error)
    }
  }

  const handleRoleChange = (user, newRole) => {
    const result = changeUserRole(user.id, newRole)
    if (!result.ok) alert(result.error)
  }

  const handleResetPassword = (userId) => {
    if (!newPassword) return
    const result = resetPassword(userId, newPassword)
    if (result.ok) {
      setResetId(null)
      setNewPassword('')
      setShowResetPw(false)
    } else {
      alert(result.error)
    }
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const moderatorCount = users.filter(u => u.role === 'moderator').length

  const togglePermission = (userId, perm) => {
    const user = users.find(u => u.id === userId)
    if (!user || user.role === 'admin') return
    const updated = { ...user.permissions, [perm]: !user.permissions?.[perm] }
    updatePermissions(userId, updated)
  }

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} compte{users.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setForm({ name: '', username: '', password: '', role: 'moderator' }); setFormError(''); setShowForm(!showForm) }} className="btn btn-primary">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Crown className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{adminCount}</p>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Admin{adminCount > 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-700 tabular-nums">{moderatorCount}</p>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Modérateur{moderatorCount > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Nouvel utilisateur</h3>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost p-1"><X className="w-4 h-4" /></button>
          </div>
          {formError && (
            <div className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 mb-3">
              {formError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Nom complet" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input pl-10" required autoFocus />
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Nom d'utilisateur" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="input pl-10" required />
            </div>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe (min. 4)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input pl-10 pr-10" minLength={4} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Rôle</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, role: 'admin' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition ${form.role === 'admin' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                  <Crown className="w-4 h-4" /> Admin
                </button>
                <button type="button" onClick={() => setForm({ ...form, role: 'moderator' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition ${form.role === 'moderator' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                  <Shield className="w-4 h-4" /> Modérateur
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-success flex-1"><Check className="w-4 h-4" /> Créer</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Rechercher un utilisateur..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input pl-10" />
        </div>
      </div>

      {/* User List */}
      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}</p>
          </div>
        ) : (
          filteredUsers.map(user => {
            const isCurrentUser = user.id === currentUser?.id
            const isDefaultAdmin = user.id === 'admin-default-001'
            const isAdminRole = user.role === 'admin'

            return (
              <div key={user.id} className={`card p-4 ${isCurrentUser ? 'ring-2 ring-gray-900' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAdminRole ? 'bg-gray-900' : 'bg-gray-200'}`}>
                      {isAdminRole ? (
                        <Crown className={`w-5 h-5 ${isCurrentUser ? 'text-white' : 'text-gray-700'}`} />
                      ) : (
                        <Shield className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{user.name}</h3>
                        {isCurrentUser && <span className="text-[9px] bg-gray-900 text-white px-1.5 py-0.5 rounded-full font-medium">Vous</span>}
                        {isDefaultAdmin && <span className="text-[9px] bg-gray-700 text-white px-1.5 py-0.5 rounded-full font-medium">Principal</span>}
                      </div>
                      <p className="text-xs text-gray-400">@{user.username} · {isAdminRole ? 'Admin' : 'Modérateur'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Role selector (only for admins, not for default admin) */}
                    {!isDefaultAdmin && (
                      <div className="relative">
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user, e.target.value)}
                          disabled={isDefaultAdmin}
                          className="appearance-none bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg px-3 py-2 pr-7 cursor-pointer hover:bg-gray-200 transition disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="moderator">Modérateur</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    )}

                    {/* Reset password */}
                    {!isDefaultAdmin && (
                      <button onClick={() => { setResetId(resetId === user.id ? null : user.id); setNewPassword(''); setShowResetPw(false) }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition" title="Réinitialiser le mot de passe">
                        <Key className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Permissions (non-admin users only) */}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => setPermUserId(permUserId === user.id ? null : user.id)}
                        className={`p-1.5 rounded-lg transition ${permUserId === user.id ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                        title="Gérer les accès"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete */}
                    {!isDefaultAdmin && !isCurrentUser && (
                      <button onClick={() => handleDelete(user)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Reset password form */}
                {resetId === user.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 animate-scale-in">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showResetPw ? 'text' : 'password'}
                          placeholder="Nouveau mot de passe"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="input pl-10 pr-10 text-sm"
                          minLength={4}
                        />
                        <button type="button" onClick={() => setShowResetPw(!showResetPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showResetPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button onClick={() => handleResetPassword(user.id)} disabled={newPassword.length < 4} className="btn btn-primary px-4 py-2 text-sm disabled:opacity-40">
                        <Check className="w-3.5 h-3.5" /> OK
                      </button>
                    </div>
                  </div>
                )}

                {/* Permissions panel */}
                {permUserId === user.id && user.role !== 'admin' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 animate-scale-in">
                    <p className="text-xs font-semibold text-gray-500 mb-2.5">Accès aux modules</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ALL_PERMISSIONS.map(perm => {
                        const meta = PERMISSION_META[perm]
                        const isEnabled = user.permissions?.[perm] ?? true
                        return (
                          <button
                            key={perm}
                            onClick={() => togglePermission(user.id, perm)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                              isEnabled
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <meta.icon className="w-3.5 h-3.5" />
                            {meta.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
