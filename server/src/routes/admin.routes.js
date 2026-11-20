import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Investigation from '../models/Investigation.js';
import Policy from '../models/Policy.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { httpError } from '../utils/httpError.js';

const router = Router();

// Every route in this file requires a signed-in admin.
router.use(requireAuth, requireRole('admin'));

const countBy = arr => Object.fromEntries(arr.map(x => [x._id, x.count]));

router.get('/stats', async (_req, res) => {
  const [tickets, investigations, agents, policies] = await Promise.all([
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Investigation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments(),
    Policy.countDocuments({ isActive: true })
  ]);
  const byStatus = countBy(tickets);
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  res.json({
    total,
    byStatus,
    investigations: countBy(investigations),
    agents,
    activePolicies: policies
  });
});

const inviteSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['agent', 'admin'])
});

router.get('/users', async (_req, res) => {
  const users = await User.find().select('name email role firebaseUid createdAt').sort({ createdAt: -1 }).lean();
  res.json(users.map(u => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    linked: Boolean(u.firebaseUid),
    createdAt: u.createdAt
  })));
});

// Invite: creates the profile. The person activates it by signing in with the same email.
router.post('/users', async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) throw httpError(400, 'Enter a valid name, email and role');

  const email = parsed.data.email.toLowerCase();
  if (await User.findOne({ email })) throw httpError(409, 'This email has already been invited');

  const user = await User.create({ name: parsed.data.name, email, role: parsed.data.role });
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, linked: false });
});

router.patch('/users/:id', async (req, res) => {
  const parsed = z.object({ role: z.enum(['agent', 'admin']) }).safeParse(req.body);
  if (!parsed.success) throw httpError(400, 'Invalid role');

  if (req.params.id === req.user.id && parsed.data.role !== 'admin') {
    throw httpError(400, 'You cannot remove your own admin access');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role: parsed.data.role }, { new: true });
  if (!user) throw httpError(404, 'User not found');
  res.json({ _id: user._id, role: user.role });
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) throw httpError(400, 'You cannot remove your own account');

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  res.json({ ok: true });
});

export default router;