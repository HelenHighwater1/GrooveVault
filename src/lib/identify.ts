import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

// Rolling alias — Google retires versioned model names quickly, and a
// stale name fails with a 404 that reads like an identification failure.
const MODEL = "gemini-flash-latest";

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
  const response = await ai.models.generateContent({
    model: MODEL,
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

  const text = response.text;
  if (!text) return null;
  try {
    return JSON.parse(text) as CoverIdentification;
  } catch {
    return null;
  }
}
