import { generateJSON } from './gemini.service.js';
import { evidenceSchema } from '../validators/ai.schema.js';

// Multimodal call: images and PDFs go to Gemini as inline data alongside the text prompt.
export async function analyzeEvidence(ticket) {
  const files = ticket.evidence.filter(f => f.mimeType.startsWith('image/') || f.mimeType === 'application/pdf');
  if (!files.length) return { findings: [] };

  const parts = files.map(f => ({
    inlineData: { mimeType: f.mimeType, data: f.data.toString('base64') }
  }));
  const prompt = `Describe ONLY what is visibly shown in these evidence files, in the order given: ${files.map(f => f.fileName).join(', ')}.
Do not infer facts that are not visible. For each file return:
- fileName
- observation: what is visibly shown
- relevantToComplaint: true if it relates to this complaint: """${ticket.description}"""
Return JSON: {"findings": [...]}`;

  return evidenceSchema.parse(await generateJSON({ prompt, parts }));
}
