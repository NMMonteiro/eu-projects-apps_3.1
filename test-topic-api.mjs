// Test the topicProjectsList.json endpoint
import { writeFileSync } from 'fs';

const topicId = "48400948"; // The ID from the user's URL
const apiUrl = `https://ec.europa.eu/info/funding-tenders/opportunities/api/topicProjectsList.json?topicId=${topicId}`;

console.log(`Testing endpoint: ${apiUrl}\n`);

const response = await fetch(apiUrl);
const data = await response.json();

console.log(`Status: ${response.status}`);
console.log(`\n=== RESPONSE DATA ===`);
console.log(JSON.stringify(data, null, 2).substring(0, 500));

// Save full response
writeFileSync('topic-api-response.json', JSON.stringify(data, null, 2));
console.log("\n✓ Full response saved to topic-api-response.json");

// Look for deadline and status
if (data.actions) {
    console.log("\n=== DEADLINE & STATUS ===");
    const actions = JSON.parse(data.actions);
    console.log("Status:", actions[0]?.status);
    console.log("Deadline Dates:", actions[0]?.deadlineDates);
    console.log("Planned Opening Date:", actions[0]?.plannedOpeningDate);
}
