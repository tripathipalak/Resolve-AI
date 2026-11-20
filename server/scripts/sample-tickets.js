const BASE = 'http://localhost:5000/api';

const samples = [
  { category: 'damaged_product', description: 'Laptop arrived with a scratched screen and a cracked corner. Order placed 3 days ago.' },
  { category: 'wrong_item', description: 'I ordered a black backpack but received a blue wallet instead.' },
  { category: 'missing_item', description: 'The box had only one of the two headphones I ordered.' },
  { category: 'refund_not_received', description: 'I returned my shoes two weeks ago and still have not received my refund.' },
  { category: 'other', description: 'I want a refund for a product bought last year, and the box was already opened.' },
  { category: 'other', description: 'It is bad, I am not happy at all.' }
];

for (const [i, s] of samples.entries()) {
  const form = new FormData();
  form.append('name', `Sample Customer ${i + 1}`);
  form.append('email', `sample${i + 1}@example.com`);
  form.append('orderId', `ORD-${10000 + i}`);
  form.append('category', s.category);
  form.append('description', s.description);

  const res = await fetch(`${BASE}/tickets`, { method: 'POST', body: form });
  const data = await res.json();
  console.log(res.ok ? `Created ${data.ticketNumber}` : `Failed: ${data.message}`);
}