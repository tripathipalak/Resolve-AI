import 'dotenv/config';
import mongoose from 'mongoose';
import { adminAuth } from '../src/config/firebase.js';
import User from '../src/models/User.js';

// Usage:
//   node scripts/create-agent.js <email> "<name>" [agent|admin] [password]
// With a password, the agent can sign in with email and password.
// Without one, the agent signs in with Google only.
const [, , email, name = 'Support Agent', role = 'agent', password] = process.argv;

if (!email) {
  console.error('Usage: node scripts/create-agent.js <email> "<name>" [agent|admin] [password]');
  process.exit(1);
}
if (password && password.length < 6) {
  console.error('Password must be at least 6 characters.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

let firebaseUid;
if (password) {
  try {
    const existing = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(existing.uid, { password, displayName: name });
    firebaseUid = existing.uid;
    console.log('Firebase account existed. Password updated.');
  } catch {
    const created = await adminAuth.createUser({ email, password, displayName: name, emailVerified: true });
    firebaseUid = created.uid;
    console.log('Firebase account created.');
  }
}

const update = { name, role };
if (firebaseUid) update.firebaseUid = firebaseUid;

const user = await User.findOneAndUpdate(
  { email: email.toLowerCase() },
  update,
  { upsert: true, new: true }
);

console.log(`Ready: ${user.email} (${user.role})${password ? ' with email and password' : ' (Google only)'}`);
await mongoose.disconnect();
process.exit(0);