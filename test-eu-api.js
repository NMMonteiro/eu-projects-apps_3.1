// Test EU Portal API directly
const apiUrl = 'https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=AI&pageSize=5';

async function testAPI() {
    console.log('Testing EU Portal API...');
    console.log('URL:', apiUrl);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log('Response (first 1000 chars):', text.substring(0, 1000));

        // Try to parse as JSON
        try {
            const data = JSON.parse(text);
            console.log('\nParsed JSON:');
            console.log('- results count:', data.results?.length);
            if (data.results?.[0]) {
                console.log('- first result:', JSON.stringify(data.results[0], null, 2).substring(0, 500));
            }
        } catch (e) {
            console.log('\nNot JSON, trying to extract...');
            const jsonMatch = text.match(/{[\s\S]*}/);
            if (jsonMatch) {
                const extracted = JSON.parse(jsonMatch[0]);
                console.log('Extracted results count:', extracted.results?.length);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testAPI();
