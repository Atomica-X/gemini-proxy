import { getContext } from "@/server/service/context";
import type { ProviderCall } from "./types";

interface GeminiResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{
				text?: string;
			}>;
		};
	}>;
}

// Модели для ротации (от новейшей к самой стабильной)
const GEMINI_MODELS = [
	"gemini-3.8-flash",
	"gemini-3.7-flash",
	"gemini-3.5-flash",
	"gemini-flash-latest",
	"gemini-2.5-flash",
];

export const callGemini: ProviderCall = async (system, user) => {
	const env = getContext() as unknown as Record<string, string | undefined>;
	const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
	
	if (!apiKey) {
		throw new Error("GEMINI_API_KEY не задан в .dev.vars");
	}

	const baseUrl = "https://gemini-proxy.atomica-x.deno.net/v1beta/models";

	// Перебираем модели
	for (const modelId of GEMINI_MODELS) {
		try {
			console.log(`[gemini] Пробуем модель: ${modelId}...`);
			
			const url = `${baseUrl}/${modelId}:generateContent`;
			
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"x-goog-api-key": apiKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					systemInstruction: {
						parts: [{ text: system }]
					},
					contents: [
						{ role: "user", parts: [{ text: user }] }
					],
					generationConfig: {
						responseMimeType: "application/json", // Просим строгий JSON
						temperature: 0.5
					}
				}),
			});

			if (!response.ok) {
				// Если перегрузка (503) или лимиты (429), пробуем следующую модель
				if (response.status === 503 || response.status === 429) {
					console.warn(`[gemini] Модель ${modelId} недоступна (${response.status}). Переключаюсь...`);
					continue; 
				}
				// Если ошибка другая (например, 400), выбрасываем исключение
				const errorText = await response.text();
				throw new Error(`Gemini API error: ${response.status} ${errorText}`);
			}

			const data = (await response.json()) as GeminiResponse;
			const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

			if (!text) {
				throw new Error("Пустой ответ от Gemini");
			}

			console.log(`[gemini] ✅ Успех через модель: ${modelId}`);
			return text;

		} catch (error: any) {
			console.error(`[gemini] Ошибка при запросе к ${modelId}:`, error.message);
		}
	}

	throw new Error("Все доступные модели Gemini исчерпали лимиты или недоступны.");
};
