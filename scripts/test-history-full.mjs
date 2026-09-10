/**
 * PATTEUF — Full History Sync Test
 * Simulates the exact frontend flow: load from localStorage → pull Supabase → verify → push → verify
 * Run: node scripts/test-history-full.mjs
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

console.log('\n🧪 PATTEUF — Full History Sync Test\n' + '─'.repeat(50))

// ── Step 1: Simulate fresh app load (localStorage empty) ──
console.log('\n1️⃣  Simulate fresh load (localStorage empty)...')
let localHistory = []
console.log(`   Local history: ${localHistory.length} entries`)

// ── Step 2: Pull from Supabase (like the frontend does on mount) ──
console.log('\n2️⃣  Pull from Supabase...')
const { data: pullData, error: pullErr } = await sb
  .from('app_action_history')
  .select('history')
  .eq('singleton_id', 'main')
  .maybeSingle()

if (pullErr) {
  console.log(`   ❌ Pull error: ${pullErr.message} (${pullErr.code})`)
  console.log('   → The table might not exist. Run the SQL first!')
} else {
  const remote = pullData?.history || []
  console.log(`   Remote history: ${remote.length} entries`)

  // Simulate merge logic from frontend
  if (remote.length > localHistory.length) {
    localHistory = remote
    console.log('   ✅ Merged: using remote data')
  } else {
    console.log('   ℹ️  Keeping local data (same length or local is bigger)')
  }
  console.log(`   After merge: ${localHistory.length} entries`)
}

// ── Step 3: Simulate logAction (adding an entry) ──
console.log('\n3️⃣  Simulate logAction (add entry)...')
const newEntry = {
  id: 'test-full-' + Date.now(),
  type: 'product_created',
  details: { productName: 'Full Test Product', productId: 'test-full-001' },
  userName: 'Oldon (test)',
  timestamp: new Date().toISOString(),
}
localHistory = [newEntry, ...localHistory]
console.log(`   After logAction: ${localHistory.length} entries`)

// ── Step 4: Push to Supabase (like the frontend debounced push) ──
console.log('\n4️⃣  Push to Supabase...')
const { error: pushErr } = await sb
  .from('app_action_history')
  .upsert(
    { singleton_id: 'main', history: localHistory, updated_at: new Date().toISOString() },
    { onConflict: 'singleton_id' }
  )

if (pushErr) {
  console.log(`   ❌ Push error: ${pushErr.message} (${pushErr.code})`)
} else {
  console.log(`   ✅ Push OK — ${localHistory.length} entries saved`)
}

// ── Step 5: Verify by reading back ──
console.log('\n5️⃣  Verify: read back from Supabase...')
const { data: verifyData, error: verifyErr } = await sb
  .from('app_action_history')
  .select('history')
  .eq('singleton_id', 'main')
  .maybeSingle()

if (verifyErr) {
  console.log(`   ❌ Verify error: ${verifyErr.message}`)
} else {
  const final = verifyData?.history || []
  console.log(`   ✅ Verified: ${final.length} entries in Supabase`)
  for (const entry of final) {
    console.log(`      [${entry.type}] ${entry.userName} — ${entry.details.productName || entry.details.clientName || '-'}`)
  }
}

// ── Step 6: Simulate second fresh load (page refresh) ──
console.log('\n6️⃣  Simulate page refresh (fresh pull)...')
let localAfterRefresh = []
const { data: refreshData } = await sb
  .from('app_action_history')
  .select('history')
  .eq('singleton_id', 'main')
  .maybeSingle()

const remoteAfterRefresh = refreshData?.history || []
if (remoteAfterRefresh.length > localAfterRefresh.length) {
  localAfterRefresh = remoteAfterRefresh
}

console.log(`   After refresh pull: ${localAfterRefresh.length} entries`)
const verifiedCount = verifyData?.history?.length || 0
if (localAfterRefresh.length === verifiedCount) {
  console.log('   ✅ Data persists across refresh!')
} else {
  console.log('   ❌ Data lost after refresh!')
}

// ── Cleanup ──
console.log('\n7️⃣  Cleanup test data...')
// Keep the real data, just remove our test entries
const cleaned = (verifyData?.history || []).filter(e => !e.id.startsWith('test-full-'))
await sb
  .from('app_action_history')
  .upsert(
    { singleton_id: 'main', history: cleaned, updated_at: new Date().toISOString() },
    { onConflict: 'singleton_id' }
  )
console.log(`   ✅ Cleaned. Remaining: ${cleaned.length} entries`)

console.log('\n' + '─'.repeat(50))
console.log('✅ Full sync test complete!\n')
