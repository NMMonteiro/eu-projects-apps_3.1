
const url = "https://ec.europa.eu/info/funding-tenders/opportunities/portal/scripts.f84282425e79bc8a.js";

async function run() {
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log("JS Length:", text.length);

        // Find "apiKey" occurrences
        const regex = /apiKey/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            console.log(`Found "apiKey" at ${match.index}`);
            // Print surrounding context
            const start = Math.max(0, match.index - 100);
            const end = Math.min(text.length, match.index + 100);
            console.log(text.substring(start, end));
        }

        // Also look for payload structure near "POST"
        // This is harder in minified code, but let's try to find where the URL is defined.
    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
