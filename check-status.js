// Quick debug script to check what status codes we're actually getting
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

    const url = `${EU_API_BASE}&text=${encodeURIComponent(query)}&pageSize=20&page=1`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    const results = data.results || [];

    console.log(`\nTotal results: ${results.length}\n`);

    // Take first 3 results and dump ALL metadata fields
    results.slice(0, 3).forEach((item, i) => {
        const md = item.metadata || {};
        console.log(`\n========== RESULT ${i + 1} ==========`);
        console.log(`Title: ${(md.title?.[0] || '').substring(0, 80)}`);
        console.log(`\nALL METADATA FIELD NAMES:`);
        console.log(Object.keys(md).join(', '));
        console.log(`\nSTATUS FIELDS:`);
        console.log(`  status: "${md.status?.[0]}"`);
        console.log(`  statusName: "${md.statusName?.[0]}"`);
        console.log(`\nDEADLINE FIELDS:`);
        console.log(`  deadlineDate: "${md.deadlineDate?.[0]}"`);
        console.log(`  ccm2DetailssubmissionProcedureCutOffDates: "${md.ccm2DetailssubmissionProcedureCutOffDates?.[0]}"`);
        console.log(`  deadlineModel: "${md.deadlineModel?.[0]}"`);
        console.log(`  deadlineModelDate: "${md.deadlineModelDate?.[0]}"`);
    });
}

checkStatuses("AI").catch(console.error);
