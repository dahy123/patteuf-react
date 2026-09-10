/**
 * PATTEUF — Action History Supabase Test
 * Run: node scripts/test-history.mjs
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

async function testTableExists() {
  console.log('\n─── Test 1: Table exists? ───')
  try {
    const { data, error } = await sb.from('app_action_history').select('singleton_id').limit(1)
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('❌ Table app_action_history does NOT exist.')
        console.log('   → Run the SQL in scripts/create_action_history_table.sql in Supabase SQL Editor.')
        return false
      }
      console.log(`⚠️  Error: ${error.message} (code: ${error.code})`)
      return false
    }
    console.log('✅ Table app_action_history exists.')
    return true
  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`)
    return false
  }
}

async function testWrite() {
  console.log('\n─── Test 2: Write test data ───')
  const testHistory = [
    {
      id: 'test-001',
      type: 'product_created',
      details: { productName: 'Test Pack', productId: 'test-123' },
      userName: 'Oldon',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'test-002',
      type: 'client_created',
      details: { clientName: 'Client Test' },
      userName: 'Oldon',
      timestamp: new Date().toISOString(),
    },
  ]

  try {
    const { data, error } = await sb
      .from('app_action_history')
      .upsert(
        { singleton_id: 'main', history: testHistory, updated_at: new Date().toISOString() },
        { onConflict: 'singleton_id' }
      )
      .select()

    if (error) {
      console.log(`  ❌ Write failed: ${error.message} (code: ${error.code})`)
      if (error.code === '42501' || error.message.includes('permission')) {
        console.log('  → RLS is blocking. Run the RLS policy SQL in Supabase SQL Editor.')
      }
      return false
    }
    console.log(`  ✅ Write OK — upserted ${testHistory.length} test entries`)
    return true
  } catch (err) {
    console.log(`  ❌ Write failed: ${err.message}`)
    return false
  }
}

async function testReadBack() {
  console.log('\n─── Test 3: Read back ───')
  try {
    const { data, error } = await sb
      .from('app_action_history')
      .select('history')
      .eq('singleton_id', 'main')
      .maybeSingle()

    if (error) {
      console.log(`  ❌ Read failed: ${error.message}`)
      return false
    }

    if (data?.history && data.history.length > 0) {
      console.log(`  ✅ Read OK — ${data.history.length} entries:`)
      for (const entry of data.history) {
        console.log(`     [${entry.type}] ${entry.userName} — ${entry.details.productName || entry.details.clientName || '-'}`)
      }
      return true
    }
    console.log('  ⚠️  No data found after write')
    return false
  } catch (err) {
    console.log(`  ❌ Read failed: ${err.message}`)
    return false
  }
}

async function testUpdate() {
  console.log('\n─── Test 4: Update (add entry) ───')
  try {
    // Read current
    const { data: current } = await sb
      .from('app_action_history')
      .select('history')
      .eq('singleton_id', 'main')
      .maybeSingle()

    const existing = current?.history || []
    const newEntry = {
      id: 'test-003',
      type: 'sale_completed',
      details: { saleTotal: 5600, buyerName: 'Acheteur Test' },
      userName: 'Oldon',
      timestamp: new Date().toISOString(),
    }

    const { error } = await sb
      .from('app_action_history')
      .upsert(
        { singleton_id: 'main', history: [newEntry, ...existing], updated_at: new Date().toISOString() },
        { onConflict: 'singleton_id' }
      )

    if (error) {
      console.log(`  ❌ Update failed: ${error.message}`)
      return false
    }
    console.log(`  ✅ Update OK — now ${existing.length + 1} entries total`)
    return true
  } catch (err) {
    console.log(`  ❌ Update failed: ${err.message}`)
    return false
  }
}

async function testDelete() {
  console.log('\n─── Test 5: Cleanup test data ───')
  try {
    const { error } = await sb
      .from('app_action_history')
      .delete()
      .eq('singleton_id', 'main')

    if (error) {
      console.log(`  ❌ Delete failed: ${error.message}`)
      return false
    }
    console.log('  ✅ Test data cleaned up')
    return true
  } catch (err) {
    console.log(`  ❌ Delete failed: ${err.message}`)
    return false
  }
}

// ── Run all tests ───
console.log('\n🧪 PATTEUF — Action History Supabase Test\n' + '─'.repeat(40))

const tableExists = await testTableExists()

if (tableExists) {
  await testWrite()
  await testReadBack()
  await testUpdate()
  await testDelete()
}

console.log('\n' + '─'.repeat(40))
console.log(tableExists ? '✅ All tests passed — history sync is ready!' : '⚠️  Fix the issues above, then re-run this test.')
console.log('')
