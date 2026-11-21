import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

function loadServiceAccount() {
  // Render / production: poora JSON env variable mein
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  // Local fallback: file se
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
  return JSON.parse(readFileSync(path, 'utf8'));
}

if (!getApps().length) {
  initializeApp({
    credential: cert(loadServiceAccount())
  });
}

export const adminAuth = getAuth();