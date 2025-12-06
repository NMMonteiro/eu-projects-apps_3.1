// Test the parse-funding-template Edge Function
const SUPABASE_URL = 'https://swvvyxuozwqvyaberqvu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjIwMDgsImV4cCI6MjA3OTA5ODAwOH0.jcCynwcnnYSosAgf9QSdx_2FCl9FOx3lTXSiM3n27xQ'

console.log('🧪 Testing parse-funding-template Edge Function\n')

// First, check if the function exists
console.log('1. Checking if Edge Function is deployed...')

const testPayload = {
    fileUrl: 'raw/test.pdf',
    fundingSchemeName: 'Test Horizon Europe RIA'
}

try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-funding-template`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify(testPayload)
    })

    console.log('   Status:', response.status, response.statusText)

    if (response.status === 404) {
        console.log('   ⚠️  Edge Function not found - it may need to be deployed')
        console.log('   Run: npx supabase functions deploy parse-funding-template')
    } else if (response.status === 500) {
        const error = await response.json()
        console.log('   ⚠️  Function exists but returned error (expected - no real file uploaded yet)')
        console.log('   Error:', error.error)
        console.log('   ✅ This means the function is deployed correctly!')
    } else {
        const data = await response.json()
        console.log('   Response:', JSON.stringify(data, null, 2))
    }

} catch (error) {
    console.log('   ❌ Error:', error.message)
}

console.log('\n' + '='.repeat(60))
console.log('✅ Test complete')
console.log('='.repeat(60))
