// ./lib/openrouter.ts
import OpenAI from "openai";

const apiKeys = [
  process.env.OPENROUTER_API_KEY_1,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
  process.env.OPENROUTER_API_KEY_4,
  process.env.OPENROUTER_API_KEY_5,
].filter(Boolean);

// 8-second timeout (leave 2s buffer before Vercel's 10s limit)
const OPENROUTER_TIMEOUT_MS = 8000;
const OPENROUTER_MODEL = "nvidia/nemotron-3.5-lightning:free";

/**
 * Calls the OpenRouter API with rolling API key support for redundancy.
 * Tries multiple API keys until one succeeds.
 * Respects the 8-second timeout to avoid Vercel's 10s limit.
 *
 * @param messages - Chat messages array for the API call
 * @returns Promise resolving to the response text content
 * @throws Error if all API keys fail or return invalid response
 */
export async function callOpenRouter(
  messages: Array<{ role: "system" | "user"; content: string }>,
): Promise<string> {
  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    const abortController = new AbortController();
    const timeoutId = setTimeout(
      () => abortController.abort(),
      OPENROUTER_TIMEOUT_MS,
    );

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key!,
      defaultHeaders: {
        "HTTP-Referer":
          process.env.VERCEL_ENV === "production"
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : process.env.VERCEL_BRANCH_URL
              ? `https://${process.env.VERCEL_BRANCH_URL}`
              : "",
        "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "",
      },
      timeout: OPENROUTER_TIMEOUT_MS,
    });

    try {
      const res = await openai.chat.completions.create({
        model: OPENROUTER_MODEL,
        messages,
      });

      clearTimeout(timeoutId);

      const reply = res.choices[0].message.content || "";
      console.log(`OpenRouter key ${i + 1} response: ${reply}`);

      return reply;
    } catch (err) {
      clearTimeout(timeoutId);
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`OpenRouter key ${i + 1} failed (${errorMsg}):`, err);

      // If timeout, skip to next key faster
      if (errorMsg.includes("timeout") || errorMsg.includes("abort")) {
        continue;
      }
    }
  }

  throw new Error(
    "All OpenRouter API keys failed or returned invalid response.",
  );
}
