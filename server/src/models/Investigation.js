import mongoose from 'mongoose';

// AI output is stored separately from human decisions (audit trail).
const investigationSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', index: true },
  status: { type: String, enum: ['running', 'completed', 'failed'] },
  model: String,
  promptVersion: String,
  classification: mongoose.Schema.Types.Mixed,
  evidenceAnalysis: mongoose.Schema.Types.Mixed,
  passages: mongoose.Schema.Types.Mixed,
  recommendation: mongoose.Schema.Types.Mixed,
  error: String,
    confidence: String
}, { timestamps: true });

export default mongoose.model('Investigation', investigationSchema);
