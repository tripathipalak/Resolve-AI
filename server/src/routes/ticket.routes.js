import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import Ticket from '../models/Ticket.js';
import Investigation from '../models/Investigation.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { newTicketNumber } from '../utils/ticketNumber.js';
import { verifyEvidence } from '../utils/fileSignature.js';
import { runInvestigation } from '../services/investigation.service.js';
import { sendReplyEmail } from '../services/email.service.js';
import { STATUSES, CATEGORIES } from '../constants.js';
import { httpError } from '../utils/httpError.js';

const router = Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_UPDATES = 5;
const MAX_EVIDENCE = 5; // total files per ticket, including the original submission

// Limits per IP address.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many complaints submitted. Please try again later.' }
});

const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' }
});

const updateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many updates. Please try again later.' }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) =>
    ALLOWED_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(httpError(400, `Unsupported file type: ${file.mimetype}`))
});

const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  orderId: z.string().min(3).max(40),
  category: z.enum(CATEGORIES),
  description: z.string().min(20).max(2000)
});

const updateSchema = z.object({
  ticketNumber: z.string().min(5).max(40),
  email: z.string().email(),
  message: z.string().min(5).max(1000)
});

// Customer: submit a complaint with optional evidence.
router.post('/', submitLimiter, upload.array('evidence', 3), verifyEvidence, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;

  const ticket = await Ticket.create({
    ticketNumber: newTicketNumber(),
    customer: { name: d.name, email: d.email },
    orderId: d.orderId,
    category: d.category,
    description: d.description,
    evidence: (req.files || []).map(f => ({
      fileName: f.originalname, mimeType: f.mimetype, size: f.size, data: f.buffer
    })),
    timeline: [{ status: 'submitted', note: 'Complaint received' }]
  });

  res.status(201).json({ ticketNumber: ticket.ticketNumber, status: ticket.status });
});

// Customer: track a ticket. Requires the ticket number AND the matching email.
router.get('/track', trackLimiter, async (req, res) => {
  const ticketNumber = String(req.query.ticketNumber || '').trim().toUpperCase();
  const email = String(req.query.email || '').trim().toLowerCase();

  const ticket = await Ticket.findOne({ ticketNumber }).select('-evidence.data');
  if (!ticket || ticket.customer.email !== email) throw httpError(404, 'Ticket not found');

  res.json({
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    category: ticket.category,
    timeline: ticket.timeline.map(t => ({ status: t.status, note: t.note, at: t.at })),
    updates: (ticket.customerUpdates || []).map(u => ({ message: u.message, at: u.at })),
    finalResponse: ticket.response?.approvedAt ? ticket.response.final : null,
    updatedAt: ticket.updatedAt
  });
});

// Customer: add more information, and optionally new photos. Allowed while the ticket is open.
router.post('/track/followup', updateLimiter, upload.array('evidence', 3), verifyEvidence, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) throw httpError(400, 'Enter the ticket number, email and a message of 5-1000 characters');

  const ticketNumber = parsed.data.ticketNumber.trim().toUpperCase();
  const email = parsed.data.email.trim().toLowerCase();

  const ticket = await Ticket.findOne({ ticketNumber });
  if (!ticket || ticket.customer.email !== email) throw httpError(404, 'Ticket not found');
  if (ticket.status === 'resolved') throw httpError(400, 'This ticket is already resolved');
  if ((ticket.customerUpdates || []).length >= MAX_UPDATES) {
    throw httpError(400, 'Update limit reached for this ticket. Please contact support.');
  }

  const files = req.files || [];
  if (ticket.evidence.length + files.length > MAX_EVIDENCE) {
    throw httpError(400, `This ticket can have at most ${MAX_EVIDENCE} files in total`);
  }

  const now = new Date();
  for (const f of files) {
    ticket.evidence.push({
      fileName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      data: f.buffer,
      source: 'customer_followup',
      uploadedAt: now
    });
  }

  ticket.customerUpdates.push({ message: parsed.data.message.trim(), at: now });
  ticket.lastCustomerUpdateAt = now;
  ticket.status = 'awaiting_agent';
  ticket.timeline.push({
    status: 'awaiting_agent',
    note: files.length
      ? `Customer added information and ${files.length} file(s)`
      : 'Customer added information'
  });
  await ticket.save();

  res.status(201).json({ ok: true, status: ticket.status });
});

// Agent: list tickets, optionally filtered by status.
router.get('/', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
  const filter = {};
  if (req.query.status) {
    if (!STATUSES.includes(req.query.status)) throw httpError(400, 'Invalid status');
    filter.status = req.query.status;
  }
  const tickets = await Ticket.find(filter)
    .select('-evidence.data -timeline')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json(tickets);
});

// Agent: ticket detail with the latest investigation.
router.get('/:id', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).select('-evidence.data').lean();
  if (!ticket) throw httpError(404, 'Ticket not found');
  const investigation = await Investigation.findOne({ ticketId: ticket._id })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ ticket, investigation });
});

// Agent: view an evidence file for review.
router.get('/:id/evidence/:index', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  const index = Number(req.params.index);
  if (!ticket || !Number.isInteger(index) || index < 0 || index >= ticket.evidence.length) {
    throw httpError(404, 'Evidence not found');
  }
  const file = ticket.evidence[index];
  res.type(file.mimeType).send(file.data);
});

// Agent: change status manually.
router.patch('/:id/status', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
  const parsed = z.object({ status: z.enum(STATUSES) }).safeParse(req.body);
  if (!parsed.success) throw httpError(400, 'Invalid status');

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw httpError(404, 'Ticket not found');

  ticket.status = parsed.data.status;
  ticket.timeline.push({ status: parsed.data.status, note: `Status set by ${req.user.name}` });
  await ticket.save();
  res.json({ ticketNumber: ticket.ticketNumber, status: ticket.status });
});

// Agent: run the AI investigation. Re-runs automatically when the customer has added new information.
router.post('/:id/investigate', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
  const result = await runInvestigation(req.params.id);
  res.json(result);
});

// Agent: approve the response.
// mode "wait": the reply asks the customer for something, so the ticket waits for them (awaiting_customer).
// mode "resolve": the case is closed (resolved).
router.patch('/:id/response', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
  const parsed = z.object({
    final: z.string().min(20).max(4000),
    mode: z.enum(['wait', 'resolve']).default('resolve')
  }).safeParse(req.body);
  if (!parsed.success) throw httpError(400, 'Final response must be 20-4000 characters');

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw httpError(404, 'Ticket not found');

  const finalText = parsed.data.final.trim();
  const generated = (ticket.response?.generated || '').trim();
  const waiting = parsed.data.mode === 'wait';

  ticket.set('response.final', finalText);
  ticket.set('response.approvedBy', req.user.id);
  ticket.set('response.approvedAt', new Date());
  ticket.set('response.wasEdited', finalText !== generated);
  ticket.set('response.needsCustomerInfo', waiting);
  ticket.status = waiting ? 'awaiting_customer' : 'resolved';
  await ticket.save();

  // An email failure must not undo the approval. The result is recorded in the timeline instead.
  let emailNote = waiting
    ? `Reply sent by ${req.user.name}. Waiting for customer information.`
    : `Response approved by ${req.user.name}. Emailed to customer.`;
  try {
    await sendReplyEmail(ticket);
  } catch (err) {
    console.error('Reply email failed:', err.message);
    emailNote += ` Email not sent (${err.message}).`;
  }

  ticket.timeline.push({ status: ticket.status, note: emailNote });
  await ticket.save();

  res.json({ ticketNumber: ticket.ticketNumber, status: ticket.status });
});

export default router;