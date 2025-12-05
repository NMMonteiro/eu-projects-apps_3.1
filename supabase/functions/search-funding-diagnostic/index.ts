import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { query } = body;

        console.log('[DIAGNOSTIC] Starting test...');
        const diagnostics = {
            query,
            timestamp: new Date().toISOString(),
            tests: {}
        };

        // Test 1: Check if we can make HTTP requests
        try {
            console.log('[DIAGNOSTIC] Testing basic HTTP...');
            const testResponse = await fetch('https://httpbin.org/get');
            diagnostics.tests.basicHttp = {
                success: testResponse.ok,
                status: testResponse.status
            };
        } catch (e) {
            diagnostics.tests.basicHttp = {
                success: false,
                error: e.message
            };
        }

        // Test 2: Try EU Portal API
        try {
            console.log('[DIAGNOSTIC] Testing EU Portal API...');
            const apiUrl = `https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=${encodeURIComponent(query || 'AI')}&pageSize=5`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            const text = await response.text();

            diagnostics.tests.euPortalApi = {
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                responseLength: text.length,
                responseSample: text.substring(0, 500)
            };

            if (response.ok) {
                try {
                    const data = JSON.parse(text);
                    diagnostics.tests.euPortalApi.resultsCount = data.results?.length || 0;
                    diagnostics.tests.euPortalApi.hasResults = (data.results?.length || 0) > 0;
                } catch (e) {
                    diagnostics.tests.euPortalApi.jsonParseError = e.message;
                }
            }
        } catch (e) {
            diagnostics.tests.euPortalApi = {
                success: false,
                error: e.message,
                stack: e.stack
            };
        }

        // Test 3: Check Gemini API Key
        const geminiKey = Deno.env.get('GEMINI_API_KEY');
        diagnostics.tests.geminiApiKey = {
            exists: !!geminiKey,
            length: geminiKey?.length || 0
        };

        console.log('[DIAGNOSTIC] Results:', JSON.stringify(diagnostics, null, 2));

        return new Response(
            JSON.stringify(diagnostics, null, 2),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[DIAGNOSTIC ERROR]', error);
        return new Response(
            JSON.stringify({
                error: error.message,
                stack: error.stack
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
