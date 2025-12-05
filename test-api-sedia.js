
const baseUrl = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA";

// Payload from documentation for "All grants and Tenders" (filtered for Grants type 1,2,8)
const payload = {
    "bool": {
        "must": [
            {
                "terms": {
                    "type": [
                        "1", // Grant
                        "2", // Grant
                        "8"  // Grant
                    ]
                }
            },
            {
                "terms": {
                    "status": [
                        "31094501", // Open
                        "31094502"  // Forthcoming
                    ]
                }
            }
        ]
    }
};

async function testApi() {
    // Test 1: With text query param
    const urlWithText = `${baseUrl}&text=Horizon`;
    console.log(`\n--- Testing URL: ${urlWithText} ---`);
    console.log("Payload:", JSON.stringify(payload));

    try {
        const res = await fetch(urlWithText, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();

        if (res.ok) {
            console.log("SUCCESS!");
            const data = JSON.parse(text);
            console.log(`Found ${data.hits?.total?.value || data.total || 'unknown'} results.`);
            if (data.hits && data.hits.hits && data.hits.hits.length > 0) {
                console.log("Sample Result:", JSON.stringify(data.hits.hits[0], null, 2));
            } else if (data.results && data.results.length > 0) {
                console.log("Sample Result:", JSON.stringify(data.results[0], null, 2));
            } else {
                console.log("Response Preview:", text.substring(0, 500));
            }
        } else {
            console.log("Error Body:", text);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testApi();
