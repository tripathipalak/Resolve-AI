import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// The frontend calls this after Firebase sign-in to get the agent's role.
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;