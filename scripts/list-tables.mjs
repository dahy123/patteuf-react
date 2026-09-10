/**
 * PATTEUF — List all Supabase tables
 * Run: node scripts/list-tables.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) env[key.trim()] = rest.join('=').trim()
}

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

// Try each known table
const tables = ['app_stock', 'app_sales', 'app_cagnottes', 'app_clients', 'app_action_history']

console.log('\n📋 Checking tables...\n')

for (const table of tables) {
  const { data, error } = await sb.from(table).select('*').limit(1)
  if (error) {
    console.log(`  ❌ ${table}: ${error.message} (${error.code})`)
  } else {
    console.log(`  ✅ ${table}: exists (${data.length} row)`)
  }
}

// Also try to create the table via RPC or direct query
console.log('\n🔧 Trying to create app_action_history via SQL...')

// Supabase JS client doesn't support raw SQL, but we can try inserting
// First let's check if we can at least see the schema
const { data: schemaData, error: schemaError } = await sb.rpc('exec_sql', { query: 'SELECT 1' }).maybeSingle()
if (schemaError) {
  console.log(`  ℹ️  RPC not available: ${schemaError.message}`)
  console.log('  → Table must be created manually in Supabase SQL Editor')
} else {
  console.log('  ✅ RPC available')
}

console.log('')
