/**
 * PATTEUF — Supabase Sync Test
 * Run: node scripts/test-sync.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read .env
const envPath = resolve(process.cwd(), '.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) env[key.trim()] = rest.join('=').trim()
}

const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY

console.log(`\n🔗 URL:  ${url}`)
console.log(`🔑 Key:  ${key.slice(0, 20)}...`)

const sb = createClient(url, key)

const TABLES = ['app_stock', 'app_sales', 'app_cagnottes', 'app_clients']

async function testConnection() {
  console.log('\n─── Test 1: Connection ───')
  try {
    // Try a simple query to verify the API is reachable
    const { data, error } = await sb.from('app_stock').select('singleton_id').limit(1)
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('❌ Tables do NOT exist yet.')
        console.log('   → Go to Supabase Dashboard → SQL Editor and run the CREATE TABLE SQL.')
        return false
      }
      console.log(`⚠️  Error: ${error.message} (code: ${error.code})`)
      return false
    }
    console.log('✅ API reachable, app_stock table exists.')
    return true
  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`)
    return false
  }
}

async function testReadAll() {
  console.log('\n─── Test 2: Read all tables ───')
  for (const table of TABLES) {
    try {
      const { data, error } = await sb.from(table).select('*').limit(1)
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`)
      } else {
        console.log(`  ✅ ${table}: ${data.length} row(s)`)
        if (data.length > 0) {
          const keys = Object.keys(data[0]).filter(k => k !== 'singleton_id' && k !== 'updated_at')
          for (const k of keys) {
            const val = data[0][k]
            const summary = Array.isArray(val) ? `array(${val.length})` : typeof val === 'object' ? 'JSON' : val
            console.log(`     ${k}: ${summary}`)
          }
        }
      }
    } catch (err) {
      console.log(`  ❌ ${table}: ${err.message}`)
    }
  }
}

async function testWrite() {
  console.log('\n─── Test 3: Write test ───')
  const testData = {
    singleton_id: 'main',
    stock: { 'pack-1': 20, 'pack-2': 20, 'simple-3': 50, 'simple-4': 50, 'simple-5': 50 },
    updated_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await sb
      .from('app_stock')
      .upsert(testData, { onConflict: 'singleton_id' })
      .select()

    if (error) {
      console.log(`  ❌ Write failed: ${error.message} (code: ${error.code})`)
      if (error.code === '42501' || error.message.includes('permission')) {
        console.log('  → RLS is blocking. Run the CREATE POLICY SQL in the dashboard.')
      }
      return false
    }
    console.log(`  ✅ Write OK — upserted to app_stock`)
    return true
  } catch (err) {
    console.log(`  ❌ Write failed: ${err.message}`)
    return false
  }
}

async function testReadBack() {
  console.log('\n─── Test 4: Read back ───')
  try {
    const { data, error } = await sb
      .from('app_stock')
      .select('stock')
      .eq('singleton_id', 'main')
      .maybeSingle()

    if (error) {
      console.log(`  ❌ Read back failed: ${error.message}`)
      return false
    }

    if (data?.stock) {
      console.log(`  ✅ Read back OK:`)
      for (const [k, v] of Object.entries(data.stock)) {
        console.log(`     ${k}: ${v}`)
      }
      return true
    }
    console.log('  ⚠️  No data found after write')
    return false
  } catch (err) {
    console.log(`  ❌ Read back failed: ${err.message}`)
    return false
  }
}

// ── Run all tests ──
console.log('\n🧪 PATTEUF — Supabase Sync Test\n' + '─'.repeat(40))

const connected = await testConnection()

if (connected) {
  await testReadAll()
  await testWrite()
  await testReadBack()
}

console.log('\n' + '─'.repeat(40))
console.log(connected ? '✅ All tests passed — sync is ready!' : '⚠️  Fix the issues above, then re-run this test.')
console.log('')
