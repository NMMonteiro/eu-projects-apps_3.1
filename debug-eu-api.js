// Debug script - save to file instead of console
const fs = require('fs');

const EU_API_BASE = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA";

async function debugEuApi(query) {
    const payload = {
        "bool": {
            "must": [
                {
                    "terms": {
                        "type": ["1", "2", "8"] // Grants
                    }
                },
                {
                    "terms": {
                        "status": ["31094501", "31094502"] // Open, Forthcoming
                    }
                }
            ]
        }
    };

    const url = `${EU_API_BASE}&text=${encodeURIComponent(query)}&pageSize=3&page=1`;

    const res = await globalThis.fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    // Save full response to JSON file]
    fs.writeFileSync('eu-api-debug-output.json', JSON.stringify(data, null, 2));
    console.log('Saved response to eu-api-debug-output.json');

    const results = data.results || [];
    console.log(`Total results: ${results.length}`);

    results.forEach((item, i) => {
        const md = item.metadata || {};
        console.log(`\nItem ${i + 1}:`);
        console.log(`  status: ${md.status?.[0]}`);
        console.log(`  deadlineDate: ${md.deadlineDate?.[0]}`);
        console.log(`  title:${(md.title?.[0] || '').substring(0, 60)}`);
    });
}

debugEuApi("AI").catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
