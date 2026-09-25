/*
 * Portfolio book — page engine (final production).
 *  1. Draws every drawing (data-dwg="walnut:plan" | "cad:arcadeWall", data-arg JSON), drawing titles
 *     (data-title JSON), render annotations (data-annot) and page sheet blocks (data-block) with CAD v2.
 *     Drawings on .dark pages use the ivory linework theme.
 *  2. Numbers pages, assigns verso/recto, writes running heads (data-rh) and folios, builds the contents,
 *     the works index and page references (data-pref → data-anchor).
 *  3. Lays out the output mode from the URL hash: (none) proof spreads · #grid overlay · #screen · #print · #marks
 */
(function () {
  'use strict';
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var D = window.CAD2, mode = (location.hash || '').replace('#', '') || 'proof';
  var pages = $('#book > .page'), problems = [];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dark(el) { return !!el.closest('.dark'); }

  /* ---------- 1 · drawings ---------- */
  $('[data-dwg]').forEach(function (el) {
    var d = el.dataset.dwg.split(':'), lib = d[0] === 'walnut' ? window.WALNUT : window.CAD, fn = lib[d[1]];
    if (!fn) { problems.push('Unknown drawing ' + el.dataset.dwg); return; }
    D.theme(dark(el));
    var args = [+el.dataset.w, +el.dataset.h];
    if (el.dataset.arg) args.push(JSON.parse(el.dataset.arg));
    el.innerHTML = fn.apply(null, args);
    D.theme(false);
  });
  $('[data-title]').forEach(function (el) {
    var t = JSON.parse(el.dataset.title);
    D.theme(dark(el)); el.innerHTML = D.drawingTitle(t.w, t.num, t.sheet, t.title, t.sub); D.theme(false);
  });
  $('[data-annot]').forEach(function (el) {
    var w = +el.dataset.w, k = w / (+el.dataset.srcw || 1800), s = '';
    D.theme(false);
    JSON.parse(el.dataset.annot).forEach(function (a) { s += D.key(a[0] * k, a[1] * k, a[2] * k, a[3] * k, a[4]); });
    el.innerHTML = D.svg(w, +el.dataset.h, s);
  });

  /* ---------- 2 · numbering, running heads, folios ---------- */
  var section = '';
  pages.forEach(function (p, i) {
    var n = i + 1, side = n % 2 === 0 ? 'verso' : 'recto', x0 = side === 'recto' ? 20 : 15;
    p.classList.add(side); p.dataset.page = n;
    if (p.dataset.side && p.dataset.side !== side) problems.push('Page ' + n + ' designed as ' + p.dataset.side + ' but falls on ' + side);
    section = p.dataset.section || section;
    if (p.dataset.block) { D.theme(dark(p)); p.insertAdjacentHTML('beforeend', '<div class="dwg" style="left:' + x0 + 'mm; top:262.5mm">' + D.sheetBlock(175, JSON.parse(p.dataset.block)) + '</div>'); D.theme(false); }
    if (p.dataset.rh) {
      var r = p.dataset.rh.split('|');
      p.insertAdjacentHTML('beforeend', '<div class="rh" style="left:' + x0 + 'mm">' + r[0] + '</div><div class="rh" style="right:' + (side === 'recto' ? 15 : 20) + 'mm"><span>' + (r[1] || '') + '</span></div><div class="hair" style="left:' + x0 + 'mm; width:175mm; top:19.5mm"></div>');
    }
    if (!p.classList.contains('no-folio')) p.insertAdjacentHTML('beforeend', '<div class="folio"><b>' + pad(n) + '</b><span>' + section + '</span></div>');
    if (mode === 'grid') {
      var g = '<div class="gridov">';
      for (var c = 0; c < 12; c++) g += '<div class="col" style="left:' + (x0 + c * 15) + 'mm"></div>';
      for (var b = 0; b <= 59; b++) g += '<div class="bl" style="top:' + (15 + b * 4.5) + 'mm' + (b % 5 === 0 ? '; border-top-color: rgba(40,120,200,.7)' : '') + '"></div>';
      g += '<div class="zone" style="top:262.5mm; height:17mm"></div><div class="m" style="left:' + x0 + 'mm; top:15mm; width:175mm; height:265.5mm"></div></div>';
      p.insertAdjacentHTML('beforeend', g);
    }
  });
  $('[data-pref]').forEach(function (el) {
    var t = document.querySelector('[data-anchor="' + el.dataset.pref + '"]');
    if (t) el.textContent = pad(+t.dataset.page); else problems.push('Missing anchor ' + el.dataset.pref);
  });
  function fill(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
  fill('toc', pages.filter(function (p) { return p.dataset.toc; }).map(function (p) {
    var sub = p.dataset.tocLevel === '2', num = sub ? p.dataset.project.split('|')[0] : '';
    return '<div style="display:grid; grid-template-columns:15mm 1fr 15mm; height:9mm; align-items:center; border-top:.3pt solid var(--rule)">' +
      '<span class="num" style="font-size:12pt">' + num + '</span><span style="font:400 ' + (sub ? '14pt' : '17pt') + '/6.75mm Instrument Serif">' + p.dataset.toc + '</span>' +
      '<span class="lbl" style="text-align:right; color:var(--ink)">' + pad(+p.dataset.page) + '</span></div>';
  }).join(''));
  fill('works', pages.filter(function (p) { return p.dataset.project; }).map(function (p) {
    var d = p.dataset.project.split('|');
    return '<div class="row7" style="position:relative; width:175mm"><span class="num" style="font-size:13pt">' + d[0] + '</span>' +
      '<div class="fig" style="position:relative; width:25mm; height:13.5mm"><img src="../../projects/' + d[3] + '.webp" alt=""></div>' +
      '<span style="font:400 15pt/6.75mm Instrument Serif">' + d[1] + '</span><span class="lbl">' + d[2] + '</span><span class="lbl" style="text-align:right; color:var(--ink)">' + pad(+p.dataset.page) + '</span></div>';
  }).join(''));
  window.bookProblems = problems;

  /* ---------- 3 · output modes ---------- */
  function setPageSize(w, h) { var st = document.createElement('style'); st.textContent = '@page { size: ' + w + 'mm ' + h + 'mm; margin: 0; }'; document.head.appendChild(st); }
  function swapImages(dir) { $('img').forEach(function (img) { img.src = img.getAttribute('src').replace('../../', dir + '/').replace(/\.webp$/, '.jpg'); }); }
  var book = document.getElementById('book');
  if (mode === 'screen' || mode === 'grid') { swapImages('img-screen'); setPageSize(210, 297); }
  else if (mode === 'print' || mode === 'marks') {
    swapImages('img-print');
    pages.forEach(function (p) {
      var bleed = document.createElement('div');
      bleed.className = 'bleed' + (p.classList.contains('dark') ? ' dark' : '');
      p.parentNode.insertBefore(bleed, p); bleed.appendChild(p);
      if (mode === 'marks') {
        var slug = document.createElement('div'); slug.className = 'slug';
        bleed.parentNode.insertBefore(slug, bleed); slug.appendChild(bleed);
        var t = 13, b = 310, l = 13, r = 223, len = 5, off = 3, w = 0.09;
        [[l - off - len, t, len, w], [l, t - off - len, w, len], [r + off, t, len, w], [r, t - off - len, w, len], [l - off - len, b, len, w], [l, b + off, w, len], [r + off, b, len, w], [r, b + off, w, len]].forEach(function (m) {
          slug.insertAdjacentHTML('beforeend', '<div class="cropmark" style="left:' + m[0] + 'mm; top:' + m[1] + 'mm; width:' + m[2] + 'mm; height:' + m[3] + 'mm"></div>');
        });
        slug.insertAdjacentHTML('beforeend', '<div class="slug__info">Alaa Masri — Portfolio 2026–2027 · page ' + p.dataset.page + ' / ' + pages.length + ' · A4 210 × 297 mm trim · 3 mm bleed</div>');
      }
    });
    setPageSize(mode === 'print' ? 216 : 236, mode === 'print' ? 303 : 323);
  } else {
    document.body.classList.add('proof'); setPageSize(440, 320);
    var rows = [[pages[0]]];
    for (var i = 1; i < pages.length - 1; i += 2) rows.push(pages.slice(i, i + 2));
    rows.push([pages[pages.length - 1]]);
    rows.forEach(function (group) {
      var row = document.createElement('div'); row.className = 'spreadrow'; book.appendChild(row);
      group.forEach(function (p) { row.appendChild(p); });
      row.insertAdjacentHTML('beforeend', '<div class="spreadrow__no">' + group.map(function (p) { return pad(+p.dataset.page); }).join(' — ') + '</div>');
    });
  }
  document.documentElement.dataset.ready = '1';
})();
