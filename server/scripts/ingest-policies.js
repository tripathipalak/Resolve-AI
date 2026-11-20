import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Policy from '../src/models/Policy.js';
import { ingestPolicyText } from '../src/services/policy.service.js';

await mongoose.connect(process.env.MONGO_URI);
const dir = path.resolve('policies');
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.txt') || f.endsWith('.md'))) {
  const title = path.basename(file, path.extname(file)).replace(/[-_]/g, ' ');
  if (await Policy.findOne({ source: file })) { console.log(`Skipped (exists): ${file}`); continue; }
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  const policy = await ingestPolicyText({ title, category: 'general', source: file, text });
  console.log(`Ingested ${file}: ${policy.chunks.length} chunks`);
}
await mongoose.disconnect();
