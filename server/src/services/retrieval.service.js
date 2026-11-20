import Policy from '../models/Policy.js';
import { embedTexts } from './gemini.service.js';

// Passages below this similarity are treated as irrelevant. Tune with real complaints.
const MIN_SCORE = Number(process.env.RETRIEVAL_MIN_SCORE || 0.55);

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export async function retrieveRelevantChunks(query, k = 5) {
  const [queryVector] = await embedTexts([query]);
  const policies = await Policy.find({ isActive: true }).lean();
  const scored = [];
  for (const p of policies) {
    for (const c of p.chunks) {
      scored.push({
        policyTitle: p.title,
        section: c.section,
        text: c.text,
        score: cosine(queryVector, c.embedding)
      });
    }
  }
  return scored
    .filter(s => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}