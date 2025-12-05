
const url = 'http://127.0.0.1:54321/functions/v1/search-funding';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjIwMDgsImV4cCI6MjA3OTA5ODAwOH0.jcCynwcnnYSosAgf9QSdx_2FCl9FOx3lTXSiM3n27xQ';

async function testSearch() {
    try {
        console.log('Testing POST /search-funding with query "AI"...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'AI',
                filterStatus: 'all'
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Raw Response:', text.substring(0, 500)); // Print first 500 chars

        try {
            const data = JSON.parse(text);
            console.log('Opportunities found:', data.opportunities?.length);
            if (data.opportunities?.length > 0) {
                console.log('First opportunity:', JSON.stringify(data.opportunities[0], null, 2));
            } else {
                console.log('No opportunities returned.');
            }
        } catch (e) {
            console.log('Response is not JSON');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testSearch();
