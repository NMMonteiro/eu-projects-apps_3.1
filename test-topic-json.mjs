// Test fetching the .json endpoint for full topic details
import { writeFileSync } from 'fs';

const jsonUrl = "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/HORIZON-CL4-2025-04-DATA-03.json";

console.log(`Fetching topic JSON: ${jsonUrl}\n`);

const response = await fetch(jsonUrl);
const data = await response.json();

console.log("=== TOPIC JSON RESPONSE ===");
console.log(`Status: ${response.status}\n`);

if (data) {
    console.log("Available fields:");
    Object.keys(data).forEach(key => {
        const value = data[key];
        if (typeof value === 'string' && value.length < 200) {
            console.log(`  - ${key}: ${value}`);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            console.log(`  - ${key}: [object with ${Object.keys(value).length} fields]`);
        } else if (Array.isArray(value)) {
            console.log(`  - ${key}: [array with ${value.length} items]`);
        } else {
            console.log(`  - ${key}: ${typeof value}`);
        }
    });

    // Look for deadline/status fields
    console.log("\n=== DEADLINE & STATUS FIELDS ===");
    const relevantFields = ['deadline', 'deadlineDate', 'closingDate', 'status', 'callStatus', 'topicStatus'];
    relevantFields.forEach(field => {
        if (data[field]) {
            console.log(`  ✓ ${field}: ${JSON.stringify(data[field]).substring(0, 200)}`);
        }
    });

    // Save full response
    writeFileSync('topic-json-full.json', JSON.stringify(data, null, 2));
    console.log("\n✓ Full JSON saved to topic-json-full.json");
} else {
    console.log("No data returned!");
}
