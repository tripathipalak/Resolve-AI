import { adminAuth } from '../config/firebase.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  let user = await User.findOne({ firebaseUid: decoded.uid });

  // First Google sign-in for an invited agent: link this Google account to the invite once.
  if (!user && decoded.email && decoded.email_verified) {
    user = await User.findOneAndUpdate(
      { email: decoded.email.toLowerCase(), firebaseUid: { $exists: false } },
      { firebaseUid: decoded.uid },
      { new: true }
    );
  }

  if (!user) return res.status(403).json({ message: 'This Google account is not registered as an agent' });

  req.user = { id: user._id.toString(), name: user.name, role: user.role, email: user.email };
  next();
}

export function requireRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.user?.role) ? next() : res.status(403).json({ message: 'Forbidden' });
}