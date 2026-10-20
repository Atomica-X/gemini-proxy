Deno.serve(async (req: Request) => {
  // Настройка CORS, чтобы наш Cloudflare Worker мог делать запросы
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
    // Берем путь из запроса (например, /v1beta/interactions)
    const url = new URL(req.url);
    const targetUrl = "https://generativelanguage.googleapis.com" + url.pathname + url.search;

    // Копируем заголовки из оригинального запроса
    const headers = new Headers(req.headers);
    headers.set("Host", "generativelanguage.googleapis.com");

    // Отправляем запрос в Google из дата-центра Deno (США/Европа)
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: headers,
      body: req.body,
    });

    // Возвращаем ответ Google обратно в наш Worker
    const resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});
