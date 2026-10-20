Deno.serve(async (req: Request) => {
  // Разрешаем CORS
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
    
    // ЛОГ: Посмотрим, какой метод реально пришел от Cloudflare
    console.log(`[Deno Proxy] Входящий запрос: ${req.method} ${url.pathname}`);

    const headers = new Headers(req.headers);
    headers.set("Host", "generativelanguage.googleapis.com");
    headers.delete("content-length");

    // Читаем тело, если оно есть
    const bodyText = req.body ? await req.text() : undefined;

    // ПРИНУДИТЕЛЬНО шлем POST, даже если пришел GET (чтобы обойти редиректы)
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
    console.error("[Deno Proxy] Ошибка:", err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});
