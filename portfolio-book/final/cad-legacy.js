/* Legacy representative + skyline drawings, re-expressed through cad-adapter.js (CAD v2 standard). */
(function () {
  'use strict';
  var P = window.CAD, C = P.C, W = P.W;
  /* ================= PROJECT DRAWING — The skyline suite ================= */
  // DD-04 · Wardrobe module elevation, traced from Fig. 04 (one two-door bay).
  P.wardrobeModule = function (w, h, dark) {
    P.theme(dark);
    var x0 = 555, x1 = 845, y0 = 40, y1 = 940, pad = 14, top = 12, dh = h - 30;
    var k = Math.min((w - pad * 2 - 16) / (x1 - x0), dh / (y1 - y0));
    var X = function (px) { return pad + (px - x0) * k; }, Y = function (py) { return top + (py - y0) * k; };
    var R = function (a, b, c, d, o) { return P.rect(X(a), Y(b), (c - a) * k, (d - b) * k, o); };
    var D2 = window.CAD2, s = D2.R(X(548), Y(45) - 4, X(852) - X(548), 4, { hatch: 'gyp', w: W.med }) + D2.R(X(548), Y(935), X(852) - X(548), 3.5, { hatch: 'conc', w: W.med }) + D2.level(X(548) - 1.5, Y(935), 'FFL ±0.00', 'end') + D2.level(X(548) - 1.5, Y(45) - 4, 'CL — to survey', 'end') + R(560, 45, 840, 935, { w: W.heavy }) + R(572, 60, 698, 920, { w: W.thin }) + R(704, 60, 828, 920, { w: W.thin });
    s += P.line(X(575), Y(282), X(825), Y(282), W.med) + P.line(X(578), Y(287), X(822), Y(287), W.thin, C.bronze, '1 .4');
    s += P.line(X(580), Y(300), X(820), Y(300), W.thin, C.mid);
    s += R(578, 690, 822, 752, { w: W.thin }) + R(578, 758, 822, 820, { w: W.thin });
    s += P.line(X(578), Y(832), X(822), Y(832), W.med) + P.line(X(580), Y(836), X(820), Y(836), W.thin, C.bronze, '1 .4');
    s += P.line(X(690), Y(450), X(690), Y(500), W.med) + P.line(X(712), Y(450), X(712), Y(500), W.med);
    s += P.line(X(572), Y(60), X(698), Y(920), W.hair, C.light) + P.line(X(704), Y(60), X(828), Y(920), W.hair, C.light);
    s += P.tag(X(640), Y(287), X(640), Y(250), '1') + P.tag(X(760), Y(300), X(760), Y(340), '2') + P.tag(X(640), Y(720), X(640), Y(720), '3') + P.tag(X(760), Y(836), X(760), Y(880), '4') + P.tag(X(701), Y(475), X(701), Y(560), '5');
    s += P.dim(X(560), Y(45), X(560), Y(935), 'Floor to ceiling', -5) + P.dim(X(560), Y(935), X(840), Y(935), 'Two-door bay', 5);
    s += P.titleBlock(0, h - 10, w, { title: 'Wardrobe bay — elevation', status: 'Design development diagram', ref: 'DD-04', scale: 'NTS', source: 'Traced from Fig. 04' });
    var out = P.svg(w, h, s);
    P.theme(false);
    return out;
  };

  /* ================= REPRESENTATIVE EXAMPLES (no project) ================= */
  // RD-02 · Suspended gypsum ceiling with lighting cove — section.
  P.ceilingDetail = function (w, h, mini) {
    var s = '', sc = mini ? (typeof mini === 'number' ? mini : .52) : 1, ox = 4, oy = 4;
    function R(x, y, ww, hh, o) { return P.rect(ox + x * sc, oy + y * sc, ww * sc, hh * sc, o); }
    function L(x1, y1, x2, y2, ww, c, d) { return P.line(ox + x1 * sc, oy + y1 * sc, ox + x2 * sc, oy + y2 * sc, ww, c, d); }
    s += R(0, 0, 100, 12, { fill: P.fill('dot'), w: W.cut });                         // slab
    s += R(0, 12, 8, 62, { fill: P.fill('cc'), w: W.cut });                           // wall
    [22, 50, 80].forEach(function (x) { s += L(x, 12, x, 40, W.thin, C.mid); });       // hangers
    s += R(8, 30, 34, 4, { fill: P.fill('st'), w: W.med });                            // bulkhead soffit
    s += R(38, 30, 4, 14, { fill: P.fill('st'), w: W.med });                           // bulkhead drop
    s += R(42, 40, 58, 3.4, { fill: P.fill('st'), w: W.med });                         // main ceiling
    s += R(42, 43.4, 9, 1.6, { w: W.thin });                                           // cove lip
    s += R(44, 38.2, 5, 1.4, { fill: C.bronze, stroke: 'none' });                      // LED strip
    s += L(46.5, 38, 70, 20, W.fine, C.bronze, '1 .6') + L(46.5, 38, 90, 30, W.fine, C.bronze, '1 .6');
    s += R(8, 34, 3, 6, { fill: C.tint, w: W.thin });                                  // cornice/shadow
    if (!mini) {
      s += P.dim(ox + 100 * sc, oy + 12 * sc, ox + 100 * sc, oy + 40 * sc, '300', 5) + P.dim(ox + 100 * sc, oy + 40 * sc, ox + 100 * sc, oy + 43.4 * sc, '12.5', 5);
      s += P.dim(ox + 38 * sc, oy + 30 * sc, ox + 38 * sc, oy + 44 * sc, '150', -6);
      s += P.label(ox + 60, oy + 6, ox + 64, oy + 22, 'Structural slab');
      s += P.label(ox + 22, oy + 26, ox + 28, oy + 20, 'Hanger + main channel');
      s += P.label(ox + 46.5, oy + 38.9, ox + 58, oy + 58, 'LED strip, warm white, in cove');
      s += P.label(ox + 70, oy + 41.7, ox + 76, oy + 66, 'Gypsum board ceiling, painted');
      s += P.label(ox + 9.5, oy + 37, ox + 16, oy + 62, 'Shadow gap to wall');
      s += P.titleBlock(0, h - 10, w, { title: 'Lighting cove — ceiling section', status: 'Representative detail', ref: 'RD-02', scale: '1:10 typical' });
    }
    return P.svg(w, h, s);
  };

  // RE-01 · Plan fragment with dimension chains, grid, door and finish tags.
  P.planFragment = function (w, h) {
    var s = '', X = 12, Y = 12, t = 2.4, A = w - 22, B = h - 44;
    s += P.grid(X - 6, Y - 7, X + A, Y + B, [[X, '1'], [X + A * .55, '2'], [X + A, '3']], [[Y, 'A'], [Y + B, 'B']]);
    s += P.rect(X, Y, A, t, { fill: C.ink, stroke: 'none' }) + P.rect(X, Y, t, B, { fill: C.ink, stroke: 'none' }) + P.rect(X, Y + B - t, A, t, { fill: C.ink, stroke: 'none' });
    s += P.rect(X + A * .55 - 1, Y, 2, B * .55, { fill: P.fill('cc'), w: W.thin });
    s += P.rect(X + A * .55 - 1, Y + B * .55 + 11, 2, B * .45 - 11, { fill: P.fill('cc'), w: W.thin });
    s += P.line(X + A * .55, Y + B * .55, X + A * .55 + 11, Y + B * .55, W.thin) + P.path('M' + (X + A * .55 + 11) + ' ' + (Y + B * .55) + ' A11 11 0 0 1 ' + (X + A * .55) + ' ' + (Y + B * .55 + 11), { w: W.hair, stroke: C.mid, dash: '1 .6' });
    s += P.dim(X, Y + B, X + A * .55, Y + B, '4 200', 6) + P.dim(X + A * .55, Y + B, X + A, Y + B, '3 450', 6);
    s += P.dim(X, Y, X, Y + B, '5 100', -6);
    s += P.rect(X + 5, Y + 12, A * .55 - 9, 9, { w: W.thin, fill: C.paper }) + P.caps(X + 7, Y + 16.2, 'Living', { size: 2.45 }) + P.text(X + 7, Y + 19.6, 'FL-01', { size: 2.45, fill: C.mid });
    s += P.rect(X + A * .55 + 4, Y + 12, A * .45 - 7, 9, { w: W.thin, fill: C.paper }) + P.caps(X + A * .55 + 6, Y + 16.2, 'Study', { size: 2.45 }) + P.text(X + A * .55 + 6, Y + 19.6, 'FL-02', { size: 2.45, fill: C.mid });
    s += P.titleBlock(0, h - 10, w, { title: 'Plan fragment — dimensioning', status: 'Representative example', ref: 'RE-01', scale: '1:50' });
    return P.svg(w, h, s);
  };

  // RE-02 · Joinery shop-drawing sheet: wardrobe elevation + section + material codes.
  P.joinerySheet = function (w, h) {
    var s = '', ex = 10, ey = 10, EW = 64, EH = h - 40;
    s += P.rect(ex, ey, EW, EH, { w: W.heavy });
    [0, 1, 2].forEach(function (i) { s += P.rect(ex + 2 + i * (EW - 4) / 3, ey + 2, (EW - 4) / 3 - 1.5, EH - 16, { w: W.thin }); s += P.line(ex + 2 + i * (EW - 4) / 3 + ((EW - 4) / 3 - 1.5) - 2.5, ey + EH * .42, ex + 2 + i * (EW - 4) / 3 + ((EW - 4) / 3 - 1.5) - 2.5, ey + EH * .52, W.med); });
    s += P.rect(ex + 2, ey + EH - 13, EW - 4, 11, { w: W.thin, fill: P.fill('tim') });
    s += P.line(ex + 3, ey + 16, ex + EW - 3, ey + 16, W.thin, C.bronze, '1 .4');
    s += P.dim(ex, ey + EH, ex + EW, ey + EH, '2 400', 6) + P.dim(ex, ey, ex, ey + EH, '2 750', -6);
    s += P.dim(ex + 2, ey + EH, ex + 2 + (EW - 4) / 3 - 1.5, ey + EH, '780', 11);
    // section
    var sx = ex + EW + 18, SW = 22;
    s += P.rect(sx, ey, SW, EH, { w: W.cut }) + P.rect(sx + 2, ey + 2, SW - 4, EH - 16, { w: W.thin, fill: C.tint2 }) + P.rect(sx + 2, ey + EH - 13, SW - 4, 11, { w: W.thin, fill: P.fill('tim') });
    s += P.line(sx + 3, ey + 16, sx + SW - 3, ey + 16, W.med) + P.circle(sx + SW / 2, ey + 22, 1, { w: W.thin }) + P.line(sx + SW / 2, ey + 22, sx + SW / 2, ey + 23.5, W.thin);
    s += P.rect(sx - 1.2, ey + 2, 1.2, EH - 16, { fill: C.mid, stroke: 'none' });
    s += P.dim(sx, ey + EH, sx + SW, ey + EH, '600', 6);
    s += P.marker(ex + EW + 8, ey + EH / 2, 'S1', 0);
    // codes
    var cx = sx + SW + 8;
    [['WD-01', 'Walnut veneer, matt lacquer'], ['GL-01', 'Tinted glass, 6 mm, in frame'], ['HW-01', 'Pull handle, brushed finish'], ['LT-01', 'LED strip, warm white, in rail'], ['WD-02', 'Carcass, veneered board']].forEach(function (c, i) {
      s += P.rect(cx, ey + 2 + i * 9, 13.5, 5.6, { w: W.thin }) + P.caps(cx + 1.2, ey + 5.9 + i * 9, c[0], { size: 2.45, weight: 600, ls: .12 }) + P.text(cx + 15.5, ey + 5.9 + i * 9, c[1], { size: 2.5 });
    });
    s += P.caps(cx, ey + 56, 'Notes', { size: 2.45, fill: C.mid });
    ['All dimensions in mm — verify on site', 'Veneer grain continuous across doors', 'LED driver in accessible void'].forEach(function (n, i) { s += P.text(cx, ey + 60 + i * 4, (i + 1) + '. ' + n, { size: 2.5 }); });
    s += P.titleBlock(0, h - 10, w, { title: 'Wardrobe — shop drawing format', status: 'Representative example', ref: 'RE-02', scale: '1:20 typical' });
    return P.svg(w, h, s);
  };

  // Coordination diagram (from CV: clients, consultants, contractors, suppliers, workshops & factories, site teams)
  P.coordination = function (w, h, nodes) {
    var cx = w / 2, cy = h / 2 - 1, R = Math.min(w, h) * .38, s = '';
    s += P.circle(cx, cy, 8.5, { fill: C.tint, stroke: C.bronze, w: W.med });
    s += P.text(cx, cy - .6, 'Design &', { anchor: 'middle', size: 2.6, serif: true }) + P.text(cx, cy + 2.4, 'coordination', { anchor: 'middle', size: 2.6, serif: true });
    nodes.forEach(function (n, i) {
      var ang = -Math.PI / 2 + i * 2 * Math.PI / nodes.length, x = cx + Math.cos(ang) * R * 1.15, y = cy + Math.sin(ang) * R;
      s += P.line(cx + Math.cos(ang) * 8.5, cy + Math.sin(ang) * 8.5, x - Math.cos(ang) * 3, y - Math.sin(ang) * 3, W.thin, C.mid);
      s += P.circle(x, y, 1.2, { fill: C.bronze, stroke: 'none' });
      s += P.text(x + (Math.cos(ang) > .2 ? 2.2 : Math.cos(ang) < -.2 ? -2.2 : 0), y + (Math.abs(Math.cos(ang)) <= .2 ? (Math.sin(ang) < 0 ? -2 : 3.6) : .8), n, { anchor: Math.cos(ang) > .2 ? 'start' : Math.cos(ang) < -.2 ? 'end' : 'middle', size: 2.5 });
    });
    return P.svg(w, h, s);
  };

  // Drawing conventions legend (line weights, hatches, symbols)
  P.conventions = function (w, h) {
    var s = '', col = w / 4;
    s += P.caps(0, 3, 'Line weights', { size: 2.45, fill: C.mid });
    [['Cut', W.cut], ['Heavy', W.heavy], ['Medium', W.med], ['Fine', W.fine]].forEach(function (l, i) { s += P.line(0, 8 + i * 5, 14, 8 + i * 5, l[1]) + P.text(17, 8.8 + i * 5, l[0] + ' · ' + l[1] + ' mm', { size: 2.5 }); });
    s += P.caps(col, 3, 'Hatches', { size: 2.45, fill: C.mid });
    [['cc', 'Masonry / wall'], ['dot', 'Concrete / gypsum'], ['tim', 'Timber / board'], ['up', 'Upholstery'], ['st', 'Stone / marble']].forEach(function (x, i) { s += P.rect(col, 5.5 + i * 4.4, 8, 3.2, { fill: P.fill(x[0]), w: W.fine }) + P.text(col + 10, 8 + i * 4.4, x[1], { size: 2.5 }); });
    s += P.caps(col * 2, 3, 'Symbols', { size: 2.45, fill: C.mid });
    s += P.marker(col * 2 + 6, 10, 'E1', 0) + P.text(col * 2 + 14, 10.8, 'Elevation / section', { size: 2.5 });
    s += P.bubble(col * 2 + 6, 21, 'A', 2.2) + P.text(col * 2 + 14, 21.9, 'Grid reference', { size: 2.5 });
    s += window.CAD2.key(col * 2 + 6, 31, col * 2 + 6, 31, '3') + P.text(col * 2 + 14, 32, 'Finish / note key', { size: 2.5 });
    s += P.caps(col * 3, 3, 'Dimensioning', { size: 2.45, fill: C.mid });
    s += P.dim(col * 3, 12, col * 3 + 34, 12, '1 200', -1) + P.text(col * 3, 20, 'mm, to finished faces', { size: 2.5 }) + P.text(col * 3, 24, 'CH = clear ceiling height', { size: 2.5 }) + P.text(col * 3, 28, 'NTS = not to scale', { size: 2.5 });
    return P.svg(w, h, s);
  };

  // Pointed-arch opening elevation (cover and arched-retreat studies)
  P.archElevation = function (w, h, o) {
    o = o || {};
    var s = '', cx = w / 2, ow = w * (o.open || .62), spring = h * (o.spring || .34), base = h - (o.foot || 4), x0 = cx - ow / 2, x1 = cx + ow / 2, r = ow * .82;
    var apexY = spring - Math.sqrt(r * r - (r - ow / 2) * (r - ow / 2));
    var arch = 'M' + x0 + ' ' + base + ' L' + x0 + ' ' + spring + ' A' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + apexY + ' A' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + spring + ' L' + x1 + ' ' + base;
    var rv = o.reveal || 3.2, R2 = r + rv, ax0 = x0 - rv, ax1 = x1 + rv, apex2 = spring - Math.sqrt(R2 * R2 - (R2 - ow / 2 - rv) * (R2 - ow / 2 - rv));
    s += P.path('M' + ax0 + ' ' + base + ' L' + ax0 + ' ' + spring + ' A' + R2 + ' ' + R2 + ' 0 0 1 ' + cx + ' ' + apex2 + ' A' + R2 + ' ' + R2 + ' 0 0 1 ' + ax1 + ' ' + spring + ' L' + ax1 + ' ' + base, { w: W.thin, stroke: C.mid });
    s += P.path(arch, { w: W.heavy });
    s += P.line(cx, apexY, cx, base, W.thin) + P.line(x0, spring + (base - spring) * .45, x1, spring + (base - spring) * .45, W.thin);
    s += P.line(x0, spring, x1, spring, W.hair, C.light, '2 1');
    s += P.line(cx, apexY - 6, cx, base + 3, W.hair, C.bronze, '3 1 .6 1');
    s += P.line(x0 - 8, base, x1 + 8, base, W.cut);
    if (o.dims !== false) {
      s += P.dim(x0, base, x1, base, o.wLabel || 'Opening', 5);
      s += P.dim(x1, spring, x1, base, o.hLabel || 'Springing', 6) + P.dim(x0, apexY, x0, base, o.aLabel || 'Apex', -6);
    }
    return P.svg(w, h, s);
  };



})();
