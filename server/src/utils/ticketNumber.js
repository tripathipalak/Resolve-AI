import crypto from 'crypto';

// Random 12-character suffix, so ticket numbers can't be guessed by counting up.
// Example: RES-2026-3F9A1C07B2E4
export function newTicketNumber() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `RES-${year}-${suffix}`;
}