
const SUPABASE_URL = "https://swvvyxuozwqvyaberqvu.supabase.co/functions/v1/search-funding";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dnZ5eHVvendxdnlhYmVycXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjIwMDgsImV4cCI6MjA3OTA5ODAwOH0.jcCynwcnnYSosAgf9QSdx_2FCl9FOx3lTXSiM3n27xQ";

async function testBackend() {
    console.log(`Testing Backend: ${SUPABASE_URL}`);

    const payload = {
        query: "Horizon",
        useAiSearch: true, // This triggers the EU API now
        filterStatus: "all"
    };

    console.log("Payload:", JSON.stringify(payload));

    try {
        const res = await fetch(SUPABASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();

        if (res.ok) {
            try {
                const data = JSON.parse(text);
                console.log(`Found ${data.opportunities?.length || 0} opportunities.`);
                if (data.opportunities && data.opportunities.length > 0) {
                    console.log("Sample Opportunity:", JSON.stringify(data.opportunities[0], null, 2));
                    if (data.opportunities[0].description) {
                        console.log("FULL DESCRIPTION:", data.opportunities[0].description);
                    }
                } else {
                    console.log("Full Response:", text);
                }
            } catch (e) {
                console.log("Response (Text):", text);
            }
        } else {
            console.log("Error Response:");
            console.log("Status:", res.status, res.statusText);
            console.log("Body:", text);
            // Try to parse as JSON to see error details
            try {
                const errData = JSON.parse(text);
                console.log("Error Details:", JSON.stringify(errData, null, 2));
            } catch (e) {
                // Not JSON, already printed as text
            }
        }
    } catch (e) {
        console.error("Fetch Error:", e.message);
        console.error("Full Error:", e);
    }
}

testBackend();
