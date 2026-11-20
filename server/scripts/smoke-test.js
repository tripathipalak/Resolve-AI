const BASE = 'http://localhost:5000/api';
// A tiny 1x1 PNG, used as the evidence photo.
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const cases = [
  {
    name: 'photo-damage',
    category: 'damaged_product',
    description: 'Laptop arrived with a scratched screen and a cracked corner.',
    withImage: true,
    expect: 'review_replacement or request_more_evidence, citing section 1.2'
  },
  {
    name: 'out-of-policy',
    category: 'refund_not_received',
    description: 'I want a refund for a product I bought last year, and the box was already opened.',
    withImage: false,
    expect: 'no_policy_applies or escalate_to_human, no invented citations'
  },
  {
    name: 'vague',
    category: 'other',
    description: 'The order is bad and I am not happy with it at all.',
    withImage: false,
    expect: 'request_more_evidence or escalate_to_human'
  }
];

const login = await fetch(`${BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'agent@resolveai.com', password: 'Agent@12345' })
}).then(r => r.json());
const headers = { Authorization: `Bearer ${login.token}` };

for (const c of cases) {
  console.log(`\n=== ${c.name} ===`);
  console.log(`expected: ${c.expect}`);
  try {
    const form = new FormData();
    form.append('name', 'Test Customer');
    form.append('email', `${c.name}@example.com`);
    form.append('orderId', `ORD-${Math.floor(Math.random() * 100000)}`);
    form.append('category', c.category);
    form.append('description', c.description);
    if (c.withImage) {
      form.append('evidence', new Blob([Buffer.from(PNG_B64, 'base64')], { type: 'image/png' }), 'damage.png');
    }

    const created = await fetch(`${BASE}/tickets`, { method: 'POST', body: form }).then(r => r.json());
    const tickets = await fetch(`${BASE}/tickets`, { headers }).then(r => r.json());
    const ticket = tickets.find(t => t.ticketNumber === created.ticketNumber);

    const res = await fetch(`${BASE}/tickets/${ticket._id}/investigate`, { method: 'POST', headers })
      .then(r => r.json());
    if (!res.investigation) {
      console.log('ERROR:', res.message);
      continue;
    }

    const rec = res.investigation.recommendation;
    const rejected = rec.missingInformation.some(m => m.includes('rejected'));
    console.log(`action: ${rec.action}`);
    console.log(`citations: ${rec.policyCitations.length ? rec.policyCitations.map(x => `${x.section} "${x.quote}"`).join(' | ') : 'none'}`);
    console.log(`citations rejected by grounding check: ${rejected ? 'YES' : 'no'}`);
    console.log(`draft: ${rec.draftResponse.slice(0, 150)}`);
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}