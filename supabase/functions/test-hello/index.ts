Deno.serve((req) => {
    return new Response(
        JSON.stringify({
            message: "Hello from test function!",
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url
        }),
        {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }
    );
});
