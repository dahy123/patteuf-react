import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Singleton — un seul client Supabase partagé dans toute l'app
let supabaseInstance = null

export function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[PATTEUF] Supabase non configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env')
    return null
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  }
  return supabaseInstance
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseKey)
}
