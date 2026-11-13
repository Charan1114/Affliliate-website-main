import { json, requireAdmin, isSameOrigin } from '../_lib/auth.js';

function mapArticle(row, products = []) {
  return {
    id: row.id, slug: row.slug, title: row.title, category: row.category, tag: row.tag,
    read: row.read_time, image: row.image_url, excerpt: row.excerpt, intro: row.intro,
    sections: JSON.parse(row.sections_json || '[]'), status: row.status,
    products: products.map(p => ({ id: p.id, name: p.name, price: p.price, image: p.image_url, affiliateUrl: p.affiliate_url, description: p.description }))
  };
}

async function productsFor(db, articleId) {
  const result = await db.prepare('SELECT * FROM products WHERE article_id = ? ORDER BY position, id').bind(articleId).all();
  return result.results || [];
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'Database is not connected.' }, 503);
  const isAdmin = !!(await requireAdmin(request, env));
  const sql = isAdmin
    ? 'SELECT * FROM articles ORDER BY updated_at DESC'
    : "SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC";
  const result = await env.DB.prepare(sql).all();
  const articles = [];
  for (const row of result.results || []) articles.push(mapArticle(row, await productsFor(env.DB, row.id)));
  return json({ articles });
}

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!(await requireAdmin(request, env))) return json({ error: 'Sign in required.' }, 401);
  if (!env.DB) return json({ error: 'Database is not connected.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid article data.' }, 400); }
  const title = String(body.title || '').trim();
  const slug = String(body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  const category = String(body.category || '').trim();
  const excerpt = String(body.excerpt || '').trim();
  if (!title || !slug || !category || !excerpt) return json({ error: 'Title, slug, category and excerpt are required.' }, 400);
  const status = body.status === 'published' ? 'published' : 'draft';
  const now = new Date().toISOString();
  try {
    const inserted = await env.DB.prepare(`INSERT INTO articles (slug,title,category,tag,read_time,image_url,excerpt,intro,sections_json,status,updated_at,published_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`)
      .bind(slug,title,category,String(body.tag || 'BUYING GUIDE'),String(body.read || '5 min read'),String(body.image || ''),excerpt,String(body.intro || ''),JSON.stringify(Array.isArray(body.sections) ? body.sections : []),status,now,status === 'published' ? now : null).first();
    const articleId = inserted.id;
    const products = Array.isArray(body.products) ? body.products : [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.name || !p.affiliateUrl) continue;
      await env.DB.prepare('INSERT INTO products (article_id,name,price,image_url,affiliate_url,description,position) VALUES (?,?,?,?,?,?,?)')
        .bind(articleId,String(p.name),String(p.price || ''),String(p.image || ''),String(p.affiliateUrl),String(p.description || ''),i).run();
    }
    return json({ ok: true, id: articleId, slug }, 201);
  } catch (error) {
    return json({ error: error.message.includes('UNIQUE') ? 'That article slug already exists.' : 'Could not save article.' }, 400);
  }
}
