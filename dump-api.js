import { writeFileSync } from 'fs';

const EU_API_BASE = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA";

async function checkStatuses(query) {
    const payload = {
        "bool": {
            "must": [
                {
                    "terms": {
                        "type": ["1", "2", "8"] // Grants
                    }
                }
            ]
        }
    };

    const url = `${EU_API_BASE}&text=${encodeURIComponent(query)}&pageSize=5&page=1`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    // Save to file for inspection
    writeFileSync('api-debug-full.json', JSON.stringify(data, null, 2));
    console.log('Saved full API response to api-debug-full.json');
    console.log(`Found status codes:`);

    const results = data.results || [];
    const statusCodes = new Set();
    results.forEach(r => {
        const code = r.metadata?.status?.[0];
        if (code) statusCodes.add(code);
    });
    console.log(Array.from(statusCodes).join(', '));
}

checkStatuses("AI").catch(console.error);
