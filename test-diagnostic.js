// Test diagnostic function
const SUPABASE_URL = 'https://swvvyxuozwqvyaberqvu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjIwMDgsImV4cCI6MjA3OTA5ODAwOH0.jcCynwcnnYSosAgf9QSdx_2FCl9FOx3lTXSiM3n27xQ';

async function testDiagnostic() {
    console.log('Running diagnostic tests...\n');

    const url = `${SUPABASE_URL}/functions/v1/search-funding-diagnostic`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ query: 'AI' })
        });

        console.log('Status:', response.status);

        const data = await response.json();
        console.log('\n=== DIAGNOSTIC RESULTS ===\n');
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

testDiagnostic();
