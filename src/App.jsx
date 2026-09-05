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
import Login from './pages/Login'
import Register from './pages/Register'

function AuthPages() {
  const [page, setPage] = useState('login')
  return page === 'login'
    ? <Login onSwitchToRegister={() => setPage('register')} />
    : <Register onSwitchToLogin={() => setPage('login')} />
}

function AppRoutes() {
  const { isAuthenticated, isAdmin } = useAuth()

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
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/vente" element={<Sale />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/cagnotte" element={<Cagnotte />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/users" element={isAdmin ? <Users /> : <Navigate to="/" replace />} />
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
