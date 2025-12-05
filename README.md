<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DwSC7FZ3UGJ5HBkfssd4c6ej3IY-6l5K

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run Supabase Functions Locally

1. Ensure you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed.
2. Make sure your `.env.local` file contains the following keys:
   ```
   GEMINI_API_KEY=...
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. Start the Supabase functions:
   ```bash
   supabase functions serve --env-file .env.local --no-verify-jwt
   ```
