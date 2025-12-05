const SUPABASE_URL = 'https://swvvyxuozwqvyaberqvu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjIwMDgsImV4cCI6MjA3OTA5ODAwOH0.jcCynwcnnYSosAgf9QSdx_2FCl9FOx3lTXSiM3n27xQ';

async function testEdgeFunction() {
    console.log('Testing Edge Function...');

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/search-funding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ query: 'digital' })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log('\nResponse data:', JSON.stringify(data, null, 2));

        if (data.opportunities) {
            console.log(`\n✓ Success! Got ${data.opportunities.length} opportunities`);
            if (data.opportunities[0]) {
                console.log('\nFirst opportunity:');
                console.log('  Title:', data.opportunities[0].title);
                console.log('  Call ID:', data.opportunities[0].call_id);
                console.log('  Status:', data.opportunities[0].status);
                console.log('  Deadline:', data.opportunities[0].deadline);
            }
        } else {
            console.log('\n✗ Error:', data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('✗ Test failed:', error.message);
    }
}

testEdgeFunction();
