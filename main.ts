Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-goog-api-key, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = "https://generativelanguage.googleapis.com" + url.pathname + url.search;
    const headers = new Headers(req.headers);
    headers.set("Host", "generativelanguage.googleapis.com");
    
    // ВАЖНО: Убираем content-length, Deno пересчитает его сам
    headers.delete("content-length");

    // ВАЖНО: Читаем тело как текст, чтобы избежать ошибок со стримами
    const bodyText = await req.text();

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: headers,
      body: bodyText,
    });

    const resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error("Proxy Error:", err); // Это появится в логах Deno
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});
