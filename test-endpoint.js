// Test if the PDF endpoint is reachable
const url = 'https://swvvyxuozwqvyaberqvu.supabase.co/functions/v1/server/partners/extract-from-pdf';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjIwMDgsImV4cCI6MjA3OTA5ODAwOH0.jcCynwcnnYSosAgf9QSdx_2FCl9FOx3lTXSiM3n27xQ';

async function test() {
    try {
        console.log('Testing POST /partners/extract-from-pdf with empty body...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: new FormData() // Empty form data
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);

    } catch (error) {
        console.error('Error:', error);
    }
}

test();
