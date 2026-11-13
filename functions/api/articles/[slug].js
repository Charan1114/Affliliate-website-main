import { json, requireAdmin, isSameOrigin } from '../../_lib/auth.js';

export async function onRequestGet({ params, env }) {
  if (!env.DB) return json({ error: 'Database is not connected.' }, 503);
  const row = await env.DB.prepare("SELECT * FROM articles WHERE slug = ? AND status = 'published'").bind(params.slug).first();
  if (!row) return json({ error: 'Article not found.' }, 404);
  const result = await env.DB.prepare('SELECT * FROM products WHERE article_id = ? ORDER BY position,id').bind(row.id).all();
  return json({ article: { ...row, sections: JSON.parse(row.sections_json || '[]'), products: (result.results || []).map(p => ({ id:p.id,name:p.name,price:p.price,image:p.image_url,affiliateUrl:p.affiliate_url,description:p.description })) } });
}

export async function onRequestPut({ request, params, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!(await requireAdmin(request, env))) return json({ error: 'Sign in required.' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid article data.' }, 400); }
  const existing = await env.DB.prepare('SELECT id FROM articles WHERE slug = ?').bind(params.slug).first();
  if (!existing) return json({ error: 'Article not found.' }, 404);
  const status = body.status === 'published' ? 'published' : 'draft';
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE articles SET title=?,category=?,tag=?,read_time=?,image_url=?,excerpt=?,intro=?,sections_json=?,status=?,updated_at=?,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END WHERE id=?`)
    .bind(String(body.title||''),String(body.category||''),String(body.tag||'BUYING GUIDE'),String(body.read||'5 min read'),String(body.image||''),String(body.excerpt||''),String(body.intro||''),JSON.stringify(Array.isArray(body.sections)?body.sections:[]),status,now,status,now,existing.id).run();
  await env.DB.prepare('DELETE FROM products WHERE article_id=?').bind(existing.id).run();
  const products = Array.isArray(body.products) ? body.products : [];
  for (let i=0;i<products.length;i++) {
    const p=products[i]; if (!p.name || !p.affiliateUrl) continue;
    await env.DB.prepare('INSERT INTO products (article_id,name,price,image_url,affiliate_url,description,position) VALUES (?,?,?,?,?,?,?)')
      .bind(existing.id,String(p.name),String(p.price||''),String(p.image||''),String(p.affiliateUrl),String(p.description||''),i).run();
  }
  return json({ ok:true });
}

export async function onRequestDelete({ request, params, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!(await requireAdmin(request, env))) return json({ error: 'Sign in required.' }, 401);
  await env.DB.prepare('DELETE FROM articles WHERE slug=?').bind(params.slug).run();
  return json({ ok:true });
}
