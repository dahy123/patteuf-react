import { createContext, useContext, useState, useEffect } from 'react'

const DarkModeContext = createContext(null)

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('patteuf_dark')
      if (saved !== null) return saved === 'true'
    } catch {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    localStorage.setItem('patteuf_dark', String(dark))
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [dark])

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      const saved = localStorage.getItem('patteuf_dark')
      if (saved === null) setDark(e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = () => setDark(d => !d)

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const ctx = useContext(DarkModeContext)
  if (!ctx) throw new Error('useDarkMode must be used within DarkModeProvider')
  return ctx
}
