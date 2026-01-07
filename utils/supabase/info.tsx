/**
 * CONFIGURATION INSTRUCTIONS
 * 
 * 1. LOCAL DEVELOPMENT:
 *    If you are running locally, you must start the Supabase Edge Functions.
 *    Run this command in your terminal:
 *    > supabase functions serve
 * 
 * 2. PRODUCTION / HOSTED:
 *    Your project credentials are configured below.
 *    Ensure you have deployed the edge functions to Supabase:
 *    > supabase functions deploy make-server-3cb71dae
 */

export const projectId: string = import.meta.env.VITE_SUPABASE_PROJECT_ID || "swvvyxuozwqvyaberqvu";
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NjI0NDQ4MCwiZXhwIjo0OTIxOTE4MDgwLCJyb2xlIjoiYW5vbiJ9.sSgImIcunZK0AiKgHANYatEZKQ_d_-M9S2xTKFxf8wM";

// Determines the backend URL based on the projectId.
// If projectId is default "your-project-id", it assumes localhost.
// Otherwise it uses the production Supabase URL.
// Forcing production URL since local Docker is not running
export const serverUrl = `https://${projectId}.supabase.co/functions/v1/server`;
export const functionsUrl = `https://${projectId}.supabase.co/functions/v1`;
// export const serverUrl = import.meta.env.DEV || projectId === "your-project-id"
//   ? "http://localhost:54321/functions/v1/server"
//   : `https://${projectId}.supabase.co/functions/v1/server`;