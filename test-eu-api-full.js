const fs = require('fs');

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
        console.log('Content-Type:', response.headers.get('content-type'));

        const text = await response.text();

        // Save full response to file
        fs.writeFileSync('api-response.txt', text);
        console.log('\n✓ Full response saved to api-response.txt');
        console.log(`Response length: ${text.length} characters`);

        // Try to parse as JSON
        try {
            const data = JSON.parse(text);
            console.log('\n✓ Valid JSON');
            console.log('Results count:', data.results?.length || 0);

            if (data.results && data.results.length > 0) {
                console.log('\n=== FIRST RESULT ===');
                const first = data.results[0];
                console.log(JSON.stringify(first, null, 2));

                // Save structured data
                fs.writeFileSync('api-response.json', JSON.stringify(data, null, 2));
                console.log('\n✓ Structured JSON saved to api-response.json');
            }
        } catch (e) {
            console.log('\n✗ Not pure JSON, trying to extract...');
            const jsonMatch = text.match(/{[\s\S]*}/);
            if (jsonMatch) {
                try {
                    const extracted = JSON.parse(jsonMatch[0]);
                    console.log('✓ Extracted JSON');
                    console.log('Results count:', extracted.results?.length || 0);

                    if (extracted.results && extracted.results.length > 0) {
                        console.log('\n=== FIRST RESULT ===');
                        console.log(JSON.stringify(extracted.results[0], null, 2));

                        fs.writeFileSync('api-response.json', JSON.stringify(extracted, null, 2));
                        console.log('\n✓ Extracted JSON saved to api-response.json');
                    }
                } catch (e2) {
                    console.error('Failed to parse extracted JSON:', e2.message);
                }
            } else {
                console.error('No JSON found in response');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testAPI();
