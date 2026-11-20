import { generateJSON } from './gemini.service.js';
import { classificationSchema } from '../validators/ai.schema.js';
import { CATEGORIES } from '../constants.js';

export async function classifyComplaint(ticket) {
  const prompt = `You are a support triage assistant for an e-commerce company.
Classify the complaint. Allowed categories: ${CATEGORIES.join(', ')}.
Return JSON with keys: category, priority (low|medium|high), summary (one neutral sentence).

Customer-stated category: ${ticket.category}
Order ID: ${ticket.orderId}
Description: """${ticket.description}"""`;
  return classificationSchema.parse(await generateJSON({ prompt }));
}
