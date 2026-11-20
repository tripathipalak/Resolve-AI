import { GoogleGenAI } from '@google/genai';

// The only file that talks to Gemini directly. Swap models here without touching business logic.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MAX_ATTEMPTS = 3;

// Retry only temporary failures (overload, rate limit, network drops), with exponential backoff.
function isTransient(err) {
  const text = `${err?.message || ''} ${err?.status || ''}`;
  return /503|429|500|UNAVAILABLE|high demand|fetch failed|ETIMEDOUT|ECONNRESET/i.test(text);
}

async function withRetry(label, fn) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS || !isTransient(err)) throw err;
      const waitMs = 1000 * attempt;
      console.warn(`[gemini] ${label} failed (attempt ${attempt}), retrying in ${waitMs / 1000}s`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
}

export async function generateJSON({ prompt, parts = [] }) {
  return withRetry('generateJSON', async () => {
    const res = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }, ...parts] }],
      config: { responseMimeType: 'application/json', temperature: 0.2 }
    });
    return JSON.parse(res.text);
  });
}

export async function embedTexts(texts) {
  return withRetry('embedTexts', async () => {
    const res = await ai.models.embedContent({
      model: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
      contents: texts,
      config: { outputDimensionality: 768 }
    });
    return res.embeddings.map(e => e.values);
  });
}