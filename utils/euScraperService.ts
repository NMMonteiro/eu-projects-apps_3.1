// EU Scraper Service - Fetches and parses individual EU funding pages
// This enriches the basic API data with accurate information from the actual pages

import { supabase } from './supabase';

export interface ScrapedOpportunity {
    url: string;
    title: string;
    call_id: string;
    status: string;
    deadline: string | null;
    description: string;
    budget?: string;
    eligibility?: string;
    last_scraped: string;
}

/**
 * Scrape a single EU funding URL to get accurate data
 * Uses Supabase Edge Function to avoid CORS issues
 */
export async function scrapeEuFundingUrl(url: string): Promise<ScrapedOpportunity | null> {
    console.log(`[Scraper] Scraping URL: ${url}`);

    try {
        // Call Supabase edge function to scrape the URL server-side
        const { data, error } = await supabase.functions.invoke('search-funding', {
            body: {
                mode: 'scrape',
                url: url,
                deepScrape: true
            },
        });

        if (error) {
            console.error('[Scraper] Error:', error);
            return null;
        }

        if (!data || !data.opportunity) {
            console.error('[Scraper] No data returned');
            return null;
        }

        const scraped: ScrapedOpportunity = {
            url: url,
            title: data.opportunity.title || 'Unknown',
            call_id: data.opportunity.call_id || extractCallIdFromUrl(url),
            status: data.opportunity.status || 'Unknown',
            deadline: data.opportunity.deadline || null,
            description: data.opportunity.description || '',
            budget: data.opportunity.budget,
            eligibility: data.opportunity.eligibility,
            last_scraped: new Date().toISOString()
        };

        console.log(`[Scraper] Successfully scraped: ${scraped.title}`);
        return scraped;

    } catch (e) {
        console.error('[Scraper] Failed to scrape:', e);
        return null;
    }
}

/**
 * Get or scrape an opportunity (checks cache first)
 */
export async function getOrScrapeOpportunity(url: string): Promise<ScrapedOpportunity | null> {
    // Check if we have it cached in Supabase
    const cached = await getCachedOpportunity(url);

    if (cached) {
        // Check if cache is fresh (less than 24 hours old)
        const cacheAge = Date.now() - new Date(cached.last_scraped).getTime();
        const hoursSinceScrape = cacheAge / (1000 * 60 * 60);

        if (hoursSinceScrape < 24) {
            console.log(`[Scraper] Using cached data for: ${url}`);
            return cached;
        }
    }

    // Scrape fresh data
    const scraped = await scrapeEuFundingUrl(url);

    if (scraped) {
        // Cache it
        await cacheOpportunity(scraped);
    }

    return scraped;
}

/**
 * Get cached opportunity from Supabase
 */
async function getCachedOpportunity(url: string): Promise<ScrapedOpportunity | null> {
    try {
        const { data, error } = await supabase
            .from('scraped_opportunities')
            .select('*')
            .eq('url', url)
            .single();

        if (error || !data) {
            return null;
        }

        return data as ScrapedOpportunity;
    } catch (e) {
        return null;
    }
}

/**
 * Cache opportunity in Supabase
 */
async function cacheOpportunity(opportunity: ScrapedOpportunity): Promise<void> {
    try {
        const { error } = await supabase
            .from('scraped_opportunities')
            .upsert(opportunity, { onConflict: 'url' });

        if (error) {
            console.error('[Scraper] Failed to cache:', error);
        }
    } catch (e) {
        console.error('[Scraper] Cache error:', e);
    }
}

/**
 * Extract call ID from URL
 */
function extractCallIdFromUrl(url: string): string {
    const match = url.match(/topic-details\/([^/?]+)/);
    return match ? match[1] : 'Unknown';
}

/**
 * Batch scrape multiple URLs (with rate limiting)
 */
export async function batchScrapeOpportunities(
    urls: string[],
    onProgress?: (current: number, total: number) => void
): Promise<ScrapedOpportunity[]> {
    const results: ScrapedOpportunity[] = [];

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];

        if (onProgress) {
            onProgress(i + 1, urls.length);
        }

        const scraped = await getOrScrapeOpportunity(url);

        if (scraped) {
            results.push(scraped);
        }

        // Rate limit: wait 500ms between requests
        if (i < urls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return results;
}
