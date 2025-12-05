// Test the deployed search-funding function
const SUPABASE_URL = 'https://kkcuaqnkpazrsdyceqox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrY3VhcW5rcGF6cnNkeWNlcW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5MjE4NjYsImV4cCI6MjA0NzQ5Nzg2Nn0.rCZEOLgLqGJPVvhEjdZFvGZhWMxMWJNAYZQmJCPWqLw';

async function testSearch() {
    console.log('Testing deployed search-funding function...');

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

        const data = await response.json();
        console.log('\n=== RESPONSE DATA ===');
        console.log('Opportunities count:', data.opportunities?.length || 0);

        if (data.opportunities && data.opportunities.length > 0) {
            console.log('\n=== FIRST 3 RESULTS ===');
            data.opportunities.slice(0, 3).forEach((opp, i) => {
                console.log(`\n${i + 1}. ${opp.title}`);
                console.log(`   Source: ${opp.source}`);
                console.log(`   URL: ${opp.url?.substring(0, 80)}...`);
                console.log(`   Deadline: ${opp.deadline}`);
                console.log(`   Status: ${opp.status}`);
            });
        } else {
            console.log('\n⚠️ NO RESULTS RETURNED');
            console.log('Full response:', JSON.stringify(data, null, 2));
        }

        if (data.error) {
            console.error('\n❌ ERROR:', data.error);
        }

    } catch (error) {
        console.error('❌ Request failed:', error);
    }
}

testSearch();
