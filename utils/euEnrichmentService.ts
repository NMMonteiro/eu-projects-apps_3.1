// Service for enriching EU funding opportunities with accurate deadline/status data
// Calls the EU API directly from the browser (no edge function needed!)

export interface EnrichedOpportunity {
    url: string;
    title: string;
    description: string;
    status: string;
    deadline: string | null;
    openingDate: string | null;
    call_id: string;
    budget?: string;
    funding_entity?: string;
    last_enriched: string;
}

/**
 * Enrich a single opportunity using its ccmId by calling the EU API directly
 */
export async function enrichOpportunity(
    ccmId: string,
    identifier: string,
    baseData: any
): Promise<EnrichedOpportunity | null> {
    try {
        console.log(`[Enrich] Enriching ${identifier} with ccmId ${ccmId}`);

        // Call the EU API directly from the browser (no edge function needed!)
        const apiUrl = `https://ec.europa.eu/info/funding-tenders/opportunities/api/topicProjectsList.json?topicId=${ccmId}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            console.error(`[Enrich] HTTP ${response.status} for ${identifier}`);
            return null;
        }

        const data = await response.json();

        // DEBUG: Log the actual response structure
        console.log(`[Enrich DEBUG] Full response for ${identifier}:`, JSON.stringify(data).substring(0, 500));
        console.log(`[Enrich DEBUG] Has actions field:`, !!data.actions);
        console.log(`[Enrich DEBUG] actions type:`, typeof data.actions);

        // The response has an "actions" field with stringified JSON
        if (data.actions && typeof data.actions === 'string') {
            const actions = JSON.parse(data.actions);

            if (actions && actions.length > 0) {
                const action = actions[0];

                // Extract status
                const status = action.status?.description || action.status?.abbreviation || baseData.status;

                // Extract deadline dates (array)
                const deadlineDates = action.deadlineDates || [];
                const deadline = deadlineDates.length > 0 ? deadlineDates[0] : null;

                // Extract opening date
                const openingDate = action.plannedOpeningDate || null;

                console.log(`[Enrich] ✓ ${identifier}: Status="${status}", Deadline="${deadline}"`);

                return {
                    url: baseData.url,
                    title: baseData.title,
                    description: baseData.description,
                    status: status || baseData.status,
                    deadline: deadline,
                    openingDate: openingDate,
                    call_id: identifier,
                    budget: baseData.budget,
                    funding_entity: baseData.funding_entity,
                    last_enriched: new Date().toISOString()
                };
            }
        }

        console.warn(`[Enrich] No action data found for ${identifier}`);

        // Return base data if enrichment fails
        return {
            url: baseData.url,
            title: baseData.title,
            description: baseData.description,
            status: baseData.status,
            deadline: null,
            openingDate: null,
            call_id: identifier,
            budget: baseData.budget,
            funding_entity: baseData.funding_entity,
            last_enriched: new Date().toISOString()
        };

    } catch (error) {
        console.error(`[Enrich] Exception for ${identifier}:`, error);

        // Return base data if enrichment fails
        return {
            url: baseData.url,
            title: baseData.title,
            description: baseData.description,
            status: baseData.status,
            deadline: null,
            openingDate: null,
            call_id: identifier,
            budget: baseData.budget,
            funding_entity: baseData.funding_entity,
            last_enriched: new Date().toISOString()
        };
    }
}

/**
 * Batch enrich multiple opportunities
 */
export async function batchEnrichOpportunities(
    opportunities: any[],
    onProgress?: (current: number, total: number) => void
): Promise<EnrichedOpportunity[]> {
    const results: EnrichedOpportunity[] = [];
    const total = opportunities.length;

    for (let i = 0; i < total; i++) {
        const opp = opportunities[i];

        if (!opp.ccmId) {
            console.warn(`[Enrich] No ccmId for ${opp.call_id}, skipping enrichment`);
            // Return basic data without enrichment
            results.push({
                url: opp.url,
                title: opp.title,
                description: opp.description,
                status: opp.status,
                deadline: null,
                openingDate: null,
                call_id: opp.call_id,
                budget: opp.budget,
                funding_entity: opp.funding_entity,
                last_enriched: new Date().toISOString()
            });

            if (onProgress) {
                onProgress(i + 1, total);
            }
            continue;
        }

        const enriched = await enrichOpportunity(opp.ccmId, opp.call_id, opp);

        if (enriched) {
            results.push(enriched);
        }

        if (onProgress) {
            onProgress(i + 1, total);
        }

        // Small delay to avoid rate limiting
        if (i < total - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return results;
}
