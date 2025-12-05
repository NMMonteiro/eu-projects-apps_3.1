async function testScraper() {
    const searchUrl = `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals?keywords=AI&isExactMatch=false&status=31094501,31094502&frameworkProgramme=43108390`;

    console.log('Fetching:', searchUrl);

    const response = await fetch(searchUrl);
    const html = await response.text();

    console.log(`\nGot HTML: ${html.length} characters`);
    console.log(`\nFirst 1000 chars:\n${html.substring(0, 1000)}`);

    // Look for opportunity links
    const links = html.match(/topic-details\/([A-Z0-9\-]+)/g);
    if (links) {
        console.log(`\nFound ${links.length} topic links:`);
        const unique = [...new Set(links)];
        unique.slice(0, 10).forEach((link, i) => {
            console.log(`${i + 1}. ${link}`);
        });
    } else {
        console.log('\nNo topic links found');
    }
}

testScraper().catch(console.error);
