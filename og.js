/* BELDARI SAMAJ SEVA - OG helper (browser side)
   1) har post ka share link (/post/<slug>/) + Facebook/WhatsApp share buttons
   2) post kholte waqt browser ke meta tags update
   3) post form me optional "OG image" field
   4) Admin: posts.json + 1200x630 OG images export (server par upload ke liye)
   3) #post=<id> link se seedha post khulna
   NOTE: crawlers ke liye asli meta tags generate.js / share.php banate hain (initial HTML me). */
(function () {
  if (typeof DB === 'undefined') return;
  var SEED = {'pol-1': 'tata-safari-transformer', 'pol-2': 'beldari-road-condition'};
  var NP = ['pol', 'soc', 'news', 'evt', 'gal', 'vid'];
  var slug = function (k, i) { return i.slug || SEED[k + '-' + i.id] || k + '-' + i.id; };
  var url = function (k, i) { return location.origin + '/post/' + slug(k, i) + '/'; };
  var desc = function (i) { return (i.d || '').replace(/\s+/g, ' ').trim().slice(0, 160); };

  function setM(p, v, n) {
    var a = n ? 'name' : 'property', m = document.head.querySelector('meta[' + a + '="' + p + '"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute(a, p); document.head.appendChild(m); }
    m.content = v;
  }
  function setPage(t, d, u) {
    document.title = t + ' | BELDARI SAMAJ SEVA';
    setM('og:title', t); setM('og:description', d); setM('og:url', u);
    setM('twitter:title', t, 1); setM('twitter:description', d, 1); setM('description', d, 1);
    var c = document.querySelector('link[rel=canonical]'); if (c) c.href = u;
  }

  /* open(): share buttons + meta + hash */
  var _open = window.open;
  window.open = function (k, id) {
    _open(k, id);
    var i = find(k, id); if (!i || k === 'mem') return;
    setPage(i.t, desc(i), url(k, i));
    try { history.replaceState(null, '', '#post=' + k + '-' + id); } catch (x) {}
    var p = document.querySelector('#mo .pn'); if (!p) return;
    var u = encodeURIComponent(url(k, i));
    p.insertAdjacentHTML('beforeend',
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">' +
      '<button class="btn sm" data-og="copy" data-u="' + url(k, i) + '">🔗 Link copy</button>' +
      '<a class="btn sm o" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '">Facebook</a>' +
      '<a class="btn sm o" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(i.t + ' ') + u + '">WhatsApp</a></div>');
  };

  /* form(): optional separate OG image */
  var _form = window.form;
  window.form = function (k, id) {
    _form(k, id);
    if (k === 'mem') return;
    var pv = document.getElementById('pv');
    if (pv) pv.insertAdjacentHTML('beforebegin', '<label>OG image (optional, 1200×630) — खाली छोड्दा featured image प्रयोग हुन्छ</label><input type="file" id="fog" accept="image/*">');
  };
  document.addEventListener('change', async function (ev) {
    if (ev.target.id === 'fog' && S.f && ev.target.files[0]) { S.f.i.og = await rd(ev.target.files[0]); toast('OG image सेट भयो'); }
  });

  /* admin export panel */
  var _draw = window.draw;
  window.draw = function () {
    _draw();
    if (S.v === 'admin' && S.adm)
      document.getElementById('mn').insertAdjacentHTML('beforeend',
        '<div class="glass bd" style="margin-top:14px"><h2>🌐 OG Preview Export</h2><p>नयाँ पोस्ट publish गरेपछि यो थिच्नुहोस्। <b>posts.json</b> र हरेक पोस्टको <b>1200×630 .jpg</b> download हुन्छ। जसलाई सर्भरमा upload गर्नुहोस् (README हेर्नुहोस्)।</p><button class="btn" id="ogx">📤 posts.json + OG images export</button></div>');
  };

  var L = function (s) { return new Promise(function (r) { var m = new Image(); m.onload = function () { r(m); }; m.onerror = function () { r(null); }; m.src = s; }); };
  async function card(src, src2) {
    var im = await L(src); if (!im) return null;
    var c = document.createElement('canvas'); c.width = 1200; c.height = 630; var x = c.getContext('2d');
    var s = Math.max(1200 / im.width, 630 / im.height);
    x.filter = 'blur(28px)'; x.drawImage(im, (1200 - im.width * s) / 2, (630 - im.height * s) / 2, im.width * s, im.height * s);
    x.filter = 'none'; x.fillStyle = 'rgba(8,20,70,.35)'; x.fillRect(0, 0, 1200, 630);
    var t = Math.min(1200 / im.width, 630 / im.height), w = im.width * t, h = im.height * t, fx = (1200 - w) / 2, fy = (630 - h) / 2;
    x.drawImage(im, fx, fy, w, h);
    var im2 = src2 && await L(src2);
    if (im2) {
      var W = w * .38, H = Math.min(h * .6, W * im2.height / im2.width), X = fx + w * .56, Y = fy + h - H;
      x.save(); x.beginPath(); x.moveTo(X, Y + H); x.lineTo(X, Y + W / 2); x.arc(X + W / 2, Y + W / 2, W / 2, Math.PI, 0); x.lineTo(X + W, Y + H); x.closePath();
      x.lineWidth = 8; x.strokeStyle = '#fff'; x.stroke(); x.clip(); x.drawImage(im2, X, Y, W, W * im2.height / im2.width); x.restore();
    }
    return new Promise(function (r) { c.toBlob(r, 'image/jpeg', .88); });
  }
  async function exportAll() {
    var list = [], files = [];
    toast('Export हुँदैछ…');
    for (var a = 0; a < NP.length; a++) {
      var k = NP[a], arr = DB[k];
      for (var b = 0; b < arr.length; b++) {
        var i = arr[b]; if (i.draft) continue;
        var s = slug(k, i), img = 'og/default.jpg', src = i.og || (i.img ? im(i.img) : null);
        if (src) { var bl = await card(src, i.og ? null : (i.img2 ? im(i.img2) : null)); if (bl) { files.push([s + '.jpg', bl]); img = 'og/' + s + '.jpg'; } }
        list.push({id: k + '-' + i.id, slug: s, title: i.t, description: desc(i), date: i.date || '', category: i.cat, section: k, image: img, ogImage: ''});
      }
    }
    files.unshift(['posts.json', new Blob([JSON.stringify(list, null, 2)], {type: 'application/json'})]);
    for (var f = 0; f < files.length; f++) {
      var an = document.createElement('a'); an.href = URL.createObjectURL(files[f][1]); an.download = files[f][0];
      document.body.appendChild(an); an.click(); an.remove(); await new Promise(function (r) { setTimeout(r, 450); });
    }
    toast('✅ Export पूरा: posts.json + ' + (files.length - 1) + ' image');
  }
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.id === 'ogx') exportAll();
    if (t.dataset && t.dataset.og === 'copy') {
      var u = t.dataset.u;
      (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { toast('✅ Link copy भयो'); }, function () { prompt('Link copy गर्नुहोस्:', u); });
    }
  });

  /* #post=pol-1 link -> open post */
  function route() {
    var m = location.hash.match(/^#post=([a-z]+)-(\d+)$/); if (!m || !DB[m[1]]) return;
    var i = find(m[1], +m[2]); if (!i) return;
    S.v = m[1]; S.q = ''; S.cat = ''; draw(); nav(); window.open(m[1], +m[2]);
  }
  window.addEventListener('hashchange', route); route();
})();
