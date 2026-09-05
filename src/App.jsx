import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Stock from './pages/Stock'
import Sale from './pages/Sale'
import Cagnotte from './pages/Cagnotte'
import Clients from './pages/Clients'
import Marketing from './pages/Marketing'
import Users from './pages/Users'
import Products from './pages/Products'
import Login from './pages/Login'
import Register from './pages/Register'

function AuthPages() {
  const [page, setPage] = useState('login')
  return page === 'login'
    ? <Login onSwitchToRegister={() => setPage('register')} />
    : <Register onSwitchToLogin={() => setPage('login')} />
}

function ProtectedRoute({ permission, children }) {
  const { hasPermission } = useAuth()
  return hasPermission(permission) ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPages />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Header />
        <main className="max-w-2xl mx-auto pb-8">
          <Routes>
            <Route path="/" element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/stock" element={<ProtectedRoute permission="stock"><Stock /></ProtectedRoute>} />
            <Route path="/vente" element={<ProtectedRoute permission="vente"><Sale /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute permission="clients"><Clients /></ProtectedRoute>} />
            <Route path="/cagnotte" element={<ProtectedRoute permission="cagnotte"><Cagnotte /></ProtectedRoute>} />
            <Route path="/marketing" element={<ProtectedRoute permission="marketing"><Marketing /></ProtectedRoute>} />
            <Route path="/produits" element={<ProtectedRoute permission="produits"><Products /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute permission="users"><Users /></ProtectedRoute>} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/patteuf-react">
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
