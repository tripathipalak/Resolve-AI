import mongoose from 'mongoose';

const policySchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: String,
  source: String,
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  chunks: [{
    text: String,
    section: String,
    embedding: [Number]
  }]
}, { timestamps: true });

export default mongoose.model('Policy', policySchema);
