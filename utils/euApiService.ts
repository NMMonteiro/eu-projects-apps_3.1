const EU_API_BASE = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA";

export interface Opportunity {
    title: string;
    url: string;
    description: string;
    source: string;
    status?: string;
    deadline?: string | null;
    budget?: string;
    funding_entity?: string;
    call_id?: string;
    topic?: string;
    ccmId?: string | null;
}

export async function searchEuFunding(query: string): Promise<Opportunity[]> {
    // Simple payload - get Open and Upcoming only
    const payload = {
        bool: {
            must: [
                { terms: { type: ["1", "2", "8"] } },
                { terms: { status: ["31094501", "31094502"] } }
            ]
        }
    };

    const url = `${EU_API_BASE}&text=${encodeURIComponent(query)}&pageSize=15&page=1`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    const results = data.results || [];
    const englishResults = results.filter((item: any) => item.language === "en");
    const finalResults = englishResults.length > 0 ? englishResults : results;

    const mapped = finalResults.map((item: any) => mapItem(item));

    // Simple dedupe
    const dedupMap = new Map<string, Opportunity>();
    for (const opp of mapped) {
        const existing = dedupMap.get(opp.call_id!);
        if (!existing || (opp.deadline && !existing.deadline)) {
            dedupMap.set(opp.call_id!, opp);
        }
    }

    return Array.from(dedupMap.values());
}

function mapItem(item: any): Opportunity {
    const md = item.metadata || {};
    const id = md.identifier?.[0] || "Unknown";
    const title = md.title?.[0] || "Untitled";
    let desc = (md.descriptionByte?.[0] || "").replace(/<[^>]*>?/gm, "");

    const url = `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${id}`;

    const statusCode = md.status?.[0];
    let status = "Open";
    if (statusCode === "31094502") status = "Upcoming";

    let deadline: string | null = null;

    if (md.actions?.[0]) {
        try {
            const actions = JSON.parse(md.actions[0]);
            if (actions?.[0]?.deadlineDates?.[0]) {
                const d = new Date(actions[0].deadlineDates[0]);
                if (!isNaN(d.getTime())) {
                    deadline = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                }
            }
        } catch { }
    }

    if (!deadline && md.deadlineDate?.[0]) {
        try {
            const d = new Date(md.deadlineDate[0]);
            if (!isNaN(d.getTime())) {
                deadline = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }
        } catch { }
    }

    return {
        title,
        url,
        description: desc.substring(0, 500),
        source: "EU Funding Portal",
        status,
        deadline: deadline || "Visit portal for deadline",
        budget: md.ccm2DetailsbudgetTopicActionSub?.[0] || "See details",
        funding_entity: md.frameworkProgramme?.[0] || "EU",
        call_id: id,
        topic: md.destinationDescription?.[0] || "General",
        ccmId: md.ccm2Id?.[0] || md.ccmId?.[0] || null,
    };
}
