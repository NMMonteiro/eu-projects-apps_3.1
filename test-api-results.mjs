const EU_API_BASE = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA";

async function testAPI() {
    console.log('Testing EU API with Open/Upcoming filter...\n');

    const payload = {
        bool: {
            must: [
                { terms: { type: ["1", "2", "8"] } },
                { terms: { status: ["31094501", "31094502"] } } // Open, Upcoming
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

    console.log(`Total results: ${results.length}\n`);
    console.log('='.repeat(80));

    results.forEach((item, i) => {
        const md = item.metadata || {};
        const id = md.identifier?.[0] || "Unknown";
        const title = md.title?.[0] || "Untitled";
        const statusCode = md.status?.[0];

        let status = "Open";
        if (statusCode === "31094502") status = "Upcoming";
        else if (statusCode === "31094503") status = "Closed";

        let deadline = null;
        if (md.actions?.[0]) {
            try {
                const actions = JSON.parse(md.actions[0]);
                if (actions?.[0]?.deadlineDates?.[0]) {
                    deadline = new Date(actions[0].deadlineDates[0]).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    });
                }
            } catch { }
        }

        if (!deadline && md.deadlineDate?.[0]) {
            try {
                deadline = new Date(md.deadlineDate[0]).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });
            } catch { }
        }

        console.log(`\n${i + 1}. ${title.substring(0, 60)}`);
        console.log(`   Call ID: ${id}`);
        console.log(`   Status: ${status} (code: ${statusCode})`);
        console.log(`   Deadline: ${deadline || 'NOT FOUND'}`);
        console.log(`   URL: https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${id}`);
    });

    console.log('\n' + '='.repeat(80));
}

testAPI().catch(console.error);
