const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

export async function createSession(email, secret) {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ email, exp: Date.now() + 8 * 60 * 60 * 1000 })));
  const signature = toBase64Url(await sign(payload, secret));
  return payload + '.' + signature;
}

export async function verifySession(request, secret) {
  const cookie = request.headers.get('Cookie') || '';
  const token = cookie.split(';').map(part => part.trim()).find(part => part.startsWith('tge_session='));
  if (!token) return null;
  const value = token.slice('tge_session='.length);
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = toBase64Url(await sign(payload, secret));
  if (signature.length !== expected.length) return null;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  if (mismatch !== 0) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export async function requireAdmin(request, env) {
  if (!env.SESSION_SECRET) return null;
  return verifySession(request, env.SESSION_SECRET);
}

export function sessionCookie(token) {
  return 'tge_session=' + token + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800';
}

export function clearSessionCookie() {
  return 'tge_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

export function isSameOrigin(request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}
