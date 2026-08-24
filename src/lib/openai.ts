import OpenAI from "openai";

let client: OpenAI | null = null;

/**
 * Returns a shared OpenAI client when the server has an API key configured.
 * Keeping creation lazy lets API routes report a controlled configuration error.
 */
export function getOpenAIClient(): OpenAI | null {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) return null;

    client ??= new OpenAI({ apiKey });

    return client;
}
