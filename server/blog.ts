import { db, getProfile, type Context, type Post } from './core';
import { escapeHtml, renderMarkdown } from '../src/lib/markdown';
function origin(context: Context) {
  try { const url = new URL(context.env.SITE_URL || context.request.url); return url.origin; }
  catch { return new URL(context.request.url).origin; }
}
function shell({ locale, title, description, canonical, alternate, body, structured, hasAlternate = true, noindex = false }: {
  locale: 'en' | 'fa'; title: string; description: string; canonical: string; alternate: string; body: string; structured?: object; hasAlternate?: boolean; noindex?: boolean;
}) {
  const fa = locale === 'fa';
  return '<!doctype html><html lang="' + locale + '" dir="' + (fa ? 'rtl' : 'ltr') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(title) + ' — Arman Mehr</title><meta name="description" content="' + escapeHtml(description) + '"><meta name="robots" content="' + (noindex ? 'noindex,nofollow' : 'index,follow') + '"><link rel="canonical" href="' + escapeHtml(canonical) + '"><link rel="alternate" hreflang="' + locale + '" href="' + escapeHtml(canonical) + '">' + (hasAlternate ? '<link rel="alternate" hreflang="' + (fa ? 'en' : 'fa') + '" href="' + escapeHtml(alternate) + '">' : '') + '<meta property="og:title" content="' + escapeHtml(title) + '"><meta property="og:description" content="' + escapeHtml(description) + '"><meta property="og:type" content="' + (structured ? 'article' : 'website') + '"><meta property="og:url" content="' + escapeHtml(canonical) + '"><meta name="twitter:card" content="summary"><link rel="icon" href="/icon.svg"><link rel="stylesheet" href="/journal.css">' +
    (structured ? '<script type="application/ld+json">' + JSON.stringify(structured).replace(/</g, '\\u003c') + '</script>' : '') +
    '</head><body><a class="skip" href="#content">' + (fa ? 'رفتن به محتوا' : 'Skip to content') + '</a><header><a class="brand" href="' + (fa ? '/fa/' : '/') + '" dir="ltr">Arman Mehr</a><nav><a href="' + (fa ? '/fa/' : '/') + '">' + (fa ? 'بازگشت به تجربه' : 'Back to the experience') + ' ↗</a><a href="' + escapeHtml(alternate) + '" lang="' + (fa ? 'en' : 'fa') + '">' + (fa ? 'EN' : 'فارسی') + '</a></nav></header><main id="content">' + body + '</main><footer><span>Arman Mehr · Journal</span><span>' + (fa ? 'طراحی و توسعه توسط' : 'Designed & developed by') + ' <strong>REDDPIXEL</strong></span></footer></body></html>';
}
const htmlResponse = (html: string, status = 200) => new Response(html, { status, headers: {
  'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate',
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
} });
export async function blog(context: Context) {
  const url = new URL(context.request.url); const locale = url.pathname.startsWith('/fa/') ? 'fa' : 'en'; const fa = locale === 'fa';
  const base = fa ? '/fa/blog/' : '/blog/'; const otherBase = fa ? '/blog/' : '/fa/blog/'; const site = origin(context);
  if (!['GET','HEAD'].includes(context.request.method)) return new Response('Method not allowed', { status:405 });
  const suffix = url.pathname.replace(/^\/(?:fa\/)?blog\/?/, '').replace(/\/$/, '');
  const title = fa ? 'یادداشت‌های پشت تصویر' : 'Notes from the other side.';
  const description = fa ? 'یادداشت‌هایی درباره جلوه‌های بصری، فرایند خلاق و جهان‌های دیجیتال.' : 'Notes on visual effects, creative process, and the worlds between imagination and the final frame.';
  try {
    const database = db(context.env);
    if (suffix) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(suffix)) return missing();
      const post = await database.prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'").bind(suffix).first<Post>();
      if (!post || (fa && (!post.title_fa || !post.body_fa))) return missing();
      const profile = await getProfile(context.env);
      const postTitle = fa ? post.title_fa : post.title_en;
      const summary = fa ? post.excerpt_fa : post.excerpt_en;
      const content = fa ? post.body_fa : post.body_en;
      const author = fa ? profile.name_fa : profile.name_en;
      const canonical = site + base + post.slug + '/';
      const translated = Boolean(post.title_fa && post.body_fa);
      const alternate = site + otherBase + (translated ? post.slug + '/' : '');
      const structured = { '@context':'https://schema.org', '@type':'BlogPosting', headline:postTitle, description:summary,
        datePublished:post.published_at, dateModified:post.updated_at, inLanguage:locale,
        author:{ '@type':'Person', name:author }, mainEntityOfPage:canonical,
        publisher:{ '@type':'Organization', name:'Arman Mehr' } };
      const date = new Date(post.published_at || post.created_at).toLocaleDateString(fa ? 'fa-IR' : 'en-US', { year:'numeric', month:'long', day:'numeric', timeZone:'UTC' });
      const body = '<a class="back" href="' + base + '">← ' + (fa ? 'همه یادداشت‌ها' : 'All notes') + '</a><article><div class="eyebrow">' + (fa ? 'ژورنال / پشت صحنه' : 'JOURNAL / BEHIND THE FRAME') + '</div><h1>' + escapeHtml(postTitle) + '</h1><p class="standfirst">' + escapeHtml(summary) + '</p><div class="byline"><span>' + escapeHtml(author) + '</span><time datetime="' + escapeHtml(post.published_at) + '">' + escapeHtml(date) + '</time><span>' + Math.max(1, Math.ceil(content.split(/\s+/).length / 200)) + (fa ? ' دقیقه مطالعه' : ' min read') + '</span></div><div class="article-body">' + renderMarkdown(content) + '</div><div class="tags">' + post.tags.split(',').filter(Boolean).map((tag) => '<span>' + escapeHtml(tag.trim()) + '</span>').join('') + '</div><a class="back" href="' + (fa ? '/fa/' : '/') + '">' + (fa ? 'یک ایده در ذهن دارید؟ وارد تجربه شوید' : 'An idea in mind? Enter the experience') + ' ↗</a></article>';
      return htmlResponse(shell({ locale, title:postTitle, description:summary, canonical, alternate, body, structured, hasAlternate:translated }));
    }
    const page = Math.min(10000, Math.max(1, parseInt(url.searchParams.get('page') || '1',10) || 1));
    const condition = fa ? "status = 'published' AND title_fa != '' AND body_fa != ''" : "status = 'published'";
    const count = await database.prepare('SELECT COUNT(*) AS total FROM posts WHERE ' + condition).first<{total:number}>();
    const result = await database.prepare('SELECT slug, title_en, title_fa, excerpt_en, excerpt_fa, published_at, tags FROM posts WHERE ' + condition + ' ORDER BY published_at DESC, id DESC LIMIT 9 OFFSET ?').bind((page - 1) * 9).all<Post>();
    if (page > 1 && !result.results.length) return missing();
    const cards = result.results.map((post, i) => '<a class="post-card" href="' + base + escapeHtml(post.slug) + '/"><div class="post-index"><span>' + String((page - 1) * 9 + i + 1).padStart(2,'0') + '</span><time datetime="' + escapeHtml(post.published_at) + '">' + escapeHtml((post.published_at || '').slice(0,10)) + '</time></div><h2>' + escapeHtml(fa ? post.title_fa : post.title_en) + '</h2><p>' + escapeHtml(fa ? post.excerpt_fa : post.excerpt_en) + '</p><span class="read">' + (fa ? 'خواندن یادداشت' : 'Read the note') + ' ↗</span></a>').join('');
    const body = '<section class="journal-intro"><p class="eyebrow">' + (fa ? 'ژورنال / فرایند، ایده‌ها و امکان‌ها' : 'THE JOURNAL / PROCESS, IDEAS & POSSIBILITIES') + '</p><h1>' + title + '</h1><p>' + description + '</p><span class="intro-star" aria-hidden="true">✳</span></section>' +
      (cards ? '<div class="post-grid">' + cards + '</div>' : '<div class="empty-journal"><span>✳</span><h2>' + (fa ? 'اولین یادداشت‌ها در راه‌اند.' : 'The first notes are taking shape.') + '</h2><p>' + (fa ? 'تا آن زمان، جهان‌های بصری را کاوش کنید.' : 'Until then, step inside the visual worlds.') + '</p><a href="' + (fa ? '/fa/' : '/') + '">' + (fa ? 'ورود به تجربه' : 'Enter the experience') + ' ↗</a></div>') +
      '<nav class="pagination" aria-label="Pagination">' + (page > 1 ? '<a href="' + base + '?page=' + (page - 1) + '">' + (fa ? 'جدیدتر' : 'Newer notes') + '</a>' : '<span></span>') + '<span>' + page + '</span>' + (page * 9 < (count?.total || 0) ? '<a href="' + base + '?page=' + (page + 1) + '">' + (fa ? 'قدیمی‌تر' : 'Older notes') + '</a>' : '') + '</nav>';
    return htmlResponse(shell({ locale, title, description, canonical:site + base + (page > 1 ? '?page=' + page : ''), alternate:site + otherBase, body }));
  } catch {
    return htmlResponse(shell({ locale, title:fa ? 'ژورنال در حال آماده‌سازی' : 'The journal is connecting', description, canonical:site + base, alternate:site + otherBase,
      body:'<section class="empty-journal"><h1>' + (fa ? 'ژورنال به‌زودی در دسترس خواهد بود.' : 'The journal is temporarily unavailable.') + '</h1><p>' + (fa ? 'کمی بعد دوباره سر بزنید.' : 'Please check back shortly.') + '</p></section>', noindex:true }),503);
  }
  function missing() { return htmlResponse(shell({ locale, title:fa ? 'یادداشت پیدا نشد' : 'Note not found', description, canonical:site + url.pathname, alternate:site + otherBase, noindex:true,
    body:'<section class="empty-journal"><h1>' + (fa ? 'این یادداشت در دسترس نیست.' : 'This note is not available.') + '</h1><a href="' + base + '">' + (fa ? 'بازگشت به ژورنال' : 'Back to the journal') + ' ↗</a></section>' }),404); }
}
export async function sitemap(context: Context) {
  try {
    const site = origin(context);
    const result = await db(context.env).prepare("SELECT slug, updated_at, (title_fa != '' AND body_fa != '') AS has_fa FROM posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 24000").all<{slug:string;updated_at:string;has_fa:number}>();
    const urls = ['/en/', '/en/about/', '/en/works/', '/en/contact/', '/fa/', '/fa/about/', '/fa/works/', '/fa/contact/', '/blog/', '/fa/blog/'].map((path) => '<url><loc>' + escapeHtml(site + path) + '</loc></url>');
    for (const post of result.results) for (const base of post.has_fa ? ['/blog/','/fa/blog/'] : ['/blog/'])
      urls.push('<url><loc>' + escapeHtml(site + base + post.slug + '/') + '</loc><lastmod>' + escapeHtml(post.updated_at) + '</lastmod></url>');
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>', { headers:{ 'Content-Type':'application/xml; charset=utf-8', 'Cache-Control':'no-cache' } });
  } catch { return new Response('Sitemap temporarily unavailable', { status:503, headers:{ 'Cache-Control':'no-store' } }); }
}
export function robots(context: Context) {
  return new Response('User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ' + origin(context) + '/sitemap.xml\n', { headers:{'Content-Type':'text/plain; charset=utf-8'} });
}
