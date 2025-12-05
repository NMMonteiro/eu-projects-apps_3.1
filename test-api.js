
const baseUrl = "https://api.tech.ec.europa.eu/search-api/prod/rest/search";

const types = ["topic", "call", "1", "0", "grant", "tender", "opportunity"];
const payload = { "query": "Horizon Europe", "page": 1, "pageSize": 10 };

async function testType(type) {
    const url = `${baseUrl}?type=${type}`;
    console.log(`\n--- Testing URL: ${url} ---`);
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
        console.log(`Response Body: ${text.substring(0, 500)}`);

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
    for (const type of types) {
        if (await testType(type)) break;
    }
}

run();
