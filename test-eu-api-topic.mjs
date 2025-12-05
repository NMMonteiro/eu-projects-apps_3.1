// Test if we can get detailed topic info from the EU API directly
import { writeFileSync } from 'fs';

const topicId = "HORIZON-CL4-2025-04-DATA-03";
const apiUrl = `https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=${topicId}`;

console.log(`Testing EU API for topic: ${topicId}`);
console.log(`URL: ${apiUrl}\n`);

const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        "bool": {
            "must": [
                {
                    "terms": {
                        "type": ["1", "2", "8"]
                    }
                }
            ]
        }
    })
});

const data = await response.json();

console.log(`\n=== API RESPONSE ===`);
console.log(`Status: ${response.status}`);
console.log(`Results found: ${data.results?.length || 0}\n`);

if (data.results && data.results.length > 0) {
    const firstResult = data.results[0];

    console.log("=== FIRST RESULT METADATA ===");
    console.log("Available fields:");
    Object.keys(firstResult.metadata || {}).forEach(key => {
        const value = firstResult.metadata[key];
        if (Array.isArray(value) && value.length > 0) {
            console.log(`  - ${key}: ${value[0].substring(0, 100)}`);
        }
    });

    // Save full response
    writeFileSync('eu-api-topic-response.json', JSON.stringify(data, null, 2));
    console.log("\n✓ Full response saved to eu-api-topic-response.json");
} else {
    console.log("No results found!");
}
