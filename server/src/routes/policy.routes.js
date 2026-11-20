import { Router } from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Policy from '../models/Policy.js';
import { ingestPolicyText } from '../services/policy.service.js';
import { httpError } from '../utils/httpError.js';

// pdf-parse is CommonJS, so load it with createRequire.
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth);

// Agents and admins: list policies with passage counts (embeddings are not sent).
router.get('/', requireRole('agent', 'admin'), async (_req, res) => {
  const list = await Policy.aggregate([
    {
      $project: {
        title: 1, category: 1, source: 1, version: 1, isActive: 1, createdAt: 1,
        chunkCount: { $size: '$chunks' }
      }
    },
    { $sort: { createdAt: -1 } }
  ]);
  res.json(list);
});

// Admin: upload a policy (PDF, TXT or MD file, or plain text).
router.post('/', requireRole('admin'), upload.single('file'), async (req, res) => {
  const { title, category } = req.body;
  let text = req.body.text;
  if (req.file) {
    text = req.file.mimetype === 'application/pdf'
      ? (await pdfParse(req.file.buffer)).text
      : req.file.buffer.toString('utf8');
  }
  if (!title || !category || !text) throw httpError(400, 'title, category and text or file are required');

  const policy = await ingestPolicyText({
    title, category, source: req.file?.originalname || 'manual', text
  });
  res.status(201).json({ id: policy._id, chunks: policy.chunks.length });
});

// Admin: switch a policy on or off. Inactive policies are not used for retrieval.
router.patch('/:id', requireRole('admin'), async (req, res) => {
  const parsed = z.object({ isActive: z.boolean() }).safeParse(req.body);
  if (!parsed.success) throw httpError(400, 'isActive must be true or false');

  const policy = await Policy.findByIdAndUpdate(req.params.id, { isActive: parsed.data.isActive }, { new: true });
  if (!policy) throw httpError(404, 'Policy not found');
  res.json({ _id: policy._id, isActive: policy.isActive });
});

// Admin: delete a policy. Past investigations keep their own copies of the passages they used.
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const policy = await Policy.findByIdAndDelete(req.params.id);
  if (!policy) throw httpError(404, 'Policy not found');
  res.json({ ok: true });
});

export default router;