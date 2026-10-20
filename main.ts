Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-goog-api-key, Authorization",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = "https://generativelanguage.googleapis.com" + url.pathname + url.search;
    const headers = new Headers(req.headers);
    headers.set("Host", "generativelanguage.googleapis.com");
    headers.delete("content-length");

    const bodyText = req.body ? await req.text() : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: bodyText,
    });

    const responseBody = await response.arrayBuffer();
    const resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.delete("content-encoding");
    resHeaders.delete("transfer-encoding");
    resHeaders.delete("content-length");

    return new Response(responseBody, { status: response.status, headers: resHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});
