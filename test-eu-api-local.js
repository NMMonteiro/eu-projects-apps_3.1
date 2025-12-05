
import fs from 'fs';

const EU_API_BASE = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA";

async function testEuApi() {
    console.log("Testing EU API from Local Machine...");

    const query = "AI";
    // Broad payload: No filters, just search text
    const payload = {
        "bool": {
            "must": []
        }
    };

    const url = `${EU_API_BASE}&text=${encodeURIComponent(query)}&pageSize=5&page=1`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();

        fs.writeFileSync('api_response.json', text);
        console.log("Response saved to api_response.json");

        try {
            const data = JSON.parse(text);
            console.log("Data Keys:", Object.keys(data));
            if (data.hits) console.log("Hits Keys:", Object.keys(data.hits));
        } catch (e) {
            console.log("Response is not JSON");
        }

    } catch (e) {
        console.error("Local Fetch Failed:", e);
    }
}

testEuApi();
