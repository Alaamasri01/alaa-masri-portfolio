/*
 * Generated page parts (runs before rich.js and book.js).
 * Expertise: the seven disciplines (website copy, verbatim — content.js), each with a study large
 * enough to read at A4. Studies are real crops, annotated renders or representative formats.
 */
(function () {
  'use strict';
  var E = window.EXP;
  function crop(img, r, x, y, w, h, extra) { return '<div class="crop" data-img="' + img + '" data-r="' + r + '" style="left:' + x + 'mm; top:' + y + 'mm; width:' + w + 'mm; height:' + h + 'mm"></div>' + (extra || ''); }
  function annot(x, y, w, h, srcw, tags) { return '<div class="dwg" data-annot=\'' + JSON.stringify(tags) + '\' data-w="' + w + '" data-h="' + h + '" data-srcw="' + srcw + '" style="left:' + x + 'mm; top:' + y + 'mm"></div>'; }
  function cap(t, x, y, w) { return '<div class="abs cap" style="left:' + x + 'mm; top:' + y + 'mm; width:' + w + 'mm">' + t + '</div>'; }
  function stag(t, x, y) { return '<div class="stag" style="left:' + x + 'mm; top:' + y + 'mm">' + t + '</div>'; }
  function row(i, x0, y, h, study) {
    var e = E[i];
    return '<div class="hair" style="left:' + x0 + 'mm; width:175mm; top:' + y + 'mm"></div>' +
      '<div class="abs num" style="left:' + x0 + 'mm; top:' + (y + 4.5) + 'mm; font-size:14pt; line-height:4.5mm">0' + (i + 1) + '</div>' +
      '<div class="abs head" style="left:' + (x0 + 15) + 'mm; top:' + (y + 3) + 'mm; font-size:17pt">' + e[0] + '</div>' +
      '<div class="abs cap" style="left:' + (x0 + 15) + 'mm; top:' + (y + 13.5) + 'mm; width:55mm">' + e[1] + '</div>' +
      '<div class="abs cap" style="left:' + (x0 + 15) + 'mm; top:' + (y + h - 18) + 'mm; width:55mm; color:var(--muted)">' + e[2] + '</div>' +
      study(x0 + 75, y + 4.5);
  }
  var P = window.PAL;
  function chip(k, x, y) { return '<div class="abs" style="left:' + x + 'mm; top:' + y + 'mm; width:10mm; height:9mm; background:' + P[k].hex + '"></div>'; }
  var S = [
    function (x, y) { // 01 interior design — material study
      return crop('projects/walnut-suite-03.webp', '100,300,360,389', x, y, 25, 27) + crop('projects/walnut-suite-05.webp', '800,300,360,389', x + 30, y, 25, 27) + crop('projects/walnut-suite-03.webp', '960,610,360,389', x + 60, y, 25, 27) +
        chip('walnut', x + 90, y) + chip('velvet', x + 90, y + 9) + chip('marble', x + 90, y + 18) +
        cap('<b>WD</b>Walnut', x, y + 27, 25) + cap('<b>UP</b>Velvet', x + 30, y + 27, 25) + cap('<b>ST</b>Marble', x + 60, y + 27, 25) + stag('Material study · The walnut suite', x, y + 36);
    },
    function (x, y) { // 02 interior architecture — annotated render
      return crop('projects/arched-retreat-01.webp', '380,0,1000,315', x, y, 100, 31.5) +
        annot(x, y, 100, 31.5, 1000, [[480, 150, 480, 60, '1'], [300, 22, 390, 22, '2'], [720, 250, 790, 270, '3']]) +
        cap('<b>1</b>Chandelier on the axis <b>2</b>Ceiling cove <b>3</b>Stone arch', x, y + 32, 100);
    },
    function (x, y) { // 03 technical & shop drawings — render linked to its drawings
      return crop('projects/walnut-suite-03.webp', '300,120,1000,315', x, y, 100, 31.5) +
        annot(x, y, 100, 31.5, 1000, [[170, 170, 110, 70, '1'], [480, 250, 560, 270, '2']]) +
        cap('<b>1</b>Lit shelf → CD-01, p. <span data-pref="walnut-detail"></span> <b>2</b>Media wall → DD-02, p. <span data-pref="walnut-elev"></span>', x, y + 32, 100);
    },
    function (x, y) { // 04 BOQ — representative format
      return '<div class="tbl" style="left:' + x + 'mm; top:' + y + 'mm; width:100mm"><table class="t"><colgroup><col style="width:12mm"><col><col style="width:12mm"><col style="width:13mm"><col style="width:13mm"></colgroup>' +
        '<tr><th>Ref</th><th>Item</th><th>Unit</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th></tr>' +
        '<tr><td>1.01</td><td>Gypsum ceiling with lighting cove</td><td>m²</td><td style="text-align:right">48.0</td><td style="text-align:right">—</td></tr>' +
        '<tr><td>1.02</td><td>Veneer wall panelling on battens</td><td>m²</td><td style="text-align:right">22.5</td><td style="text-align:right">—</td></tr>' +
        '<tr><td>1.03</td><td>Built-in wardrobe, glass doors, LED</td><td>m</td><td style="text-align:right">4.8</td><td style="text-align:right">—</td></tr></table></div>' +
        stag('BOQ format · sample values · rates omitted', x, y + 36);
    }
  ];
  var S2 = [
    function (x, y) { return '<div class="dwg" style="left:' + x + 'mm; top:' + y + 'mm" data-dwg="cad:coordination" data-w="100" data-h="45" data-arg=\'["Clients","Consultants","Contractors","Suppliers","Workshops","Factories","Site teams"]\'></div>' + stag('Coordination — partners named in the profile', x, y + 45); },
    function (x, y) { return '<div class="abs" style="left:' + x + 'mm; top:' + y + 'mm; width:100mm">' + ['Material samples reviewed against specification', 'Shop drawings coordinated for execution', 'Site inspection — quality standards', 'Technical and design issues resolved', 'Detail managed through to handover'].map(function (c) { return '<div class="check"><i></i><span>' + c + '</span></div>'; }).join('') + '</div>' + stag('Representative checklist format', x, y + 45); },
    function (x, y) {
      return crop('projects/arched-retreat-01.webp', '0,0,1800,1005', x, y, 55, 31) + crop('projects/arched-retreat-01.webp', '400,560,480,372', x + 60, y, 40, 31) +
        cap('<b>Render</b>Reception hall, Fig. 01', x, y + 31.5, 55) + cap('<b>Detail</b>Counter and floor', x + 60, y + 31.5, 40) + stag('From render to detail · An arched retreat', x, y + 45);
    }
  ];
  var a = document.getElementById('expA'), b = document.getElementById('expB');
  if (a) a.outerHTML = [0, 1, 2, 3].map(function (i) { return row(i, 15, 69 + i * 49.5, 49.5, S[i]); }).join('');
  if (b) b.outerHTML = [4, 5, 6].map(function (i, k) { return row(i, 20, 24 + k * 63, 63, S2[k]); }).join('');
})();
/* Skyline suite: palette cut from the project's own material board (Fig. 06), labels as on the board. */
(function () {
  var el = document.getElementById('boardstrip'); if (!el) return;
  var BS = [['Wall panelling', 'Walnut, vertical grain', '120,260,160,160'], ['Flooring', 'Dark oak hardwood', '120,660,160,160'], ['Headboard', 'Taupe velvet', '720,230,160,160'], ['Bedding', 'Beige linen', '700,470,140,140'],
    ['Curtains', 'Gold-beige drapery', '960,450,160,160'], ['Rug', 'Cream shag pile', '700,660,160,160'], ['Bench', 'Dark brown leather', '1240,350,140,140'], ['Accent pillow', 'Woven brown leather', '1580,540,140,140']];
  el.outerHTML = BS.map(function (b, i) {
    var x = 15 + (i % 4) * 45, y = 141 + Math.floor(i / 4) * 27;
    return '<div class="crop" data-img="projects/skyline-suite-06.webp" data-r="' + b[2] + '" style="left:' + x + 'mm; top:' + y + 'mm; width:15mm; height:15mm"></div>' +
      '<div class="abs cap" style="left:' + (x + 17.5) + 'mm; top:' + (y + 1.5) + 'mm; width:25mm"><b style="display:block; margin:0">' + b[0] + '</b>' + b[1] + '</div>';
  }).join('');
})();
