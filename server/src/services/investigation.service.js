import Ticket from '../models/Ticket.js';
import Investigation from '../models/Investigation.js';
import { classifyComplaint } from './classification.service.js';
import { analyzeEvidence } from './evidence.service.js';
import { retrieveRelevantChunks } from './retrieval.service.js';
import { generateJSON } from './gemini.service.js';
import { recommendationSchema } from '../validators/ai.schema.js';
import { httpError } from '../utils/httpError.js';

const PROMPT_VERSION = 'v1.3';
const STALE_MS = 3 * 60 * 1000;
const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim();

// Full pipeline: classify -> analyze evidence -> retrieve policy -> recommend -> validate -> save.
export async function runInvestigation(ticketId) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw httpError(404, 'Ticket not found');

  const existing = await Investigation.findOne({ ticketId, status: { $in: ['running', 'completed'] } })
    .sort({ createdAt: -1 });

  // True when the customer added information after the last investigation started.
  const hasNewInfo = Boolean(
    existing && ticket.lastCustomerUpdateAt &&
    new Date(ticket.lastCustomerUpdateAt) > new Date(existing.createdAt)
  );

  if (existing?.status === 'running') {
    if (Date.now() - new Date(existing.createdAt).getTime() < STALE_MS) {
      return { investigation: existing, reused: true };
    }
    // Abandoned run (server stopped mid-way): mark it failed and start again.
    existing.status = 'failed';
    existing.error = 'Abandoned run (server stopped before completion)';
    await existing.save();
  }

  // Reuse a finished result, unless the customer has added new information since.
  if (existing?.status === 'completed' && !hasNewInfo) {
    return { investigation: existing, reused: true };
  }

  const inv = await Investigation.create({
    ticketId, status: 'running', promptVersion: PROMPT_VERSION, model: process.env.GEMINI_MODEL
  });
  ticket.status = 'under_investigation';
  ticket.timeline.push({ status: 'under_investigation', note: 'AI investigation started' });
  await ticket.save();

  try {
    const classification = await classifyComplaint(ticket);
    const evidence = await analyzeEvidence(ticket);
    const passages = (await retrieveRelevantChunks(
      `${classification.category}. ${ticket.description}`, 5
    )).map((p, i) => ({ ...p, passageId: `P${i + 1}` }));

    // No relevant policy: decide deterministically, without asking the model to guess.
    const recommendation = passages.length === 0
      ? noPolicyResult()
      : validateRecommendation(
          await recommend({ ticket, classification, evidence, passages }),
          passages
        );

    Object.assign(inv, {
      status: 'completed',
      classification,
      evidenceAnalysis: evidence.findings,
      passages: passages.map(({ passageId, policyTitle, section, text, score }) =>
        ({ passageId, policyTitle, section, text, score })),
      recommendation
    });
    await inv.save();

    ticket.priority = classification.priority;
    ticket.status = 'awaiting_agent';
    ticket.set('response.generated', recommendation.draftResponse);
    ticket.timeline.push({ status: 'awaiting_agent', note: `AI recommendation: ${recommendation.action}` });
    await ticket.save();

    return { investigation: inv, reused: false };
  } catch (err) {
    inv.status = 'failed';
    inv.error = err.message;
    await inv.save();
    ticket.status = 'awaiting_agent';
    ticket.timeline.push({ status: 'awaiting_agent', note: 'AI investigation failed; manual review needed' });
    await ticket.save();
    throw err;
  }
}

function noPolicyResult() {
  return {
    action: 'escalate_to_human',
    reasoning: 'No policy passage was relevant enough to this complaint, so a human agent must decide how to handle it.',
    policyCitations: [],
    assumptions: [],
    missingInformation: ['Applicable company policy could not be identified'],
    draftResponse: 'Hello, thank you for contacting us. We have received your complaint, and a support agent will review it and get back to you shortly.',
    requiresHumanApproval: true,
    confidence: 'low'
  };
}

async function recommend({ ticket, classification, evidence, passages }) {
  const policy = passages.map(p => `[${p.passageId}] ${p.policyTitle}, section ${p.section}:\n${p.text}`).join('\n\n');
  const updates = (ticket.customerUpdates || [])
    .map((u, i) => `${i + 1}. ${u.message}`)
    .join('\n');

  const prompt = `You are an investigation assistant for a customer support agent at an online store.
You do NOT approve refunds, reject complaints, or promise any outcome. A human agent makes every final decision.

ACTIONS
- review_replacement: the replacement conditions in the policy appear to be met, and the agent should check them.
- review_refund: the refund conditions in the policy appear to be met, and the agent should check them.
- request_more_evidence: a specific item the policy needs is missing or unclear.
- escalate_to_human: the case is unclear, the claim and the evidence conflict, or the case needs a judgment a person must make.
- no_policy_applies: the complaint is clearly outside every retrieved policy section.
If the customer's claim and the evidence do not match, choose escalate_to_human or request_more_evidence. Never choose review_replacement in that case.

RULES
1. Use only the policy passages provided. Never invent a policy condition, time limit, or amount.
2. Match the policy to the complaint category. Wrong-item and missing-item cases use the wrong-item and missing-item sections. Damaged-product cases use the replacement sections. Never apply a damage rule to a wrong-item case.
3. Each policy citation needs a passageId from the list and a quote of at most 15 words copied exactly from that passage. Cite only passages that actually support the point you make.
4. Check every condition a relevant policy states, such as a time limit, a photo, an order ID, or a delivery date. For each one, decide whether it is confirmed by evidence, confirmed by the customer, or missing.
5. Evidence findings describe what the files show. If a file shows something different from the customer's description, say so plainly in "reasoning" and in "assumptions", and do not treat the customer's claim as confirmed.
6. Customer updates are the customer's own statements and are not verified. Use them to fill missing information, and list them in "assumptions" unless the evidence or a policy confirms them.
7. Do not list an item as missing if the evidence or a customer update already provides it. Do list an item as missing if a policy requires it and nothing provides it.
8. If a condition cannot be checked, for example because the delivery date is not given anywhere, say so in "missingInformation" and do not assume it is met.
9. Never state a fact that is not in the complaint, the evidence findings, the customer updates, or the policy passages.
10. Each "missingInformation" item is a short phrase describing what is needed, such as "Delivery date" or "Photo of the item received, with the order ID visible".

DRAFT REPLY (draftResponse)
- Use plain, polite language. Use the customer's name only if it is given.
- Mention the order ID.
- Ask the customer for every item in "missingInformation" that they can provide themselves. Ask for each one in a single clear sentence, and make no more than three requests.
- If a photo does not match the description, say so calmly, without blaming the customer.
- Do not promise a refund, replacement, or pickup unless a policy passage states that it applies to this case. If it applies, describe it as the next step under the policy, not as a guarantee.
- End by saying that a support agent will review the case.
- Do not mention AI, confidence levels, citations, or internal reasoning.

OUTPUT
- "section" must be only the number, such as "1.2", with no word "section".
- "reasoning" is two to four sentences, written for the agent.
- "assumptions" lists only things the system is taking as true without verification.
- Return only JSON with the keys: action, reasoning, policyCitations (array of {passageId, section, quote}), assumptions (array), missingInformation (array), draftResponse.

COMPLAINT
Category (customer-stated): ${ticket.category}
Order ID: ${ticket.orderId}
Description: """${ticket.description}"""

CUSTOMER UPDATES (added after the first submission, unverified):
${updates || 'None'}

CLASSIFICATION: ${JSON.stringify(classification)}
EVIDENCE FINDINGS: ${JSON.stringify(evidence.findings)}

POLICY PASSAGES
${policy}`;

  return recommendationSchema.parse(await generateJSON({ prompt }));
}

// Grounding check: a citation survives only if its passage exists and the quote really appears in it.
// Confidence comes from these checks, not from the model's own rating, which is not calibrated.
function validateRecommendation(rec, passages) {
  const byId = new Map(passages.map(p => [p.passageId, p]));
  const citations = rec.policyCitations.filter(c => {
    const p = byId.get(c.passageId);
    return p && norm(p.text).includes(norm(c.quote));
  });
  const rejected = rec.policyCitations.length - citations.length;

  let action = rec.action;
  let reasoning = rec.reasoning;
  const missing = [...rec.missingInformation];
  if (rejected > 0) missing.push(`${rejected} policy citation(s) rejected: quote not found in the cited passage`);

  const safeWithoutCitations = ['escalate_to_human', 'request_more_evidence'].includes(action);
  if (!safeWithoutCitations && citations.length === 0) {
    action = 'escalate_to_human';
    reasoning = 'No verifiable policy citation was found, so this case needs human review. ' + rec.reasoning;
  }

  // Never 'high': a system check cannot prove the AI's interpretation is correct.
  const confidence = citations.length === 0 || rejected > 0 ? 'low' : 'medium';

  return {
    ...rec, action, reasoning, policyCitations: citations,
    missingInformation: missing, requiresHumanApproval: true, confidence
  };
}