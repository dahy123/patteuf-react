import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { DarkModeProvider } from './context/DarkModeContext'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Stock from './pages/Stock'
import Sale from './pages/Sale'
import Cagnotte from './pages/Cagnotte'
import Marketing from './pages/Marketing'

export default function App() {
  return (
    <DarkModeProvider>
      <AppProvider>
        <BrowserRouter>
          <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
            <Header />
            <main className="max-w-2xl mx-auto pb-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/vente" element={<Sale />} />
                <Route path="/cagnotte" element={<Cagnotte />} />
                <Route path="/marketing" element={<Marketing />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AppProvider>
    </DarkModeProvider>
  )
}
