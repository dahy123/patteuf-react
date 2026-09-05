import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { UserPlus, User, Lock, Eye, EyeOff } from 'lucide-react'

export default function Register({ onSwitchToLogin }) {
  const { register, users } = useAuth()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const isFirstUser = users.length === 0

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const result = register({ name, username, password })
    if (!result.ok) {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 120 120" className="w-9 h-9" fill="none">
              <ellipse cx="60" cy="72" rx="28" ry="24" fill="white"/>
              <ellipse cx="32" cy="38" rx="12" ry="14" transform="rotate(-15 32 38)" fill="white"/>
              <ellipse cx="88" cy="38" rx="12" ry="14" transform="rotate(15 88 38)" fill="white"/>
              <ellipse cx="20" cy="62" rx="10" ry="12" transform="rotate(-25 20 62)" fill="white"/>
              <ellipse cx="100" cy="62" rx="10" ry="12" transform="rotate(25 100 62)" fill="white"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isFirstUser ? 'Premier utilisateur — sera administrateur' : 'Inscrivez-vous pour accéder à l\'application'}
          </p>
        </div>

        {/* Register Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700">
                {error}
              </div>
            )}

            {isFirstUser && (
              <div className="bg-gray-900 text-white rounded-xl px-4 py-3 text-sm font-medium text-center">
                👑 Premier compte = Administrateur
              </div>
            )}

            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nom complet"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input pl-10"
                autoFocus
                required
              />
            </div>

            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe (min. 4 caractères)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input pl-10 pr-10"
                minLength={4}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button type="submit" className="btn btn-primary w-full py-3">
              <UserPlus className="w-4 h-4" /> Créer mon compte
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{' '}
              <button onClick={onSwitchToLogin} className="text-gray-900 font-semibold hover:underline">
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
