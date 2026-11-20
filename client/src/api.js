import { auth as firebaseAuth } from './firebase';

const BASE = '/api';

// Gets a fresh Firebase ID token for each protected request.
async function authHeader() {
  const user = firebaseAuth.currentUser;
  if (!user) return {};
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

export async function api(path, { method = 'GET', body, form, auth = false } = {}) {
  const headers = auth ? await authHeader() : {};

  let payload;
  if (form) payload = form;
  else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(BASE + path, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && auth) window.location.href = '/agent/login';
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.data = data;
    throw err;
  }
  return data;
}

// <img> tags can't send the auth header, so evidence is fetched as a blob.
export async function fetchAuthBlobUrl(path) {
  const res = await fetch(BASE + path, { headers: await authHeader() });
  if (!res.ok) throw new Error('Could not load file');
  return URL.createObjectURL(await res.blob());
}