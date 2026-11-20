import 'dotenv/config';
import 'express-async-errors'; // lets async route errors reach the error handler
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import policyRoutes from './routes/policy.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/admin', adminRoutes);

// Central error handler: keeps error responses consistent.
app.use((err, _req, res, _next) => {
  if (res.headersSent) return;
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const port = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI)
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch(err => { console.error(err); process.exit(1); });
