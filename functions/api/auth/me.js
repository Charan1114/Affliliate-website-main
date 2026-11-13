import { requireAdmin, json } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const session = await requireAdmin(request, env);
  return session ? json({ authenticated: true, email: session.email }) : json({ authenticated: false }, 401);
}
