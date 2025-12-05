const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EU_API_BASE = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA";

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query } = await req.json();
        console.log(`[search-funding] Query: "${query}"`);

        const payload = {
            bool: {
                must: [
                    { terms: { type: ["1", "2", "8"] } },
                    { terms: { status: ["31094501", "31094502"] } }
                ]
            }
        };

        const url = `${EU_API_BASE}&text=${encodeURIComponent(query)}&pageSize=10&page=1`;
        console.log(`[search-funding] Fetching...`);

        const apiResponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            throw new Error(`EU API returned ${apiResponse.status}`);
        }

        // Read as text first to avoid Deno stream issues
        const textResponse = await apiResponse.text();
        console.log(`[search-funding] Got response, length: ${textResponse.length}`);

        const apiData = JSON.parse(textResponse);
        const results = apiData.results || [];
        console.log(`[search-funding] Parsed ${results.length} results`);

        const englishResults = results.filter((item: any) => item.language === 'en');
        const finalResults = englishResults.length > 0 ? englishResults : results;

        const opportunities = finalResults.map((item: any) => {
            const md = item.metadata || {};
            const id = md.identifier?.[0] || "Unknown";
            const title = md.title?.[0] || "Untitled";
            const desc = (md.descriptionByte?.[0] || "").replace(/<[^>]*>?/gm, "");

            let status = "Open";
            const statusCode = md.status?.[0];
            if (statusCode === "31094502") status = "Upcoming";
            else if (statusCode === "31094503") status = "Closed";

            let deadline = null;
            if (md.deadlineDate?.[0]) {
                try {
                    const d = new Date(md.deadlineDate[0]);
                    if (!isNaN(d.getTime())) {
                        deadline = d.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    }
                } catch { }
            }

            return {
                title,
                url: `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${id}`,
                description: desc.substring(0, 500),
                source: "EU Funding Portal",
                status,
                deadline,
                budget: md.ccm2DetailsbudgetTopicActionSub?.[0] || "See details",
                funding_entity: md.frameworkProgramme?.[0] || "EU",
                call_id: id,
                topic: md.destinationDescription?.[0] || "General",
                ccmId: md.ccm2Id?.[0] || md.ccmId?.[0] || null
            };
        });

        console.log(`[search-funding] Returning ${opportunities.length} opportunities`);

        return new Response(
            JSON.stringify({ opportunities }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('[search-funding] Error:', error.message, error.stack);
        return new Response(
            JSON.stringify({ error: error.message, opportunities: [] }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
