import mongoose from 'mongoose';

// Passwords live in Firebase. MongoDB stores only the profile and role.
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String, enum: ['agent', 'admin'], default: 'agent' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);