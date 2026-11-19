import mongoose from 'mongoose';
import { CATEGORIES, STATUSES } from '../constants.js';

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true, index: true },
  customer: {
    name: String,
    email: { type: String, lowercase: true, trim: true }
  },
  orderId: String,
  category: { type: String, enum: CATEGORIES },
  description: String,
  status: { type: String, enum: STATUSES, default: 'submitted' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  // MVP: evidence is stored in Mongo (max 5MB per file). Move to Cloudinary/S3 later.
    evidence: [{
    fileName: String,
    mimeType: String,
    size: Number,
    data: Buffer,
    source: { type: String, enum: ['submission', 'customer_followup'], default: 'submission' },
    uploadedAt: Date
  }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  response: {
    generated: String,
    final: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    wasEdited: Boolean,
    // The reply asked the customer for something. The ticket waits for them, not for resolution.
    needsCustomerInfo: { type: Boolean, default: false }
  },
  // Information the customer adds after submitting, such as the delivery date.
  customerUpdates: [{ message: String, at: { type: Date, default: Date.now } }],
  lastCustomerUpdateAt: Date,
  timeline: [{
    status: String,
    note: String,
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);