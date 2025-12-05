
const url = "https://api.tech.ec.europa.eu/search-api/prod/rest/search";

const payloads = [
    { "query": "Horizon Europe", "page": 1, "pageSize": 10 },
    { "keywords": "Horizon Europe", "page": 1, "size": 10 },
    { "text": "Horizon Europe" },
    { "search": "Horizon Europe" },
    {
        "query": {
            "bool": {
                "must": [{ "match": { "title": "Horizon Europe" } }]
            }
        }
    }
];

async function testPayload(payload: any, index: number) {
    console.log(`\n--- Testing Payload ${index + 1} ---`);
    console.log(JSON.stringify(payload));
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Response Preview: ${text.substring(0, 200)}...`);

        if (res.ok) {
            console.log("SUCCESS!");
            return true;
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
    return false;
}

async function run() {
    for (let i = 0; i < payloads.length; i++) {
        if (await testPayload(payloads[i], i)) break;
    }
}

run();
