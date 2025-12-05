// Local test of the EU API with the corrected mapping logic
const EU_API_BASE = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA";

async function searchWithEuApi(query) {
    console.log(`[searchWithEuApi] Searching for: "${query}"`);

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

    const url = `${EU_API_BASE}&text=${encodeURIComponent(query)}&pageSize=15&page=1`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error(`API Error: ${res.status} ${res.statusText}`);
            return [];
        }

        const data = await res.json();
        const results = data.results || [];
        console.log(`Found ${results.length} total results`);

        // Filter for English results
        const englishResults = results.filter(item => item.language === 'en');
        console.log(`Found ${englishResults.length} English results`);

        const finalResults = englishResults.length > 0 ? englishResults : results;

        return finalResults.slice(0, 5).map(item => mapEuApiItemToOpportunity(item));

    } catch (e) {
        console.error('[searchWithEuApi] Failed:', e);
        return [];
    }
}

function mapEuApiItemToOpportunity(item) {
    const md = item.metadata || {};

    const identifier = md.identifier?.[0] || md.callIdentifier?.[0] || item.reference || "Unknown ID";
    const title = md.title?.[0] || item.title || item.summary || "Untitled Opportunity";

    let description = md.descriptionByte?.[0] || md.description?.[0] || item.summary || item.content || "No description available.";
    description = description.replace(/<[^>]*>?/gm, '');

    const url = item.url || `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${identifier}`;
    const deadline = md.deadlineDate?.[0] || "Unknown";

    const statusCode = md.status?.[0];
    let status = "Open";
    if (statusCode === "31094502") status = "Upcoming";
    if (statusCode === "31094503") status = "Closed";

    return {
        title: title,
        url: url,
        description: description.substring(0, 200) + (description.length > 200 ? "..." : ""),
        source: "EU Funding Portal (Official API)",
        status: status,
        deadline: deadline,
        budget: "See details",
        funding_entity: md.frameworkProgramme?.[0] || "EU",
        call_id: identifier,
        topic: md.destinationDescription?.[0] || "General"
    };
}

// Test the function
searchWithEuApi("AI").then(results => {
    console.log("\n=== SEARCH RESULTS ===");
    console.log(`Total opportunities: ${results.length}`);
    results.forEach((opp, i) => {
        console.log(`\n--- Opportunity ${i + 1} ---`);
        console.log(`Title: ${opp.title}`);
        console.log(`Call ID: ${opp.call_id}`);
        console.log(`Status: ${opp.status}`);
        console.log(`Deadline: ${opp.deadline}`);
        console.log(`Budget: ${opp.budget}`);
        console.log(`URL: ${opp.url}`);
        console.log(`Description: ${opp.description.substring(0, 100)}...`);
    });
});
