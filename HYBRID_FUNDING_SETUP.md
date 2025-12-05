# HYBRID FUNDING SEARCH - SETUP INSTRUCTIONS

## What This Does
This is a BETTER approach to EU funding search:
1. ✅ Uses EU API to find relevant URLs (it's good at this)
2. ✅ Scrap es each URL to get ACCURATE data (deadline, status, etc.)
3. ✅ Caches results in Supabase (fast future searches)
4. ✅ Only shows truly open opportunities

## Setup Steps

### 1. Create the Supabase Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Paste the contents of: supabase/migrations/create_scraped_opportunities.sql
```

### 2. Access the New Page
Navigate to: **http://localhost:3000/funding-hybrid**

### 3. Test It
1. Search for "AI" or any keyword
2. Watch the progress:
   - Step 1: Fetches URLs from EU API (fast)
   - Step 2: Scrapes each URL for accurate data (slower, but accurate!)
3. See only REAL open opportunities with VERIFIED deadlines

## How It Works

```
EU API (fast, incomplete data)
        ↓
Gets list of URLs
        ↓
Scrape each URL (slower, but accurate)
        ↓
Cache in Supabase (for 24 hours)
        ↓
Display enriched results
```

## Benefits
- ✅ Accurate deadlines (from actual pages)
- ✅ Accurate status (not relying on API codes)
- ✅ Cached (second search is instant)
- ✅ Filters work correctly (we have real data!)

## Next Steps
- Test with different search terms
- Verify results match EU portal
- If it works, we can replace the old funding page!
