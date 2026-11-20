import Policy from '../models/Policy.js';
import { embedTexts } from './gemini.service.js';
import { httpError } from '../utils/httpError.js';

// Splits policy text into ~800-char chunks, tagging each with its section number (e.g. "4.2").
export function chunkPolicy(text) {
  const chunks = [];
  let section = 'General';
  let buf = '';
  const flush = () => {
    if (buf.trim()) chunks.push({ text: buf.trim(), section });
    buf = '';
  };
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:Section\s+)?(\d+(?:\.\d+)*)[.)]?\s+\S/i);
    if (m) { flush(); section = m[1]; }
    if (buf.length + line.length > 800) flush();
    buf += line + '\n';
  }
  flush();
  return chunks;
}

export async function ingestPolicyText({ title, category, source, text }) {
  const pieces = chunkPolicy(text);
  if (!pieces.length) throw httpError(400, 'No text found in policy');

  const vectors = [];
  for (let i = 0; i < pieces.length; i += 50) {
    vectors.push(...await embedTexts(pieces.slice(i, i + 50).map(p => p.text)));
  }
  const chunks = pieces.map((p, i) => ({ ...p, embedding: vectors[i] }));
  return Policy.create({ title, category, source, chunks });
}
