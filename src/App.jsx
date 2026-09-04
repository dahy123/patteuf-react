import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Stock from './pages/Stock'
import Sale from './pages/Sale'
import Cagnotte from './pages/Cagnotte'
import Clients from './pages/Clients'
import Marketing from './pages/Marketing'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/patteuf-react">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <Header />
          <main className="max-w-2xl mx-auto pb-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/vente" element={<Sale />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/cagnotte" element={<Cagnotte />} />
              <Route path="/marketing" element={<Marketing />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
