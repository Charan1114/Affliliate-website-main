import { json, isSameOrigin } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!env.DB) return json({ ok: true, tracking: false });
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid event.' }, 400); }
  const type = body.type === 'affiliate_click' ? 'affiliate_click' : body.type === 'page_view' ? 'page_view' : null;
  if (!type) return json({ error: 'Unsupported event.' }, 400);
  const path = String(body.path || '/').slice(0, 500);
  const slug = body.slug ? String(body.slug).slice(0, 160) : null;
  const product = body.product ? String(body.product).slice(0, 200) : null;
  const referrer = request.headers.get('Referer') ? new URL(request.headers.get('Referer')).hostname.slice(0,160) : null;
  const ua = request.headers.get('User-Agent') || '';
  const device = /mobile|android|iphone/i.test(ua) ? 'mobile' : /ipad|tablet/i.test(ua) ? 'tablet' : 'desktop';
  const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO analytics_events (event_type,page_path,article_slug,product_name,referrer_host,device_type,created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(type,path,slug,product,referrer,device,now).run();
  return json({ ok:true });
}
