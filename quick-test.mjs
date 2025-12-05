const EU_API_BASE = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA";

async function testAPI() {
    const payload = {
        bool: {
            must: [
                { terms: { type: ["1", "2", "8"] } },
                { terms: { status: ["31094501", "31094502"] } }
            ]
        }
    };

    const url = `${EU_API_BASE}&text=${encodeURIComponent("AI")}&pageSize=10&page=1`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    const results = data.results || [];

    console.log(`\nAPI returned ${results.length} results:\n`);

    const summary = results.map((item, i) => {
        const md = item.metadata || {};
        const id = md.identifier?.[0] || "Unknown";
        const title = (md.title?.[0] || "Untitled").substring(0, 50);
        const statusCode = md.status?.[0];

        let deadline = "NO DEADLINE";
        if (md.actions?.[0]) {
            try {
                const actions = JSON.parse(md.actions[0]);
                if (actions?.[0]?.deadlineDates?.[0]) {
                    deadline = new Date(actions[0].deadlineDates[0]).toLocaleDateString('en-US');
                }
            } catch { }
        }

        return `${i + 1}. ${id} | Status:${statusCode} | Deadline:${deadline} | ${title}`;
    });

    summary.forEach(s => console.log(s));
}

testAPI();
