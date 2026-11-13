import { createSession, sessionCookie, json, isSameOrigin } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: 'Admin secrets are not configured yet. Follow the setup guide in ADMIN_SETUP.md.' }, 503);
  }
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (email !== env.ADMIN_EMAIL.trim().toLowerCase() || password.length < 1 || password !== env.ADMIN_PASSWORD) {
    return json({ error: 'Email or password is incorrect.' }, 401);
  }
  const token = await createSession(email, env.SESSION_SECRET);
  return json({ ok: true, email }, 200, { 'Set-Cookie': sessionCookie(token) });
}
