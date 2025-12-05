// Test the deployed search-funding function on correct project
const SUPABASE_URL = 'https://swvvyxuozwqvyaberqvu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjIwMDgsImV4cCI6MjA3OTA5ODAwOH0.jcCynwcnnYSosAgf9QSdx_2FCl9FOx3lTXSiM3n27xQ';

async function testSearch() {
    console.log('Testing deployed search-funding function on correct project...');

    const url = `${SUPABASE_URL}/functions/v1/search-funding`;

    const body = {
        query: 'AI',
        mode: 'search'
    };

    console.log('URL:', url);
    console.log('Body:', JSON.stringify(body, null, 2));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(body)
        });

        console.log('\nStatus:', response.status);
        console.log('Status Text:', response.statusText);

        const text = await response.text();
        console.log('\n=== RAW RESPONSE ===');
        console.log(text);

        try {
            const data = JSON.parse(text);
            console.log('\n=== PARSED RESPONSE ===');
            console.log('Opportunities count:', data.opportunities?.length || 0);

            if (data.opportunities && data.opportunities.length > 0) {
                console.log('\n=== FIRST 3 RESULTS ===');
                data.opportunities.slice(0, 3).forEach((opp, i) => {
                    console.log(`\n${i + 1}. ${opp.title}`);
                    console.log(`   Source: ${opp.source}`);
                    console.log(`   URL: ${opp.url?.substring(0, 80)}...`);
                    console.log(`   Deadline: ${opp.deadline}`);
                });
            } else {
                console.log('\n⚠️ NO RESULTS RETURNED');
            }

            if (data.error) {
                console.error('\n❌ ERROR:', data.error);
            }
        } catch (e) {
            console.error('Failed to parse JSON:', e);
        }

    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

testSearch();
