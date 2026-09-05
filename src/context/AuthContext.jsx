import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { generateId } from '../utils/helpers'

const AuthContext = createContext(null)

const USERS_KEY = 'patteuf_users'
const SESSION_KEY = 'patteuf_session'

function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return 'h_' + Math.abs(hash).toString(36)
}

// All available permission keys
export const ALL_PERMISSIONS = ['dashboard', 'stock', 'vente', 'clients', 'cagnotte', 'marketing', 'users', 'produits']

// Default permissions for moderators (all true by default)
const DEFAULT_MODERATOR_PERMISSIONS = Object.fromEntries(
  ALL_PERMISSIONS.map(p => [p, true])
)

// Default admin account
const DEFAULT_ADMIN = {
  id: 'admin-default-001',
  name: 'Oldon',
  username: 'oldon',
  passwordHash: hashPassword('1234'),
  role: 'admin',
  permissions: Object.fromEntries(ALL_PERMISSIONS.map(p => [p, true])),
  createdAt: new Date().toISOString(),
}

function ensurePermissions(user) {
  if (user.permissions) return user
  return {
    ...user,
    permissions: user.role === 'admin'
      ? Object.fromEntries(ALL_PERMISSIONS.map(p => [p, true]))
      : { ...DEFAULT_MODERATOR_PERMISSIONS },
  }
}

function loadUsers() {
  try {
    const saved = JSON.parse(localStorage.getItem(USERS_KEY)) || []
    const migrated = saved.map(ensurePermissions)
    // Ensure default admin exists
    if (!migrated.find(u => u.username === 'oldon')) {
      return [DEFAULT_ADMIN, ...migrated]
    }
    return migrated
  } catch {
    return [DEFAULT_ADMIN]
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => loadUsers())
  const [currentUser, setCurrentUser] = useState(() => {
    const session = loadSession()
    if (!session) return null
    // Migrate session: attach permissions from users list if missing
    const user = users.find(u => u.id === session.id)
    if (user) {
      return { ...session, permissions: user.permissions }
    }
    return { ...session, permissions: session.permissions || Object.fromEntries(ALL_PERMISSIONS.map(p => [p, true])) }
  })

  // Persist session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [currentUser])

  // Persist users
  useEffect(() => {
    saveUsers(users)
  }, [users])

  const register = useCallback(({ name, username, password, role }) => {
    const uname = username.trim().toLowerCase()
    if (users.find(u => u.username === uname)) {
      return { ok: false, error: "Ce nom d'utilisateur existe déjà" }
    }
    if (!name?.trim() || !uname || !password) {
      return { ok: false, error: "Tous les champs sont requis" }
    }
    if (password.length < 4) {
      return { ok: false, error: "Le mot de passe doit faire au moins 4 caractères" }
    }

    const validRoles = ['admin', 'moderator']
    const userRole = validRoles.includes(role) ? role : 'moderator'

    const user = {
      id: generateId(),
      name: name.trim(),
      username: uname,
      passwordHash: hashPassword(password),
      role: userRole,
      permissions: userRole === 'admin'
        ? Object.fromEntries(ALL_PERMISSIONS.map(p => [p, true]))
        : { ...DEFAULT_MODERATOR_PERMISSIONS },
      createdAt: new Date().toISOString(),
    }

    setUsers(prev => [...prev, user])

    // If this is the first user being created (no users exist besides default admin)
    // auto-login them
    const realUsers = users.filter(u => u.id !== 'admin-default-001')
    if (realUsers.length === 0) {
      setCurrentUser({ id: user.id, name: user.name, username: user.username, role: user.role, permissions: user.permissions })
    }

    return { ok: true, user: { id: user.id, name: user.name, username: user.username, role: user.role } }
  }, [users])

  const login = useCallback(({ username, password }) => {
    const uname = username.trim().toLowerCase()
    const user = users.find(u => u.username === uname)
    if (!user) {
      return { ok: false, error: "Utilisateur introuvable" }
    }
    if (user.passwordHash !== hashPassword(password)) {
      return { ok: false, error: "Mot de passe incorrect" }
    }
    setCurrentUser({ id: user.id, name: user.name, username: user.username, role: user.role, permissions: user.permissions })
    return { ok: true }
  }, [users])

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  // ── User Management (admin only) ──
  const updateUser = useCallback((userId, updates) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, ...updates } : u
    ))
    // Update session if current user was modified
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({
        ...prev,
        ...updates,
      }))
    }
  }, [currentUser?.id])

  const removeUser = useCallback((userId) => {
    // Cannot delete yourself
    if (userId === currentUser?.id) return { ok: false, error: "Vous ne pouvez pas supprimer votre propre compte" }
    // Cannot delete the default admin
    if (userId === 'admin-default-001') return { ok: false, error: "Le compte administrateur principal ne peut pas être supprimé" }
    setUsers(prev => prev.filter(u => u.id !== userId))
    return { ok: true }
  }, [currentUser?.id])

  const resetPassword = useCallback((userId, newPassword) => {
    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: "Le mot de passe doit faire au moins 4 caractères" }
    }
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, passwordHash: hashPassword(newPassword) } : u
    ))
    return { ok: true }
  }, [])

  const changeUserRole = useCallback((userId, newRole) => {
    const validRoles = ['admin', 'moderator']
    if (!validRoles.includes(newRole)) return { ok: false, error: "Rôle invalide" }
    const defaultPerms = newRole === 'admin'
      ? Object.fromEntries(ALL_PERMISSIONS.map(p => [p, true]))
      : { ...DEFAULT_MODERATOR_PERMISSIONS }
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role: newRole, permissions: defaultPerms } : u
    ))
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, role: newRole, permissions: defaultPerms }))
    }
    return { ok: true }
  }, [currentUser?.id])

  const isAdmin = currentUser?.role === 'admin'
  const isAuthenticated = Boolean(currentUser)

  const hasPermission = useCallback((permission) => {
    if (isAdmin) return true
    return currentUser?.permissions?.[permission] ?? false
  }, [isAdmin, currentUser?.permissions])

  const updatePermissions = useCallback((userId, permissions) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, permissions } : u
    ))
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, permissions }))
    }
  }, [currentUser?.id])

  const value = {
    currentUser,
    isAuthenticated,
    isAdmin,
    users,
    hasPermission,
    register,
    login,
    logout,
    updateUser,
    removeUser,
    resetPassword,
    changeUserRole,
    updatePermissions,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
