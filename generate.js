#!/usr/bin/env node
/* BELDARI SAMAJ SEVA - static OG page generator (no dependencies, Node 16.7+)
   Usage: node generate.js   -> dist/ folder banata hai, use apne hosting par upload karo. */
const fs = require('fs'), path = require('path');
const R = __dirname, cfg = JSON.parse(fs.readFileSync(path.join(R, 'config.json'), 'utf8'));
if (!/^https:\/\/[^/]+/.test(cfg.siteUrl) || /YOUR-DOMAIN/.test(cfg.siteUrl)) {
  console.error('ERROR: config.json me "siteUrl" ko apne asli https domain par set karo (jaise https://beldari.example.com)'); process.exit(1);
}
const site = cfg.siteUrl.replace(/\/+$/, ''), posts = JSON.parse(fs.readFileSync(path.join(R, 'posts.json'), 'utf8'));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

function dims(f) {
  try {
    const b = fs.readFileSync(f);
    if (b[0] === 0x89) return {w: b.readUInt32BE(16), h: b.readUInt32BE(20), t: 'image/png'};
    if (b[0] === 0xff) { let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1];
        if (m === 0xff) { i++; continue; }
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return {h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7), t: 'image/jpeg'};
        i += 2 + b.readUInt16BE(i + 2);
      } }
    if (b.slice(8, 12).toString() === 'WEBP') return {w: 1200, h: 630, t: 'image/webp'};
  } catch (e) {}
  return {w: 1200, h: 630, t: 'image/jpeg'};
}
const abs = p => /^https?:\/\//.test(p) ? p.replace(/^http:/, 'https:') : site + '/' + String(p).replace(/^\/+/, '');

function page(p) {
  const rel = p.ogImage || p.image || cfg.defaultImage, img = abs(rel), d = dims(path.join(R, rel.replace(/^\/+/, '')));
  const url = site + '/post/' + p.slug + '/', app = site + '/#post=' + p.id, title = esc(p.title), desc = esc(p.description || cfg.defaultDescription);
  const tw = cfg.twitterSite ? `<meta name="twitter:site" content="${esc(cfg.twitterSite)}">` : '';
  return `<!DOCTYPE html><html lang="ne"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | ${esc(cfg.siteName)}</title><meta name="description" content="${desc}"><link rel="canonical" href="${url}">
<meta property="og:locale" content="ne_NP"><meta property="og:type" content="article"><meta property="og:site_name" content="${esc(cfg.siteName)}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${img}"><meta property="og:image:secure_url" content="${img}"><meta property="og:image:type" content="${d.t}">
<meta property="og:image:width" content="${d.w}"><meta property="og:image:height" content="${d.h}"><meta property="og:image:alt" content="${title}">
${p.date ? `<meta property="article:published_time" content="${esc(p.date)}">` : ''}
<meta name="twitter:card" content="summary_large_image">${tw}<meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${img}"><meta name="twitter:image:alt" content="${title}">
<style>body{margin:0;font-family:system-ui,"Noto Sans Devanagari",sans-serif;background:#eef5ff;color:#0f172a}main{max-width:680px;margin:auto;padding:16px}img{max-width:100%;border-radius:14px}a.b{display:inline-block;background:#1d4ed8;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none}</style></head>
<body><main><h1>${title}</h1><img src="${img}" alt="${title}"><p>${desc}</p><p><a class="b" href="${app}">${esc(cfg.siteName)} मा पूरा हेर्नुहोस् →</a></p></main>
<script>location.replace(${JSON.stringify(app)})</script></body></html>`;
}

const out = path.join(R, 'dist'); fs.rmSync(out, {recursive: true, force: true}); fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'index.html'), fs.readFileSync(path.join(R, 'index.html'), 'utf8').split('https://YOUR-DOMAIN.com').join(site));
['og.js'].forEach(f => fs.copyFileSync(path.join(R, f), path.join(out, f)));
fs.cpSync(path.join(R, 'og'), path.join(out, 'og'), {recursive: true});
const seen = new Set();
posts.forEach(p => {
  if (!/^[a-z0-9-]+$/.test(p.slug) || seen.has(p.slug)) { console.warn('SKIP (bad/duplicate slug):', p.slug); return; } seen.add(p.slug);
  fs.mkdirSync(path.join(out, 'post', p.slug), {recursive: true}); fs.writeFileSync(path.join(out, 'post', p.slug, 'index.html'), page(p));
});
fs.writeFileSync(path.join(out, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' + site + '/</loc></url>' + posts.map(p => `<url><loc>${site}/post/${p.slug}/</loc>${p.date ? `<lastmod>${esc(p.date)}</lastmod>` : ''}</url>`).join('') + '</urlset>');
fs.writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + site + '/sitemap.xml\n');
console.log('OK: ' + seen.size + ' post page(s) -> dist/\nExample: ' + site + '/post/' + [...seen][0] + '/');
