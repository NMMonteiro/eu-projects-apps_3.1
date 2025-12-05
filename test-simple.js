// Test if the endpoint is even reachable
const url = 'https://swvvyxuozwqvyaberqvu.supabase.co/functions/v1/server/partners';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjIwMDgsImV4cCI6MjA3OTA5ODAwOH0.jcCynwcnnYSosAgf9QSdx_2FCl9FOx3lTXSiM3n27xQ';

async function test() {
    try {
        console.log('Testing GET /partners...');
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Partners count:', data.partners.length);
        if (data.partners.length > 0) {
            console.log('Latest partner:', JSON.stringify(data.partners[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

test();
