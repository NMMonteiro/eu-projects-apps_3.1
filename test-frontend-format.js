// Test with exact frontend format
const SUPABASE_URL = 'https://swvvyxuozwqvyaberqvu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjIwMDgsImV4cCI6MjA3OTA5ODAwOH0.jcCynwcnnYSosAgf9QSdx_2FCl9FOx3lTXSiM3n27xQ';

async function testSearch() {
    console.log('Testing with frontend format...');

    const url = `${SUPABASE_URL}/functions/v1/search-funding`;

    // Exact format from frontend
    const body = {
        query: 'AI',
        customSources: [],
        timestamp: Date.now()
    };

    console.log('Request:', JSON.stringify(body, null, 2));

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

        const text = await response.text();
        console.log('\nResponse:', text);

        const data = JSON.parse(text);
        console.log('\nOpportunities:', data.opportunities?.length || 0);

        if (data.opportunities && data.opportunities.length > 0) {
            console.log('\nFirst result:');
            console.log(JSON.stringify(data.opportunities[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testSearch();
