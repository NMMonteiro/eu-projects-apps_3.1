
const url = "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home";

async function run() {
    try {
        const res = await fetch(url);
        const text = await res.text();
        console.log(text);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
