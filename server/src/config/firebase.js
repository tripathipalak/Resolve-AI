import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(readFileSync(path, 'utf8')))
  });
}

export const adminAuth = getAuth();