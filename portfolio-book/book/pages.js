/*
 * Portfolio book — generated page content (runs before rich.js and book.js).
 * Everything here is either verified copy (content.js, profile, CV) or a
 * representative format that is labelled as such on the page.
 */
(function () {
  'use strict';
  var $ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function fill(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
  var CAD = window.CAD, PAL = window.PAL;

  /* ---------- Annotation overlays on renders ----------
     <div class="cad annot" data-w="172" data-h="96" data-srcw="1800" data-tags='[[x,y,tx,ty,"1"], …]'> — pixel coordinates of the render */
  $('.annot').forEach(function (el) {
    var w = +el.dataset.w, h = +el.dataset.h, k = w / (+el.dataset.srcw || 1800), s = '';
    if (el.dataset.dark) CAD.theme(true);
    JSON.parse(el.dataset.tags).forEach(function (t) { s += CAD.tag(t[0] * k, t[1] * k, t[2] * k, t[3] * k, t[4]); });
    el.innerHTML = CAD.svg(w, h, s);
    CAD.theme(false);
  });

  /* ---------- Skyline suite: strip cut from the project's own material board (Fig. 06), labelled as on the board ---------- */
  var BS = [['Wall panelling', 'Walnut, vertical grain', '120,260,160,160'], ['Flooring', 'Dark oak hardwood', '120,660,160,160'], ['Headboard', 'Taupe velvet', '720,230,160,160'], ['Bedding', 'Beige linen', '690,440,120,120'], ['Curtains', 'Gold-beige drapery', '960,450,160,160'], ['Rug', 'Cream shag pile', '700,660,160,160'], ['Bench', 'Dark brown leather', '1240,350,130,130'], ['Accent pillow', 'Woven brown leather', '1590,550,120,120']];
  $('[data-boardstrip]').forEach(function (el) {
    var x0 = +el.dataset.x, y = +el.dataset.y, step = +el.dataset.step || 22;
    el.outerHTML = BS.map(function (b, i) {
      return '<div class="tx" style="left:' + (x0 + i * step) + 'mm; top:' + y + 'mm; width:' + (step - 1.5) + 'mm"><div class="crop" data-img="projects/skyline-suite-06.webp" data-r="' + b[2] + '" style="width:15mm; height:15mm"></div><span><b>' + b[0] + '</b>' + b[1] + '</span></div>';
    }).join('');
  });

  /* ---------- Expertise: seven disciplines (website copy, verbatim), each with a study ---------- */
  var E = window.EXP;
  function row(i, y, h, x0, vis) {
    var e = E[i], xv = x0 + 80;
    return '<div class="hair" style="left:' + x0 + 'mm; width:172mm; top:' + y + 'mm"></div>' +
      '<div class="abs num" style="top:' + (y + 2.4) + 'mm; left:' + x0 + 'mm; font-size:13pt">0' + (i + 1) + '</div>' +
      '<div class="abs serif" style="top:' + (y + 2) + 'mm; left:' + (x0 + 9) + 'mm; width:68mm; font-size:17pt; line-height:1.05">' + e[0] + '</div>' +
      '<div class="abs cap" style="top:' + (y + 10.5) + 'mm; left:' + (x0 + 9) + 'mm; width:66mm">' + e[1] + '</div>' +
      '<div class="abs cap" style="top:' + (y + 30) + 'mm; left:' + (x0 + 9) + 'mm; width:66mm; color:var(--muted)">' + e[2] + '</div>' +
      '<div class="abs" style="top:' + (y + 3) + 'mm; left:' + xv + 'mm; width:92mm; height:' + (h - 6) + 'mm">' + vis + '</div>';
  }
  var sw = function (img, r, x, y, w) { return '<div class="crop" data-img="' + img + '" data-r="' + r + '" style="left:' + x + 'mm; top:' + y + 'mm; width:' + w + 'mm"></div>'; };
  var chip = function (k, x, y, w) { return '<div class="abs" style="left:' + x + 'mm; top:' + y + 'mm; width:' + (w || 14) + 'mm; height:5.5mm; background:' + PAL[k].hex + '"></div>'; };
  var tagv = function (t, y) { return '<div class="stag" style="left:0; top:' + y + 'mm">' + t + '</div>'; };
  var cap = function (t, x, y, w) { return '<div class="abs cap" style="left:' + x + 'mm; top:' + y + 'mm; width:' + w + 'mm">' + t + '</div>'; };
  var V = [
    sw('projects/walnut-suite-03.webp', '100,300,270,180', 0, 0, 29) + sw('projects/walnut-suite-05.webp', '820,300,270,180', 31.5, 0, 29) + sw('projects/walnut-suite-03.webp', '1000,820,270,180', 63, 0, 29) +
      ['walnut', 'walnutLit', 'velvet', 'marble', 'brass', 'linen'].map(function (k, i) { return chip(k, i * 15.4, 22, 14); }).join('') + tagv('Concept &amp; material study', 37),
    '<div class="cad" style="left:0; top:0">' + CAD.ceilingDetail(66, 36, .44) + '</div>' + cap('Bulkhead, lighting cove and shadow gap to the wall', 66, 3, 26) + tagv('Representative section', 37),
    '<div class="cad" style="left:4mm; top:-1mm">' + CAD.shelfDetail(44, 38, .4) + '</div><div class="cad" style="left:44mm; top:0">' + CAD.archElevation(22, 32, { dims: false }) + '</div>' + cap('Lit shelf section · arched opening', 68, 3, 24) + tagv('Representative detail', 37),
    '<table class="t" style="width:92mm"><tr><th>Ref</th><th>Item</th><th>Unit</th><th class="n">Qty</th><th class="n">Rate</th></tr><tr><td>1.01</td><td>Gypsum ceiling with lighting cove</td><td>m²</td><td class="n">48.0</td><td class="n">—</td></tr><tr><td>1.02</td><td>Veneer wall panelling on battens</td><td>m²</td><td class="n">22.5</td><td class="n">—</td></tr><tr><td>1.03</td><td>Built-in wardrobe, glass doors, LED</td><td>m</td><td class="n">4.8</td><td class="n">—</td></tr></table>' + tagv('BOQ format · sample values', 37)
  ];
  var V2 = [
    '<div class="cad" style="left:0; top:0">' + CAD.coordination(92, 46, ['Clients', 'Consultants', 'Contractors', 'Suppliers', 'Workshops', 'Factories', 'Site teams']) + '</div>' + tagv('Coordination — from the profile', 49),
    ['Material samples reviewed against specification', 'Shop drawings coordinated for execution', 'Site inspection — quality standards', 'Technical and design issues resolved', 'Detail managed through to handover'].map(function (c) { return '<div class="check"><i></i><span>' + c + '</span></div>'; }).join('') + tagv('Representative checklist format', 49),
    sw('projects/arched-retreat-01.webp', '100,0,1600,1005', 0, 6, 29) + cap('<b>1</b>Overall', 0, 26, 29) +
      sw('projects/arched-retreat-01.webp', '560,0,700,440', 31.5, 6, 29) + cap('<b>2</b>Space', 31.5, 26, 29) +
      sw('projects/arched-retreat-01.webp', '420,640,320,201', 63, 6, 29) + cap('<b>3</b>Detail', 63, 26, 29) + tagv('From render to detail — An arched retreat, Fig. 01', 49)
  ];
  fill('exp1', [0, 1, 2, 3].map(function (i) { return row(i, 78 + i * 50, 50, 14, V[i]); }).join(''));
  fill('exp2', [4, 5, 6].map(function (i, k) { return row(i, 16 + k * 64, 64, 24, V2[k]); }).join(''));

  /* ---------- Site inspection checklist (representative format) ---------- */
  fill('qa2', ['Setting-out checked against drawings', 'Joinery samples approved before production', 'Stone slabs viewed and matched', 'Lighting positions checked before closing ceilings', 'Finishes inspected — snag list issued', 'Handover documents complete'].map(function (c) { return '<div class="check"><i></i><span>' + c + '</span></div>'; }).join('') + '<div class="cap" style="margin-top:1.6mm; color:var(--muted)">Representative format — not a record of a specific project.</div>');

  /* ---------- Project index strips (page numbers resolved by book.js from data-anchor) ---------- */
  var TH = [['01', 'arched-retreat-01', 'arched', 'An arched retreat'], ['02', 'skyline-suite-01', 'skyline', 'The skyline suite'], ['03', 'walnut-suite-01', 'walnut', 'The walnut suite'], ['04', 'illuminated-villa-02', 'villa', 'The illuminated villa'], ['05', 'garden-lounge-01', 'garden', 'Living by the garden'], ['06', 'burgundy-salon-01', 'salon', 'The burgundy salon'], ['07', 'earth-toned-majlis-01', 'majlis', 'An earthy welcome']];
  $('[data-thumbs]').forEach(function (el) {
    var x0 = +el.dataset.x, y = +el.dataset.y, w = +el.dataset.w || 22.66, step = w + 2, names = el.dataset.thumbs === 'names';
    el.outerHTML = TH.map(function (t, i) {
      return '<div class="fig fig--native" style="left:' + (x0 + i * step) + 'mm; top:' + y + 'mm; width:' + w + 'mm"><img src="../../projects/' + t[1] + '.webp" alt=""></div>' +
        '<div class="abs cap" style="left:' + (x0 + i * step) + 'mm; top:' + (y + w * 1005 / 1800 + 1.6) + 'mm; width:' + w + 'mm"><b>' + t[0] + '</b>' + (names ? t[3] + '<br>' : '') + 'p. <span data-pref="' + t[2] + '"></span></div>';
    }).join('');
  });
})();
