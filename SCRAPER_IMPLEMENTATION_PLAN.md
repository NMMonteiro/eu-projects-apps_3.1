# EU FUNDING SCRAPER - COMPLETE IMPLEMENTATION PLAN

## Problem Statement
The EU API returns URLs but **NO reliable deadline or status data**. We need to scrape actual EU funding pages to get accurate information.

## Technical Stack
- **HTML Parser**: `deno-dom` (Deno-native, fast, jQuery-like syntax)
- **Runtime**: Supabase Edge Functions (Deno)
- **Cache**: Supabase PostgreSQL (`scraped_opportunities` table)
- **Frontend**: React with existing UI

## Implementation Steps

### PHASE 1: Update Edge Function for Scraping (30 min)

#### 1.1 Add Dependencies
Update `supabase/functions/search-funding/deno.json`:
```json
{
  "imports": {
    "@supabase/supabase-js": "npm:@supabase/supabase-js@^2.39.0",
    "@google/generative-ai": "npm:@google/generative-ai@^0.1.3",
    "deno-dom": "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts"
  }
}
```

#### 1.2 Add Scraping Function
Add to `supabase/functions/search-funding/index.ts`:

```typescript
import { DOMParser } from "deno-dom";

async function scrapeEuFundingPage(url: string) {
    console.log(`[Scraper] Fetching: ${url}`);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        
        if (!doc) {
            throw new Error("Failed to parse HTML");
        }
        
        // Extract deadline (look for common patterns)
        let deadline = null;
        
        // Try multiple selectors that EU portal uses
        const deadlineSelectors = [
            'td:contains("Deadline"):last-child',  // Table format
            '.deadline-date',                       // Class-based
            '[data-deadline]',                      // Data attribute
        ];
        
        for (const selector of deadlineSelectors) {
            const el = doc.querySelector(selector);
            if (el && el.textContent) {
                deadline = el.textContent.trim();
                break;
            }
        }
        
        // If not found, search text for date patterns
        if (!deadline) {
            const text = doc.querySelector('body')?.textContent || '';
            // Match dates like "02 October 2025" or "2025-10-02"
            const dateMatch = text.match(/(\d{1,2}\s+\w+\s+\d{4})|(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                deadline = dateMatch[0];
            }
        }
        
        // Extract status
        let status = "Open"; // Default
        const statusEl = doc.querySelector('[class*="status"]');
        if (statusEl) {
            const statusText = statusEl.textContent?.toLowerCase() || '';
            if (statusText.includes('closed')) status = "Closed";
            else if (statusText.includes('forthcoming')) status = "Forthcoming";
        }
        
        // Extract title
        const title = doc.querySelector('h1')?.textContent?.trim() || "Unknown";
        
        return {
            url,
            title,
            status,
            deadline,
            raw_html: html.substring(0, 1000), // Keep sample for debugging
        };
        
    } catch (error) {
        console.error(`[Scraper] Error scraping ${url}:`, error);
        return null;
    }
}
```

#### 1.3 Update Main Handler
Modify the main `Deno.serve` handler to support scrape mode:

```typescript
const body = await req.json();
const { query, mode, url } = body;

if (mode === 'scrape' && url) {
    // Scrape single URL
    const scraped = await scrapeEuFundingPage(url);
    return new Response(
        JSON.stringify({ opportunity: scraped }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

// Otherwise, normal search...
```

### PHASE 2: Frontend Integration (20 min)

#### 2.1 Keep Simple Scraper Service
The `euScraperService.ts` we created is good - just needs the edge function to work.

#### 2.2 Update Hybrid Page
The `FundingSearchHybrid.tsx` is already set up correctly.

### PHASE 3: Testing & Deployment (20 min)

#### 3.1 Deploy Edge Function
```bash
supabase functions deploy search-funding
```

#### 3.2 Test Scraping
Go to `/funding-hybrid` and search for "AI"

#### 3.3 Verify Cache
Check Supabase dashboard → `scraped_opportunities` table for cached results

## Expected Behavior After Implementation

1. **First Search ("AI")**:
   - EU API returns 7 URLs (fast)
   - Scrapes each URL for accurate deadline (~3-5 seconds)
   - Caches all 7 results in Supabase
   - Shows ONLY valid, open opportunities

2. **Second Search ("AI")** (same day):
   - Hits cache instantly
   - Returns in <1 second
   - No scraping needed!

3. **Stale Cache** (next day):
   - Detects cache is >24h old
   - Re-scrapes for fresh data
   - Updates cache

## Key Advantages

✅ **Accurate data** - Directly from EU pages
✅ **Fast when cached** - Instant on repeat searches
✅ **Reliable filtering** - We have real deadlines!
✅ **Server-side** - No CORS issues
✅ **Deno-native** - Uses `deno-dom`, optimized for Supabase

## Potential Issues & Solutions

**Issue**: EU portal structure changes
**Solution**: Multiple selector fallbacks + text search

**Issue**: Rate limiting
**Solution**: Already solving with cache + 500ms delay between requests

**Issue**: Scraping fails
**Solution**: Graceful fallback - show URL but mark deadline as "Unknown"

## Time Estimate
- **Total**: 70 minutes
- **Phase 1** (Edge Function): 30 min
- **Phase 2** (Frontend): 20 min  
- **Phase 3** (Testing): 20 min

## Next Steps
1. I'll update the edge function with scraping logic
2. Deploy and test
3. Verify it works end-to-end

Ready to proceed? 🚀
