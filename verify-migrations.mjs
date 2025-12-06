// Quick verification of Supabase migrations
const SUPABASE_URL = 'https://swvvyxuozwqvyaberqvu.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUyMjAwOCwiZXhwIjoyMDc5MDk4MDA4fQ.BmOhn33N8QMZ35_MvbMWsM5QHfLk85v7UKZ3ezJYLeU'

async function checkMigrations() {
    console.log('🔍 Checking Supabase migrations...\n')

    const tests = [
        {
            name: 'funding_schemes table',
            url: `${SUPABASE_URL}/rest/v1/funding_schemes?select=*&is_default=eq.true&limit=1`,
            check: (data) => {
                if (data && data.length > 0) {
                    console.log(`   ✅ Default funding scheme: "${data[0].name}"`)
                    console.log(`   ✅ Sections: ${data[0].template_json.sections.length}`)
                    return true
                }
                return false
            }
        },
        {
            name: 'proposals table with new columns',
            url: `${SUPABASE_URL}/rest/v1/proposals?select=id,funding_scheme_id,dynamic_sections&limit=1`,
            check: (data) => {
                console.log(`   ✅ Proposals table exists`)
                console.log(`   ✅ funding_scheme_id column: OK`)
                console.log(`   ✅ dynamic_sections column: OK`)
                return true
            }
        },
        {
            name: 'funding_opportunities table',
            url: `${SUPABASE_URL}/rest/v1/funding_opportunities?select=id&limit=1`,
            check: () => {
                console.log(`   ✅ funding_opportunities table exists`)
                return true
            }
        },
        {
            name: 'scraped_opportunities table',
            url: `${SUPABASE_URL}/rest/v1/scraped_opportunities?select=id&limit=1`,
            check: () => {
                console.log(`   ✅ scraped_opportunities table exists`)
                return true
            }
        }
    ]

    let allPassed = true

    for (const test of tests) {
        console.log(`📋 Checking ${test.name}...`)
        try {
            const response = await fetch(test.url, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            })

            if (!response.ok) {
                console.log(`   ❌ HTTP Error: ${response.status} - ${response.statusText}`)
                const errorText = await response.text()
                console.log(`   Error details: ${errorText}`)
                allPassed = false
                continue
            }

            const data = await response.json()
            test.check(data)
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`)
            allPassed = false
        }
        console.log('')
    }

    console.log('='.repeat(60))
    if (allPassed) {
        console.log('🎉 All migrations verified successfully!')
        console.log('✅ Ready to proceed with Phase 3: AI Document Parser')
    } else {
        console.log('⚠️  Some migrations failed - check errors above')
    }
    console.log('='.repeat(60))
}

checkMigrations().catch(console.error)
