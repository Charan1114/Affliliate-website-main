import { json, requireAdmin } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(request, env))) return json({ error:'Sign in required.' },401);
  if (!env.DB) return json({ error:'Database is not connected.' },503);
  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days') || 30)));
  const since = new Date(Date.now() - days*86400000).toISOString();
  const [views, clicks, articles, products, daily, devices, sources] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS total FROM analytics_events WHERE event_type='page_view' AND created_at >= ?").bind(since).first(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM analytics_events WHERE event_type='affiliate_click' AND created_at >= ?").bind(since).first(),
    env.DB.prepare("SELECT article_slug, COUNT(*) AS views FROM analytics_events WHERE event_type='page_view' AND article_slug IS NOT NULL AND created_at >= ? GROUP BY article_slug ORDER BY views DESC LIMIT 10").bind(since).all(),
    env.DB.prepare("SELECT product_name, COUNT(*) AS clicks FROM analytics_events WHERE event_type='affiliate_click' AND product_name IS NOT NULL AND created_at >= ? GROUP BY product_name ORDER BY clicks DESC LIMIT 10").bind(since).all(),
    env.DB.prepare("SELECT substr(created_at,1,10) AS day, SUM(CASE WHEN event_type='page_view' THEN 1 ELSE 0 END) AS views, SUM(CASE WHEN event_type='affiliate_click' THEN 1 ELSE 0 END) AS clicks FROM analytics_events WHERE created_at >= ? GROUP BY day ORDER BY day").bind(since).all(),
    env.DB.prepare("SELECT device_type, COUNT(*) AS total FROM analytics_events WHERE event_type='page_view' AND created_at >= ? GROUP BY device_type ORDER BY total DESC").bind(since).all(),
    env.DB.prepare("SELECT COALESCE(referrer_host,'Direct') AS source, COUNT(*) AS total FROM analytics_events WHERE event_type='page_view' AND created_at >= ? GROUP BY source ORDER BY total DESC LIMIT 10").bind(since).all()
  ]);
  const pageViews = views?.total || 0, affiliateClicks = clicks?.total || 0;
  return json({
    days, pageViews, affiliateClicks, clickThroughRate: pageViews ? Number((affiliateClicks/pageViews*100).toFixed(1)) : 0,
    topArticles: articles.results || [], topProducts: products.results || [], daily: daily.results || [],
    devices: devices.results || [], sources: sources.results || []
  });
}
