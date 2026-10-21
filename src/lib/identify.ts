import "server-only";

import { ApiError, GoogleGenAI, Type } from "@google/genai";

// Rolling aliases — Google retires versioned model names quickly, and a
// stale name fails with a 404 that reads like an identification failure.
// Flash Lite is tried as a fallback when Flash is capacity-limited.
const MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];
const MAX_ATTEMPTS = 3;

export function identifyConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type CoverIdentification = {
  artist: string | null;
  title: string | null;
  label: string | null;
  catno: string | null;
};

const PROMPT = `This photo shows a vinyl record — usually the front cover, but possibly the label, back sleeve, or spine. Identify the release it belongs to.

Read printed text on the cover, label, or spine rather than guessing. The catalog number (catno) is usually printed on the spine, back cover corner, or label — examples: "SKAO 3351", "6488 251", "V6-5001". The label is the record company name (e.g. "Blue Note", "Columbia"), not a description.

Use null for any field you can't determine.`;

export async function identifyCover(image: {
  data: string;
  mimeType: string;
}): Promise<CoverIdentification | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  const call = (model: string) =>
    ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: image.mimeType, data: image.data } },
            { text: PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            artist: { type: Type.STRING, nullable: true },
            title: { type: Type.STRING, nullable: true },
            label: { type: Type.STRING, nullable: true },
            catno: { type: Type.STRING, nullable: true },
          },
        },
      },
    });

  // The free tier 503s under demand spikes and 429s on rate limits — retry
  // across both models before giving up.
  let response;
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      response = await call(MODELS[attempt % MODELS.length]);
      break;
    } catch (e) {
      lastError = e;
      const retryable =
        e instanceof ApiError && (e.status === 429 || e.status === 503);
      if (!retryable || attempt === MAX_ATTEMPTS - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  if (!response) throw lastError;

  const text = response.text;
  if (!text) return null;
  try {
    return JSON.parse(text) as CoverIdentification;
  } catch {
    return null;
  }
}
