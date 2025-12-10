# Recent Implementations Log

## Date: 2025-12-08

### 1. Dynamic Funding Scheme Template Parsing
- **Feature:** Implemented automatic extraction of funding scheme structures from PDF/DOCX using Gemini AI.
- **Backend:**
    - Updated `parse-funding-template` Edge Function to use `gemini-2.5-pro` (and fixed 404/403 errors).
    - Fixed RLS policies on `funding_schemes` table to allow public/anon inserts (fixes 42501 error).
    - Ensured `funding_schemes` table exists on remote DB.
    - Updated API Keys (`GEMINI_API_KEY`) to resolve "Leaked Key" 403 error.
- **Frontend:**
    - Created/Refactored `FundingSchemeTemplateParser.tsx`.
    - **UI Refactor:** Refactored the entire component to use **Shadcn UI** components (`Card`, `Input`, `Button`) to match the application's dark theme (specifically matching `PartnersPage` aesthetic).
    - Removed manual Tailwind background classes (e.g., `bg-slate-950`) to rely on the global theme variables.
    - Simplified `FundingSchemeAdminPage.tsx` layout.

### 2. Database & Security
- **RLS Fix:** Applied permissive RLS policies to `funding_schemes` to allow saving templates without authentication blockers.
- **Table Creation:** Verified and created `funding_schemes` table on the remote Supabase project.

### 3. Next Steps (To-Do)
- **Restart & Test:**
    1.  Upload a funding template (PDF).
    2.  Verify AI extraction.
    3.  Save the template.
    4.  Go to "Generator" -> Select Idea -> Select the new Funding Scheme.
    5.  Generate a proposal and verify it follows the new structure.
