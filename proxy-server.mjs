import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const EU_API_BASE = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA";

app.post('/api/search-funding', async (req, res) => {
    const { query } = req.body;
    console.log(`[Proxy] Searching for: "${query}"`);

    try {
        const payload = {
            bool: {
                must: [
                    { terms: { type: ["1", "2", "8"] } },
                    { terms: { status: ["31094501", "31094502"] } }
                ]
            }
        };

        const url = `${EU_API_BASE}&text=${encodeURIComponent(query)}&pageSize=10&page=1`;

        const apiResponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            throw new Error(`EU API returned ${apiResponse.status}`);
        }

        const apiData = await apiResponse.json();
        const results = apiData.results || [];

        const englishResults = results.filter(item => item.language === 'en');
        const finalResults = englishResults.length > 0 ? englishResults : results;

        const opportunities = finalResults.map(item => {
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

        console.log(`[Proxy] Returning ${opportunities.length} opportunities`);
        res.json({ opportunities });

    } catch (error) {
        console.error('[Proxy] Error:', error.message);
        res.status(500).json({ error: error.message, opportunities: [] });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`✓ EU API Proxy running on http://localhost:${PORT}`);
    console.log(`  Use: POST http://localhost:${PORT}/api/search-funding`);
});
