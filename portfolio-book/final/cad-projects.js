/*
 * Project drawings for the full book (extends cad.js → window.CAD).
 *
 * AUTHENTICITY RULE (same as cad.js): every drawing here is a reading of the
 * named render, drawn to explain design intent — never a survey, never a
 * construction document. Traced drawings take their proportions from the render's
 * pixels (perspective included), so dimension chains are named, not measured.
 * Each carries its status in its title block.
 */
(function () {
  'use strict';
  var P = window.CAD, C = P.C, W = P.W;

  // Maps a pixel window of a render onto a drawing area (mm), keeping proportion.
  function tracer(x0, y0, x1, y1, w, h, o) {
    o = o || {};
    var pl = o.pad === undefined ? 6 : o.pad, pt = o.top === undefined ? 6 : o.top, reserve = o.reserve === undefined ? 18 : o.reserve - 8;
    var k = Math.min((w - pl * 2) / (x1 - x0), (h - pt - reserve) / (y1 - y0));
    var off = o.center ? (w - (x1 - x0) * k) / 2 : pl;
    var T = { k: k };
    T.X = function (px) { return off + (px - x0) * k; };
    T.Y = function (py) { return pt + (py - y0) * k; };
    T.R = function (a, b, c, d, st) { return P.rect(T.X(a), T.Y(b), (c - a) * k, (d - b) * k, st); };
    T.L = function (a, b, c, d, ww, col, dash) { return P.line(T.X(a), T.Y(b), T.X(c), T.Y(d), ww, col, dash); };
    return T;
  }
  // Interior elevation frame (CAD v2): ceiling build-up, floor slab, level datums.
  function bands(xL, xR, yC, yF, o) {
    o = o || {}; var D = window.CAD2, s = '';
    if (yC !== null) s += D.R(xL, yC - 4, xR - xL, 4, { hatch: 'gyp', w: D.W.sec }) + D.L(xL, yC, xR, yC, D.W.cut) + D.level(xL - 1.5, yC - 4, o.cl || 'CL — to survey', 'end');
    s += D.R(xL, yF, xR - xL, 3.5, { hatch: o.ground ? 'conc' : 'conc', w: D.W.sec }) + D.L(xL, yF, xR, yF, D.W.cut) + D.level(xL - 1.5, yF, o.ffl || 'FFL ±0.00', 'end');
    return s;
  }
  // Pointed (or round, rise = span/2) arch: opening outline from base, up the jambs, over the apex.
  function archD(x0, x1, spring, apex, base) {
    var s = x1 - x0, rise = spring - apex, r = (s * s / 4 + rise * rise) / s, cx = (x0 + x1) / 2;
    return 'M' + x0 + ' ' + base + ' L' + x0 + ' ' + spring + ' A' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + apex + ' A' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + spring + ' L' + x1 + ' ' + base;
  }
  P.archD = archD;
  function coursing(x0, y0, x1, y1, step, T) { // stone coursing as fine joints
    var s = '';
    for (var y = y0 + step; y < y1; y += step) s += P.line(x0, y, x1, y, W.hair, C.light);
    return s;
  }
  function glow(x, y, r) { return P.circle(x, y, r, { stroke: C.bronze, w: W.hair, dash: '.6 .6' }) + P.circle(x, y, r * .45, { stroke: C.bronze, w: W.hair }); }
  function led(x1, y1, x2, y2) { return P.line(x1, y1, x2, y2, W.med, C.bronze, '1.4 .5'); }

  /* ================= 01 · AN ARCHED RETREAT ================= */

  // DD-A1 · End wall of the all-day dining space, traced from Fig. 03.
  P.arcadeWall = function (w, h) {
    var T = tracer(470, 40, 1340, 665, w, h, { center: true, pad: 16, top: 10 }), X = T.X, Y = T.Y, s = bands(X(470), X(1340), Y(45), Y(660));
    s += T.R(480, 45, 1330, 660, { fill: 'none', w: W.thin, stroke: C.mid });
    s += coursing(X(480), Y(45), X(1330), Y(660), 42 * T.k);
    // piers and arches (filled paper over coursing)
    [[550, 700, 290, 165], [800, 1010, 250, 105], [1110, 1260, 290, 165]].forEach(function (a, i) {
      var d = archD(X(a[0]), X(a[1]), Y(a[2]), Y(a[3]), Y(660));
      s += P.path(archD(X(a[0]) - 2.2, X(a[1]) + 2.2, Y(a[2]), Y(a[3]) - 2.6, Y(660)), { w: W.thin, stroke: C.ink, fill: C.paper });
      s += P.path(d, { w: W.heavy, fill: C.tint2 });
      s += P.path(archD(X(a[0]) + 2, X(a[1]) - 2, Y(a[2]) + 3, Y(a[3]) + 6, Y(660)), { w: W.fine, stroke: C.mid });
      s += P.line(X(a[0]), Y(a[2]), X(a[1]), Y(a[2]), W.hair, C.light, '2 1');
    });
    // artwork and chandelier in the central arch
    s += T.R(840, 425, 960, 560, { w: W.thin, fill: P.fill('dot') });
    [[835, 335, 970, 365], [850, 365, 955, 395], [868, 395, 937, 425], [885, 425, 920, 445]].forEach(function (r) { s += T.R(r[0], r[1], r[2], r[3], { w: W.thin, stroke: C.bronze }); });
    s += T.L(902, 105, 902, 335, W.hair, C.bronze);
    s += P.line(X(470), Y(660), X(1340), Y(660), W.cut);
    s += P.dim(X(800), Y(660), X(1010), Y(660), 'Central arch', 6) + P.dim(X(1110), Y(660), X(1260), Y(660), 'Side arch', 6) + P.dim(X(550), Y(660), X(700), Y(660), 'Side arch', 6);
    s += P.dim(X(1330), Y(250), X(1330), Y(660), 'To springing', 6);
    s += P.tag(X(905), Y(170), X(1060), Y(120), '1') + P.tag(X(625), Y(230), X(625), Y(120), '2') + P.tag(X(755), Y(500), X(755), Y(500), '3') + P.tag(X(900), Y(500), X(1060), Y(560), '4') + P.tag(X(905), Y(380), X(1060), Y(360), '5');
    s += P.titleBlock(0, h - 10, w, { title: 'Dining — end wall, arcade elevation', status: 'Design development diagram', ref: 'DD-A1', scale: 'NTS', source: 'An arched retreat · traced from Fig. 03' });
    return P.svg(w, h, s);
  };

  // DD-A2 · Arch family — five openings drawn to one span so their proportions compare.
  // Ratios (springing height / span, rise / span) read from the renders, approximate.
  P.archFamily = function (w, h) {
    var A = [['Reception', 'Fig. 01', 1.64, .55], ['Dining', 'Fig. 03', 1.86, .67], ['Pool niche', 'Fig. 05', 1.2, .5], ['Loggia', 'Fig. 06', 1.41, .49], ['Guest room', 'Fig. 07', 1.31, .44]];
    var n = A.length, span = Math.min(w / n * .62, 22), cell = w / n, base = h - 18, s = '';
    var maxH = Math.max.apply(null, A.map(function (a) { return (a[2] + a[3]) * span; }));
    var sc = Math.min(1, (base - 8) / maxH); span *= sc;
    s += P.line(2, base, w - 2, base, W.cut);
    A.forEach(function (a, i) {
      var cx = cell * i + cell / 2, x0 = cx - span / 2, x1 = cx + span / 2, sp = base - a[2] * span, ap = sp - a[3] * span;
      s += P.path(archD(x0 - 1.8, x1 + 1.8, sp, ap - 2.2, base), { w: W.thin, stroke: C.mid });
      s += P.path(archD(x0, x1, sp, ap, base), { w: W.heavy, fill: C.tint2 });
      s += P.line(x0, sp, x1, sp, W.hair, C.bronze, '1.2 .6') + P.line(cx, ap - 4, cx, base + 2, W.hair, C.light, '3 1 .6 1');
      s += P.caps(cx, base + 5.6, a[0], { anchor: 'middle', size: 2.45 }) + P.text(cx, base + 9.2, a[1], { anchor: 'middle', size: 2.45, fill: C.mid });
      s += P.text(cx, base + 12.8, 'H/S ' + (a[2] + a[3]).toFixed(1), { anchor: 'middle', size: 2.45, fill: C.bronze });
    });
    s += P.titleBlock(0, h - 10, w, { title: 'Arch family — one language, five openings', status: 'Design development diagram', ref: 'DD-A2', scale: 'Common span', source: 'An arched retreat · proportions read from Fig. 01–07' });
    return P.svg(w, h, s);
  };

  // DD-A3 · Pool hall back wall with its lighting layers, traced from Fig. 05.
  P.poolWall = function (w, h) {
    var T = tracer(470, 150, 1330, 640, w, h, { center: true, reserve: 26, pad: 16, top: 10 }), X = T.X, Y = T.Y, s = bands(X(470), X(1330), Y(150), Y(630), { ffl: 'Pool deck' });
    s += T.R(560, 190, 1240, 595, { w: W.thin, stroke: C.mid });
    s += coursing(X(560), Y(190), X(1240), Y(595), 36 * T.k);
    // piers of the first arcade bay, both sides
    [[470, 560], [1240, 1330]].forEach(function (p) { s += T.R(p[0], 150, p[1], 595, { fill: C.paper, w: W.heavy }) + T.R(p[0] + 18, 150, p[1] - 18, 595, { w: W.fine, stroke: C.mid }); });
    s += T.L(560, 190, 1240, 190, W.med) + led(X(575), Y(197), X(1225), Y(197));
    // lit mosaic niche
    s += P.path(archD(X(818), X(985), Y(393), Y(310), Y(595)), { w: W.heavy, fill: P.fill('dot'), bbox: [X(818), Y(310), X(985) - X(818), Y(595) - Y(310)] });
    s += T.R(818, 530, 985, 595, { w: W.thin, fill: C.paper }) + T.L(818, 548, 985, 548, W.hair, C.mid) + T.L(818, 566, 985, 566, W.hair, C.mid);
    s += P.path(archD(X(826), X(977), Y(398), Y(322), Y(590)), { w: W.med, stroke: C.bronze, dash: '1.4 .5' });
    // sconces and their glow
    [730, 1068].forEach(function (x) { s += T.R(x - 9, 435, x + 9, 472, { w: W.thin, fill: C.paper }) + glow(X(x), Y(453), 4.2); });
    // pier up-lights
    [515, 1285].forEach(function (x) { s += P.path('M' + X(x) + ' ' + Y(595) + ' L' + (X(x) - 3) + ' ' + Y(430) + ' M' + X(x) + ' ' + Y(595) + ' L' + (X(x) + 3) + ' ' + Y(430), { w: W.hair, stroke: C.bronze, dash: '.8 .6' }) + P.circle(X(x), Y(592), .7, { fill: C.bronze, stroke: 'none' }); });
    // chandelier
    [[768, 205, 1032, 270], [815, 270, 985, 300], [850, 300, 950, 360], [880, 360, 920, 395]].forEach(function (r) { s += T.R(r[0], r[1], r[2], r[3], { w: W.thin, stroke: C.bronze }); });
    // pool coping and water
    s += P.line(X(470), Y(595), X(1330), Y(595), W.cut) + T.R(560, 598, 1240, 630, { w: W.thin, fill: C.tint2 });
    [606, 614, 622].forEach(function (y) { s += T.L(575, y, 1225, y, W.hair, C.mid, '4 2'); });
    s += P.tag(X(900), Y(197), X(1100), Y(172), 'L1') + P.tag(X(900), Y(440), X(1110), Y(410), 'L2') + P.tag(X(1068), Y(453), X(1150), Y(500), 'L3') + P.tag(X(515), Y(520), X(600), Y(520), 'L4') + P.tag(X(700), Y(614), X(700), Y(614), 'L5');
    s += P.titleBlock(0, h - 10, w, { title: 'Pool hall — back wall and lighting layers', status: 'Design development diagram', ref: 'DD-A3', scale: 'NTS', source: 'An arched retreat · traced from Fig. 05' });
    return P.svg(w, h, s);
  };

  // CD-A1 · Concept detail — lit arched niche, vertical section.
  P.nicheDetail = function (w, h) {
    var s = '', x = 8, top = 8, H = h - 22, depth = 16;
    s += P.rect(x, top, 9, H, { fill: P.fill('cc'), w: W.med });                        // wall behind
    s += P.rect(x + 9, top, 3, H, { fill: P.fill('dot'), w: W.thin });                   // mosaic bed
    s += P.rect(x + 12 + depth, top, 8, H * .22, { fill: P.fill('cc'), w: W.cut });       // head over niche
    s += P.rect(x + 12 + depth, top + H * .82, 8, H * .18, { fill: P.fill('cc'), w: W.cut });
    s += P.rect(x + 12, top + H * .82, depth, H * .18, { fill: P.fill('st'), w: W.med }); // stone sill / plinth
    s += P.path('M' + (x + 12 + depth) + ' ' + (top + H * .22) + ' Q ' + (x + 13) + ' ' + (top + H * .22) + ' ' + (x + 12) + ' ' + (top + H * .1), { w: W.med });
    s += P.rect(x + 13, top + H * .82 - 2.4, 6, 2.4, { w: W.thin, fill: C.paper }) + P.rect(x + 13.6, top + H * .82 - 2.9, 4.8, .6, { fill: C.bronze, stroke: 'none' });
    s += P.path('M' + (x + 16) + ' ' + (top + H * .8) + ' L ' + (x + 13) + ' ' + (top + H * .3) + ' M' + (x + 16) + ' ' + (top + H * .8) + ' L ' + (x + 24) + ' ' + (top + H * .35), { w: W.fine, stroke: C.bronze, dash: '1 .6' });
    s += P.rect(x + 12 + depth - 4, top + H * .22, 4, 1.8, { w: W.thin, fill: C.paper }) + P.rect(x + 12 + depth - 3.6, top + H * .22 + 1.8, 3.2, .5, { fill: C.bronze, stroke: 'none' });
    var lx = x + 36;
    s += P.label(x + 4, top + 12, lx, top + 6, 'Masonry wall');
    s += P.label(x + 10.5, top + H * .5, lx, top + H * .44, 'Mosaic on bedding');
    s += P.label(x + 16, top + H * .82 - 1.5, lx, top + H * .66, 'LED up-light at the base');
    s += P.label(x + 26, top + H * .22 + 1, lx, top + H * .26, 'LED in the reveal');
    s += P.label(x + 20, top + H * .9, lx, top + H * .88, 'Stone sill and plinth');
    s += P.dim(x + 12, top + H, x + 12 + depth, top + H, 'Niche depth', 5);
    s += P.titleBlock(0, h - 10, w, { title: 'Lit arched niche — section', status: 'Concept detail', ref: 'CD-A1', scale: 'NTS', source: 'An arched retreat · reads Fig. 05' });
    return P.svg(w, h, s);
  };

  /* ================= 02 · THE SKYLINE SUITE ================= */

  // DD-S1 · Headboard wall, traced from Fig. 01.
  P.skylineHeadboard = function (w, h, dark) {
    if (dark) P.theme(true);
    var T = tracer(830, 120, 1720, 810, w, h, { center: true, pad: 16, top: 10 }), X = T.X, Y = T.Y, s = bands(X(830), X(1720), Y(140), Y(805));
    s += P.line(X(820), Y(805), X(1730), Y(805), W.cut) + T.L(830, 140, 1720, 140, W.thin, C.mid);
    s += T.R(845, 140, 1700, 805, { fill: P.fill('timv'), w: W.med });
    [1000, 1465].forEach(function (x) { s += led(X(x), Y(150), X(x), Y(520)); });
    s += T.R(1008, 150, 1458, 520, { w: W.thin, fill: C.tint2 });
    [1080, 1160, 1240, 1320, 1400].forEach(function (x) { s += T.L(x, 150, x, 520, W.hair, C.mid); });
    s += T.R(878, 520, 1610, 800, { w: W.heavy, fill: P.fill('up') });
    [1010, 1210, 1440].forEach(function (x) { s += T.L(x, 520, x, 648, W.thin); });
    s += T.R(875, 648, 975, 800, { w: W.thin, fill: C.paper }) + T.R(1430, 648, 1585, 800, { w: W.thin, fill: C.paper }) + T.L(875, 700, 975, 700, W.hair) + T.L(1430, 710, 1585, 710, W.hair);
    s += T.R(975, 648, 1430, 800, { w: W.thin, stroke: C.mid, dash: '1 .6', fill: C.paper });
    [950, 1510].forEach(function (x) { s += T.R(x - 18, 548, x + 18, 575, { w: W.thin, fill: C.paper }) + glow(X(x), Y(562), 3.2); });
    s += T.L(1120, 120, 1120, 205, W.hair, C.bronze) + T.R(1015, 205, 1230, 215, { w: W.thin, stroke: C.bronze });
    [1020, 1060, 1100, 1140, 1180, 1225].forEach(function (x, i) { s += T.R(x - 4, 150 + (i % 2) * 40, x + 4, 215 + (i % 2) * 40, { w: W.hair, stroke: C.bronze }); });
    s += P.dim(X(878), Y(805), X(1610), Y(805), 'Upholstered headboard', 6) + P.dim(X(1700), Y(140), X(1700), Y(805), 'Floor to ceiling', 6);
    s += P.tag(X(1600), Y(300), X(1600), Y(300), '1') + P.tag(X(1465), Y(380), X(1520), Y(420), '2') + P.tag(X(1110), Y(600), X(1110), Y(600), '3') + P.tag(X(1510), Y(562), X(1560), Y(620), '4') + P.tag(X(925), Y(730), X(925), Y(730), '5') + P.tag(X(1120), Y(210), X(1300), Y(240), '6');
    s += P.titleBlock(0, h - 10, w, { title: 'Headboard wall — elevation', status: 'Design development diagram', ref: 'DD-S1', scale: 'NTS', source: 'The skyline suite · traced from Fig. 01' });
    var out = P.svg(w, h, s); P.theme(false); return out;
  };

  // DD-S2 · Conceptual space study — reads Fig. 01 (window, headboard) and Fig. 02 (wardrobes).
  P.skylinePlan = function (w, h, dark) {
    if (dark) P.theme(true);
    var s = '', X = 12, Y = 10, RW = w - 22, RH = h - 22, t = 2.2;
    s += P.rect(X - t, Y - t, RW + 2 * t, t, { fill: C.ink, stroke: 'none' }) + P.rect(X - t, Y + RH, RW + 2 * t, t, { fill: C.ink, stroke: 'none' }) + P.rect(X + RW, Y, t, RH, { fill: C.ink, stroke: 'none' });
    // window wall (left): full-height glazing with mullions + curtain
    s += P.rect(X - t, Y, t, RH, { fill: C.paper, w: W.thin });
    for (var i = 1; i < 5; i++) s += P.line(X - t, Y + RH * i / 5, X, Y + RH * i / 5, W.med);
    var d = 'M' + (X + 2) + ' ' + (Y + 2); for (var j = 0; j < Math.floor((RH - 4) / 2.8); j++) d += ' q ' + (j % 2 ? 1 : -1) + ' 1.4 0 2.8';
    s += P.path(d, { stroke: C.mid, w: W.fine });
    // fire feature + lounge chairs by the window
    s += P.rect(X + 4, Y + 6, 5, 26, { fill: P.fill('st'), w: W.thin }) + P.line(X + 6.5, Y + 9, X + 6.5, Y + 29, W.med, C.bronze, '1 .5');
    [[X + 15, Y + 10], [X + 15, Y + 22]].forEach(function (c) { s += P.rect(c[0], c[1], 8, 8, { w: W.thin, rx: 2.4, fill: C.paper }); });
    s += P.rect(X + 11, Y + 6, 18, 28, { dash: '1 .7', w: W.hair, stroke: C.mid });
    // headboard wall (top): panelling + lit recess, bed, bedsides, bench
    var bx = X + RW * .5 - 13;
    s += P.rect(X + 34, Y, RW - 52, 2.4, { fill: P.fill('timv'), w: W.thin }) + P.line(bx - 4, Y + 2.8, bx + 30, Y + 2.8, W.med, C.bronze, '1.4 .5');
    s += P.rect(bx - 8, Y, 42, 3.6, { fill: P.fill('up'), w: W.thin });
    s += P.rect(bx, Y + 3.6, 26, 34, { w: W.heavy, fill: C.paper }) + P.rect(bx + 2, Y + 5.4, 10, 5, { w: W.thin, rx: 1 }) + P.rect(bx + 14, Y + 5.4, 10, 5, { w: W.thin, rx: 1 }) + P.line(bx, Y + 15, bx + 26, Y + 15, W.thin);
    s += P.rect(bx - 8, Y + 3.6, 6.5, 5.5, { w: W.thin, fill: P.fill('st') }) + P.rect(bx + 27.5, Y + 3.6, 6.5, 5.5, { w: W.thin, fill: P.fill('st') });
    s += P.rect(bx + 2, Y + 40, 22, 5, { w: W.thin, fill: P.fill('tim') });
    s += P.rect(bx - 12, Y + 18, 50, 36, { dash: '1.2 .8', w: W.hair, stroke: C.mid });
    s += P.circle(bx + 13, Y + 18, 6, { dash: '1 .7', w: W.fine, stroke: C.bronze });
    // wardrobe run (right wall): glass doors, lit
    var wx = X + RW - 9;
    s += P.rect(wx, Y + 4, 9, RH - 8, { fill: C.tint2, w: W.med });
    for (var k = 1; k < 7; k++) s += P.line(wx, Y + 4 + (RH - 8) * k / 7, X + RW, Y + 4 + (RH - 8) * k / 7, W.thin);
    s += P.line(wx - .8, Y + 5, wx - .8, Y + RH - 5, W.med, C.bronze, '1.4 .5');
    // door (bottom wall)
    var dx = X + RW * .38;
    s += P.rect(dx, Y + RH, 14, t, { fill: C.paper, stroke: 'none' }) + P.line(dx, Y + RH, dx, Y + RH - 14, W.thin) + P.path('M' + dx + ' ' + (Y + RH - 14) + ' A14 14 0 0 1 ' + (dx + 14) + ' ' + (Y + RH), { w: W.hair, stroke: C.mid, dash: '1 .6' });
    s += P.arrow('M' + (dx + 7) + ' ' + (Y + RH - 4) + ' C ' + (dx + 7) + ' ' + (Y + RH - 16) + ' ' + (wx - 8) + ' ' + (Y + RH - 12) + ' ' + (wx - 3) + ' ' + (Y + RH - 20));
    s += P.arrow('M' + (dx + 7) + ' ' + (Y + RH - 4) + ' C ' + (dx + 6) + ' ' + (Y + RH - 18) + ' ' + (X + 30) + ' ' + (Y + 40) + ' ' + (X + 26) + ' ' + (Y + 36));
    s += P.marker(bx + 13, Y + RH - 10, 'E1', -90) + P.marker(bx - 16, Y + RH * .78, 'E2', 0);
    s += P.caps(X + 11, Y + 39, 'Lounge', { size: 2.45, fill: C.bronze }) + P.caps(bx - 12, Y + 58, 'Sleep zone', { size: 2.45, fill: C.bronze }) + P.caps(wx - 2, Y + RH - 3, 'Wardrobe run', { size: 2.45, fill: C.bronze, anchor: 'end' });
    s += P.tag(X - 1, Y + 45, X + 8, Y + 52, '1') + P.tag(X + 6.5, Y + 20, X + 6.5, Y + 20, '2') + P.tag(bx + 13, Y + 25, bx + 36, Y + 48, '3') + P.tag(bx + 13, Y + 42.5, bx + 13, Y + 50, '4') + P.tag(wx + 4.5, Y + RH * .22, wx - 8, Y + RH * .22, '5');
    s += window.CAD2.dimH([X, X + RW], Y + RH + t + 7, Y + RH + t, ['Room width — to survey']) + window.CAD2.dimV([Y, Y + RH], X - t - 6, X - t, ['Room depth — to survey']);
    s += P.titleBlock(0, h - 10, w, { title: 'The skyline suite — layout reading', status: 'Conceptual space study', ref: 'DD-S2', scale: 'NTS', source: 'Reads Fig. 01 + 02 · not a surveyed plan' });
    var out = P.svg(w, h, s); P.theme(false); return out;
  };

  // DD-S3 · Lighting layers — conceptual reflected ceiling (reads Fig. 01, 02, 04).
  P.lightingRCP = function (w, h, dark) {
    if (dark) P.theme(true);
    var s = '', X = 8, Y = 8, RW = w - 16, RH = h - 24;
    s += P.rect(X, Y, RW, RH, { w: W.cut });
    s += P.rect(X + 10, Y + 8, RW - 34, RH - 18, { w: W.med, fill: C.tint2 }) + P.rect(X + 14, Y + 12, RW - 42, RH - 26, { w: W.thin });
    s += P.rect(X + 11.2, Y + 9.2, RW - 36.4, RH - 20.4, { w: W.med, stroke: C.bronze, dash: '1.4 .5' });
    var cx = X + 10 + (RW - 34) / 2, cy = Y + 8 + (RH - 18) * .42;
    s += P.circle(cx, cy, 5.5, { w: W.thin, stroke: C.bronze }) + P.line(cx - 5.5, cy, cx + 5.5, cy, W.hair, C.bronze) + P.line(cx, cy - 5.5, cx, cy + 5.5, W.hair, C.bronze);
    [[X + 5, Y + 5], [X + 5, Y + RH - 5], [X + RW - 28, Y + 4], [X + RW - 28, Y + RH - 4], [X + 5, Y + RH / 2]].forEach(function (p) { s += P.circle(p[0], p[1], 1.1, { w: W.thin }) + P.circle(p[0], p[1], .35, { fill: C.ink, stroke: 'none' }); });
    s += P.line(X + RW - 21, Y + 3, X + RW - 21, Y + RH - 3, W.med, C.bronze, '1.4 .5');
    for (var i = 0; i < 7; i++) s += P.line(X + RW - 20, Y + 5 + i * (RH - 10) / 6, X + RW - 2, Y + 5 + i * (RH - 10) / 6, W.hair, C.mid);
    s += P.line(cx - 16, Y + 1.6, cx + 16, Y + 1.6, W.med, C.bronze, '1.4 .5');
    [cx - 22, cx + 22].forEach(function (x) { s += glow(x, Y + 3.2, 1.8); });
    s += P.tag(X + 11.2, Y + RH * .3, X + 21, Y + RH * .3, 'L1') + P.tag(cx + 4, cy + 3, cx + 15, cy + 13, 'L2') + P.tag(cx + 10, Y + 1.6, cx + 12, Y + 16, 'L3') + P.tag(cx + 22, Y + 3.2, cx + 30, Y + 16, 'L4') + P.tag(X + RW - 21, Y + RH * .7, X + RW - 31, Y + RH * .88, 'L5') + P.tag(X + 5, Y + RH / 2, X + 5, Y + RH / 2 + 9, 'L6');
    s += P.titleBlock(0, h - 10, w, { title: 'Lighting layers — reflected ceiling reading', status: 'Conceptual space study', ref: 'DD-S3', scale: 'NTS', source: 'The skyline suite · reads Fig. 01, 02, 04' });
    var out = P.svg(w, h, s); P.theme(false); return out;
  };

  /* ================= 04 · THE ILLUMINATED VILLA ================= */

  // DD-V1 · Front elevation, traced from Fig. 05 (daylight). o.lights overlays the dusk lighting read from Fig. 02–04.
  P.villaElevation = function (w, h, o) {
    o = o || {};
    if (o.dark) P.theme(true);
    var T = tracer(200, 15, 1800, 850, w, h, { center: true, reserve: 26, pad: 16 }), X = T.X, Y = T.Y, R = T.R, slab = o.dark ? C.light : C.ink, s = bands(X(200), X(1800), null, Y(842), { ffl: 'GL — to survey' });
    s += P.line(X(150), Y(842), X(1800), Y(842), W.cut);
    // left volume — ground floor stone, canopy, upper floor, eave
    s += R(275, 530, 860, 842, { fill: P.fill('cc'), w: W.med }) + R(505, 560, 550, 842, { fill: C.tint2, w: W.thin }) + R(700, 598, 832, 818, { fill: P.fill('timv'), w: W.med });
    s += R(598, 818, 860, 842, { w: W.thin, fill: C.paper });
    s += R(215, 498, 890, 530, { fill: slab, stroke: 'none' }) + R(275, 300, 858, 498, { fill: P.fill('cc'), w: W.med });
    [[355, 562], [660, 858]].forEach(function (sc) { s += R(sc[0], 245, sc[1], 498, { fill: C.paper, w: W.thin }); for (var x = sc[0] + 12; x < sc[1]; x += 16) s += T.L(x, 245, x, 498, W.thin); });
    s += R(213, 228, 858, 250, { fill: slab, stroke: 'none' }) + R(275, 190, 858, 228, { fill: P.fill('cc'), w: W.thin });
    // tall stone tower, glazed slot, fin, recess
    s += R(860, 35, 1135, 842, { fill: P.fill('cc'), w: W.heavy });
    s += R(1135, 135, 1195, 842, { fill: C.tint2, w: W.thin }) + R(1135, 135, 1195, 240, { fill: slab, stroke: 'none' }) + R(1135, 478, 1195, 545, { fill: slab, stroke: 'none' });
    s += R(1195, 20, 1258, 842, { fill: P.fill('cc'), w: W.med }) + R(1258, 130, 1395, 842, { fill: P.fill('cc'), w: W.thin }) + R(1278, 225, 1342, 842, { fill: C.tint2, w: W.thin });
    // right volume
    s += R(1395, 90, 1800, 842, { fill: P.fill('cc'), w: W.med }) + R(1395, 440, 1800, 540, { fill: slab, stroke: 'none' }) + R(1630, 565, 1685, 842, { fill: C.tint2, w: W.thin });
    s += R(1635, 45, 1800, 435, { fill: C.paper, w: W.thin }); for (var x = 1647; x < 1800; x += 16) s += T.L(x, 45, x, 435, W.thin);
    s += R(1360, 20, 1800, 45, { fill: slab, stroke: 'none' });
    if (o.lights) {
      [[213, 252, 858, 252], [215, 532, 890, 532], [1395, 542, 1800, 542], [1360, 47, 1800, 47]].forEach(function (l) { s += led(X(l[0]), Y(l[1]) + .6, X(l[2]), Y(l[3]) + .6); });
      s += led(X(700), Y(840), X(860), Y(840)) + glow(X(766), Y(590), 3);
      [300, 480, 960, 1060, 1450, 1560].forEach(function (x) { s += P.path('M' + X(x) + ' ' + Y(842) + ' L' + (X(x) - 2.6) + ' ' + Y(700) + ' M' + X(x) + ' ' + Y(842) + ' L' + (X(x) + 2.6) + ' ' + Y(700), { w: W.hair, stroke: C.bronze, dash: '.8 .6' }); });
      s += P.tag(X(500), Y(252), X(500), Y(212), 'L1') + P.tag(X(420), Y(532), X(420), Y(575), 'L2') + P.tag(X(766), Y(840), X(766), Y(870), 'L3') + P.tag(X(1060), Y(760), X(1100), Y(720), 'L4');
    } else {
      s += P.tag(X(460), Y(380), X(460), Y(380), '1') + P.tag(X(1000), Y(420), X(1000), Y(420), '2') + P.tag(X(766), Y(700), X(766), Y(700), '3') + P.tag(X(550), Y(514), X(600), Y(470), '4') + P.tag(X(1165), Y(360), X(1165), Y(360), '5');
    }
    s += P.dim(X(275), Y(842), X(860), Y(842), 'Two-storey volume', 6) + P.dim(X(860), Y(842), X(1135), Y(842), 'Stone tower', 6);
    s += P.titleBlock(0, h - 10, w, { title: o.lights ? 'Front elevation — facade lighting strategy' : 'Front elevation — massing and materials', status: 'Design development diagram', ref: o.lights ? 'DD-V2' : 'DD-V1', scale: 'NTS', source: o.lights ? 'Illuminated villa · Fig. 05, light from 02–04' : 'The illuminated villa · traced from Fig. 05' });
    var out = P.svg(w, h, s); P.theme(false); return out;
  };

  // DD-V3 · Conceptual massing — axonometric reading of Fig. 01 (aerial).
  P.villaMassing = function (w, h, dark) {
    if (dark) P.theme(true);
    var s = '', ox = w * .46, oy = h - 34, u = Math.min(w / 120, (h - 34) / 70);
    function pt(x, y, z) { return [ox + (x - y) * .866 * u, oy - ((x + y) * .5 + z) * u]; }
    function poly(ps, st) { return P.path('M' + ps.map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' L') + ' Z', st); }
    function box(x, y, z, dx, dy, dz, tone) {
      var a = pt(x, y, z + dz), b = pt(x + dx, y, z + dz), c = pt(x + dx, y + dy, z + dz), d = pt(x, y + dy, z + dz);
      var e = pt(x + dx, y, z), f = pt(x + dx, y + dy, z), g = pt(x, y + dy, z);
      return poly([b, c, f, e], { fill: tone ? C.tint : C.tint2, w: W.thin }) + poly([d, c, f, g], { fill: C.paper, w: W.thin }) + poly([a, b, c, d], { fill: C.paper, w: W.med });
    }
    s += poly([pt(-6, -6, 0), pt(60, -6, 0), pt(60, 56, 0), pt(-6, 56, 0)], { fill: 'none', w: W.hair, stroke: C.mid, dash: '1.4 .8' });
    s += box(-6, 52, 0, 66, 1.2, 4) + box(58.8, -6, 0, 1.2, 58, 4);                 // boundary walls (back)
    s += box(39, 20, 0, 18, 24, 9) + box(39, 20, 9, 18, 24, 9, 1);                  // second volume
    s += box(30, 22, 0, 9, 22, 23, 1);                                              // stone tower
    s += box(0, 20, 0, 30, 28, 10) + box(0, 16, 10, 30, 32, 10, 1) + box(-1, 15, 20, 32, 34, 1.2); // main volume + eave
    s += box(8, 26, 21.2, 14, 10, 3) + box(24, -4, 0, 20, 14, 5.5);                // roof screen, carport
    s += P.tag.apply(null, pt(15, 20, 15).concat(pt(15, 0, 36), ['1'])) + P.tag.apply(null, pt(34, 22, 18).concat(pt(40, 10, 42), ['2'])) + P.tag.apply(null, pt(48, 20, 12).concat(pt(62, 10, 26), ['3'])) + P.tag.apply(null, pt(34, -4, 5).concat(pt(40, -14, 6), ['4'])) + P.tag.apply(null, pt(15, 31, 24).concat(pt(4, 40, 34), ['5'])) + P.tag.apply(null, pt(-6, 30, 4).concat(pt(-16, 26, 8), ['6']));
    s += P.titleBlock(0, h - 10, w, { title: 'Massing — volumes read from the aerial view', status: 'Conceptual massing study', ref: 'DD-V3', scale: 'NTS', source: 'The illuminated villa · reads Fig. 01' });
    var out = P.svg(w, h, s); P.theme(false); return out;
  };

  // CD-V1 · Concept detail — vertical timber screen with concealed soffit light (plan + section), reads Fig. 04.
  P.screenDetail = function (w, h, dark) {
    if (dark) P.theme(true);
    var s = '', x0 = 6, y0 = 10, half = (w - 18) / 2;
    // section (left)
    var sx = x0 + 6, top = y0 + 4, H = h - 30;
    s += P.caps(x0, y0 - 2, 'Section', { size: 2.45, fill: C.mid });
    s += P.rect(sx, top, 30, 7, { fill: P.fill('dot'), w: W.cut }) + P.rect(sx + 30, top, 6, 11, { fill: C.ink, stroke: 'none' });
    s += P.rect(sx + 18, top + 7, 12, 3, { w: W.thin, fill: C.paper }) + P.rect(sx + 21, top + 10, 6, .8, { fill: C.bronze, stroke: 'none' });
    s += P.path('M' + (sx + 24) + ' ' + (top + 11) + ' L' + (sx + 18) + ' ' + (top + H * .55) + ' M' + (sx + 24) + ' ' + (top + 11) + ' L' + (sx + 31) + ' ' + (top + H * .5), { w: W.fine, stroke: C.bronze, dash: '1 .6' });
    s += P.rect(sx + 22, top + 10, 3, H - 10, { fill: P.fill('timv'), w: W.thin });
    s += P.rect(sx, top + 7, 8, H - 7, { fill: P.fill('cc'), w: W.med });
    s += P.rect(sx + 8, top + 18, 2, H - 26, { fill: C.tint2, w: W.fine });
    s += P.line(sx - 2, top + H, sx + 40, top + H, W.cut);
    s += P.label(sx + 24, top + 10.4, sx + 40, top + 1, 'LED in soffit');
    s += P.label(sx + 23.5, top + H * .3, sx + 40, top + H * .28, 'Timber fin');
    s += P.label(sx + 5, top + H * .45, sx + 40, top + H * .5, 'Stone-clad wall');
    // plan (right)
    var px = x0 + half + 8, py = top + H * .64;
    s += P.caps(px, py - 2, 'Plan — light line behind fins', { size: 2.45, fill: C.mid });
    s += P.rect(px, py + 16, half - 12, 5, { fill: P.fill('cc'), w: W.med });
    for (var i = 0; i < 8; i++) s += P.rect(px + 2 + i * (half - 16) / 7, py + 4, 1.6, 7, { fill: P.fill('tim'), w: W.thin });
    s += P.line(px, py + 13.5, px + half - 12, py + 13.5, W.med, C.bronze, '1.4 .5');
    s += window.CAD2.dimH([px + 2, px + 2 + (half - 16) / 7, px + 2 + 2 * (half - 16) / 7], py + 29, py + 21, ['', '']) + P.text(px + 2 + 2 * (half - 16) / 7 + 3, py + 29.9, 'Fin rhythm — to survey', { size: 2.65 });
    
    s += P.titleBlock(0, h - 10, w, { title: 'Timber screen and soffit light', status: 'Concept detail', ref: 'CD-V1', scale: 'NTS', source: 'The illuminated villa · reads Fig. 04' });
    var out = P.svg(w, h, s); P.theme(false); return out;
  };

  /* ================= 05 · LIVING BY THE GARDEN ================= */

  // DD-G1 · Conceptual space study — open-plan living, dining, fireplace wall, terrace and pool (reads Fig. 01 + 02).
  P.gardenPlan = function (w, h) {
    var s = '', X = 10, Y = 8, RW = w - 20, RH = (h - 22) * .62, t = 2.4, GY = Y + RH + t;
    // room walls
    s += P.rect(X - t, Y - t, RW + 2 * t, t, { fill: C.ink, stroke: 'none' }) + P.rect(X - t, Y, t, RH, { fill: C.ink, stroke: 'none' }) + P.rect(X + RW, Y, t, RH, { fill: C.ink, stroke: 'none' });
    // glazed garden wall (bottom) — sliding panels
    s += P.rect(X, Y + RH, RW, t, { fill: C.paper, w: W.thin });
    for (var i = 1; i < 10; i++) s += P.line(X + RW * i / 10, Y + RH, X + RW * i / 10, Y + RH + t, W.med);
    // zones
    s += P.rect(X + 2, Y + 2, RW * .36, RH - 4, { fill: C.tint2, stroke: 'none' }) + P.rect(X + RW * .4, Y + 2, RW * .58, RH - 4, { fill: C.tint2, stroke: 'none' });
    // kitchen run + island
    s += P.rect(X, Y, RW * .3, 5, { fill: P.fill('timv'), w: W.thin }) + P.rect(X + 4, Y + 11, RW * .22, 6, { fill: P.fill('st'), w: W.thin });
    // dining table + chairs
    var dx = X + 6, dy = Y + RH * .52;
    s += P.rect(dx, dy, RW * .26, 8, { fill: P.fill('tim'), w: W.med });
    for (var c = 0; c < 4; c++) { var cx = dx + 3 + c * (RW * .26 - 6) / 3; s += P.rect(cx - 2, dy - 4.4, 4, 3.4, { w: W.thin, rx: .8 }) + P.rect(cx - 2, dy + 9, 4, 3.4, { w: W.thin, rx: .8 }); }
    // fireplace wall (right) — timber slats + stone + firebox
    s += P.rect(X + RW - 4, Y + 4, 4, RH - 8, { fill: P.fill('timv'), w: W.thin }) + P.rect(X + RW - 5.5, Y + RH * .3, 5.5, RH * .45, { fill: P.fill('st'), w: W.thin }) + P.line(X + RW - 4.8, Y + RH * .34, X + RW - 4.8, Y + RH * .71, W.heavy, C.bronze);
    // living: L-sofa, coffee table, chairs, rug
    var lx = X + RW * .46, ly = Y + RH * .18;
    s += P.rect(lx - 4, ly - 4, RW * .44, RH * .66, { dash: '1.2 .8', w: W.hair, stroke: C.mid });
    s += P.path('M' + lx + ' ' + ly + ' h' + (RW * .34) + ' v' + (RH * .44) + ' h-6 v' + (-(RH * .44 - 6)) + ' h' + (-(RW * .34 - 6)) + ' z', { w: W.heavy, fill: C.paper });
    s += P.rect(lx + 10, ly + 12, RW * .14, RH * .2, { fill: P.fill('tim'), w: W.thin });
    s += P.rect(lx + 2, Y + RH * .66, 8, 8, { w: W.thin, rx: 2.4 }) + P.rect(lx + 14, Y + RH * .7, 8, 8, { w: W.thin, rx: 2.4 });
    s += P.rect(lx + 2, Y + RH - 7, RW * .36, 4.4, { w: W.thin, rx: 1.4, fill: C.paper });
    // terrace, pool, planting, boundary wall
    s += P.rect(X, GY, RW, 12, { fill: P.fill('st'), w: W.thin });
    s += P.rect(X + RW * .22, GY + 14, RW * .56, 12, { fill: C.tint, w: W.med });
    [.08, .16, .86, .93].forEach(function (f, i) { s += P.circle(X + RW * f, GY + 20 + (i % 2) * 3, 3.2 + (i % 2), { w: W.thin, stroke: C.mid, dash: '.8 .5' }) + P.circle(X + RW * f, GY + 20 + (i % 2) * 3, .5, { fill: C.mid, stroke: 'none' }); });
    s += P.rect(X - t, GY + 30, RW + 2 * t, 1.6, { fill: C.mid, stroke: 'none' });
    // views and flow (indoor → outdoor)
    s += P.arrow('M' + (lx + RW * .2) + ' ' + (ly + 10) + ' L' + (lx + RW * .2) + ' ' + (GY + 12));
    s += P.arrow('M' + (dx + RW * .13) + ' ' + (dy + 14) + ' L' + (dx + RW * .2) + ' ' + (GY + 12));
    s += P.marker(lx + RW * .1, ly + 24, 'E1', 180) + P.marker(dx + RW * .13, Y + 25, 'E2', 90);
    s += P.caps(X + 4, Y + RH - 5, 'Kitchen · dining', { size: 2.45, fill: C.bronze }) + P.caps(X + RW - 8, Y + 10, 'Living', { size: 2.45, fill: C.bronze, anchor: 'end' }) + P.caps(X + 3, GY + 8, 'Terrace', { size: 2.45, fill: C.bronze }) + P.caps(X + RW * .5, GY + 21.6, 'Pool', { size: 2.45, fill: C.bronze, anchor: 'middle' });
    s += P.tag(X + RW * .7, Y + RH + 1, X + RW * .7 + 6, Y + RH - 7, '1') + P.tag(X + RW - 2.5, Y + RH * .5, X + RW - 14, Y + RH * .5, '2') + P.tag(dx + 10, dy + 4, dx + 10, dy + 4, '3') + P.tag(lx + 18, ly + 2, lx + 18, ly - 5, '4') + P.tag(X + RW * .15, Y + 14, X + RW * .15, Y + 14, '5');
    s += window.CAD2.dimV([Y, Y + RH], X + RW + t + 5, X + RW + t, ['Room depth — to survey']);
    s += P.titleBlock(0, h - 10, w, { title: 'Living by the garden — layout reading', status: 'Conceptual space study', ref: 'DD-G1', scale: 'NTS', source: 'Reads Fig. 01 + 02 · not a surveyed plan' });
    return P.svg(w, h, s);
  };

  // DD-G2 · Fireplace wall, traced from Fig. 03 (frontal).
  P.fireplaceWall = function (w, h) {
    var T = tracer(0, 0, 1800, 1000, w, h, { center: true, reserve: 32, pad: 16 }), X = T.X, Y = T.Y, R = T.R, s = bands(X(0), X(1800), null, Y(900));
    s += R(0, 0, 175, 575, { fill: P.fill('timv'), w: W.med }) + R(175, 0, 465, 575, { fill: P.fill('timv'), w: W.med });
    s += R(465, 0, 885, 575, { w: W.med, fill: C.paper }); for (var x = 480; x < 885; x += 22) s += T.L(x, 0, x, 575, W.thin);
    s += R(1672, 0, 1800, 575, { w: W.med, fill: C.paper }); for (var x2 = 1685; x2 < 1800; x2 += 22) s += T.L(x2, 0, x2, 575, W.thin);
    s += R(885, 0, 1672, 575, { fill: P.fill('st'), w: W.med }) + T.L(885, 118, 1672, 118, W.thin) + T.L(885, 405, 1672, 405, W.thin);
    s += R(175, 575, 905, 740, { fill: P.fill('timv'), w: W.thin }) + R(1645, 575, 1800, 740, { fill: P.fill('timv'), w: W.thin });
    s += R(905, 575, 1645, 748, { fill: C.ink, stroke: 'none' }) + T.L(940, 730, 1610, 730, W.med, C.bronze);
    s += R(490, 740, 1800, 870, { fill: P.fill('st'), w: W.med });
    s += led(X(180), Y(578), X(900), Y(578)) + led(X(1650), Y(578), X(1800), Y(578)) + led(X(640), Y(874), X(1800), Y(874));
    s += P.line(X(0), Y(900), X(1800), Y(900), W.cut);
    s += P.dim(X(465), Y(900), X(885), Y(900), 'Slatted timber', 6) + P.dim(X(885), Y(900), X(1672), Y(900), 'Travertine field', 6) + P.dim(X(905), Y(900), X(1645), Y(900), 'Linear fireplace', 12);
    s += P.tag(X(90), Y(300), X(90), Y(300), '1') + P.tag(X(675), Y(300), X(675), Y(300), '2') + P.tag(X(1280), Y(260), X(1280), Y(260), '3') + P.tag(X(1275), Y(700), X(1275), Y(640), '4') + P.tag(X(1100), Y(810), X(1100), Y(810), '5') + P.tag(X(400), Y(578), X(400), Y(540), '6');
    s += P.titleBlock(0, h - 10, w, { title: 'Fireplace wall — elevation', status: 'Design development diagram', ref: 'DD-G2', scale: 'NTS', source: 'Living by the garden · traced from Fig. 03' });
    return P.svg(w, h, s);
  };

  // DD-G3 · Indoor / outdoor section — double-height living, clerestory, sliding glazing, terrace, pool, garden wall (reads Fig. 01 + 02).
  P.gardenSection = function (w, h) {
    var s = '', g = h - 20, x0 = 8, ih = Math.min(70, g - 14), rw = w * .46;
    s += P.line(2, g, w - 2, g, W.cut);
    s += P.rect(x0, g - ih - 4, 3, ih + 4, { fill: P.fill('cc'), w: W.med });                            // back wall
    s += P.rect(x0, g - ih - 7, rw + 6, 3, { fill: P.fill('dot'), w: W.cut });                           // roof slab
    s += P.rect(x0 + rw * .55, g - ih - 4, rw * .45 + 3, 5, { w: W.thin, fill: C.paper }) + P.line(x0 + rw * .56, g - ih + 1.4, x0 + rw + 2, g - ih + 1.4, W.med, C.bronze, '1.4 .5'); // bulkhead + cove
    s += P.rect(x0 + rw, g - ih - 4, 3, ih * .36, { fill: C.tint2, w: W.thin });                          // clerestory glazing
    s += P.rect(x0 + rw, g - ih * .6, 3, ih * .6, { fill: C.tint2, w: W.thin }) + P.line(x0 + rw + 1.5, g - ih * .6, x0 + rw + 1.5, g, W.fine); // sliding doors
    s += P.rect(x0 + rw - 1, g - ih * .64, 5, ih * .04 + 1, { fill: P.fill('cc'), w: W.thin });
    s += P.rect(x0 + rw + 3, g - ih * .66, 12, 2, { fill: P.fill('dot'), w: W.thin });                   // overhang
    // furniture silhouettes
    s += P.rect(x0 + 10, g - 5, 22, 5, { w: W.thin, fill: C.paper }) + P.rect(x0 + 10, g - 9, 4, 4, { w: W.thin, fill: C.paper });
    s += P.rect(x0 + 36, g - 3.5, 12, 3.5, { w: W.thin, fill: P.fill('tim') });
    s += P.line(x0 + 28, g - ih - 4, x0 + 28, g - ih + 14, W.hair, C.bronze) + P.circle(x0 + 28, g - ih + 16, 2, { w: W.thin, stroke: C.bronze });
    // outside: terrace, pool, planting, wall
    var ox = x0 + rw + 3;
    s += P.rect(ox, g, 16, 1.6, { fill: P.fill('st'), w: W.thin });
    s += P.path('M' + (ox + 16) + ' ' + g + ' v6 h' + (w * .14) + ' v-6', { w: W.med, fill: C.tint });
    s += P.line(ox + 16, g + 1.2, ox + 16 + w * .14, g + 1.2, W.hair, C.mid, '3 1.5');
    var tx = ox + 20 + w * .14;
    s += P.line(tx, g, tx, g - 26, W.thin, C.mid) + P.path('M' + tx + ' ' + (g - 26) + ' q -6 -1 -9 2 M' + tx + ' ' + (g - 26) + ' q 6 -1 9 2 M' + tx + ' ' + (g - 26) + ' q -3 -4 -7 -4 M' + tx + ' ' + (g - 26) + ' q 3 -4 7 -4', { w: W.thin, stroke: C.mid });
    s += P.rect(w - 7, g - 22, 3, 22, { fill: P.fill('cc'), w: W.med });
    // sun and view lines
    s += P.arrow('M' + (w - 12) + ' ' + (g - ih - 2) + ' L' + (x0 + rw * .7) + ' ' + (g - ih * .7));
    s += P.arrow('M' + (x0 + 20) + ' ' + (g - 14) + ' L' + (tx - 4) + ' ' + (g - 14));
    s += P.caps(x0 + 6, g - 24, 'Double-height living', { size: 2.45, fill: C.bronze }) + P.caps(w - 6, g + 11, 'Terrace · pool · garden', { size: 2.45, fill: C.bronze, anchor: 'end' });
    s += P.tag(x0 + rw + 1.5, g - ih * .8, x0 + rw - 8, g - ih * .9, '1') + P.tag(x0 + rw + 1.5, g - ih * .3, x0 + rw - 8, g - ih * .38, '2') + P.tag(x0 + rw * .8, g - ih + 1.4, x0 + rw * .8, g - ih + 8, '3') + P.tag(ox + 16 + w * .07, g + 3, ox + 16 + w * .07, g + 3, '4');
    s += P.titleBlock(0, h - 10, w, { title: 'Indoor / outdoor section', status: 'Conceptual section study', ref: 'DD-G3', scale: 'NTS', source: 'Living by the garden · reads Fig. 01 + 02' });
    return P.svg(w, h, s);
  };

  /* ================= 06 · THE BURGUNDY SALON ================= */

  // DD-B1 · Feature wall, traced from Fig. 01 — vertical proportions of the double-height wall.
  P.salonWall = function (w, h) {
    var T = tracer(560, 0, 1260, 810, w, h, { center: true, reserve: 32, pad: 16, top: 10 }), X = T.X, Y = T.Y, R = T.R, s = bands(X(560), X(1260), Y(30), Y(805));
    s += T.L(560, 300, 1260, 300, W.med) + P.line(X(560), Y(805), X(1260), Y(805), W.cut);
    s += R(605, 30, 1215, 300, { w: W.thin, stroke: C.mid }) + led(X(620), Y(292), X(1200), Y(292));
    s += R(610, 305, 690, 800, { fill: P.fill('timv'), w: W.med }) + R(1110, 305, 1210, 800, { fill: P.fill('timv'), w: W.med });
    s += R(690, 305, 1110, 800, { fill: P.fill('up'), w: W.heavy });
    for (var x = 700; x < 780; x += 10) s += T.L(x, 305, x, 800, W.thin); for (var x2 = 1020; x2 < 1110; x2 += 10) s += T.L(x2, 305, x2, 800, W.thin);
    [780, 850, 930, 1010].forEach(function (x3) { s += T.L(x3, 305, x3, 800, W.fine, C.mid); });
    [690, 1110].forEach(function (x4) { s += led(X(x4), Y(310), X(x4), Y(795)); });
    s += R(700, 720, 1150, 800, { w: W.thin, stroke: C.mid, dash: '1 .6' });
    s += T.L(900, 0, 900, 190, W.hair, C.bronze);
    [[860, 115], [975, 175], [785, 210], [1030, 195], [810, 260], [885, 240], [945, 250], [900, 310], [950, 325]].forEach(function (c) { s += P.circle(X(c[0]), Y(c[1]), 1.5, { w: W.thin, stroke: C.bronze }); });
    s += P.dim(X(610), Y(805), X(1210), Y(805), 'Feature wall', 6) + P.dim(X(690), Y(805), X(1110), Y(805), 'Velvet field', 12);
    s += P.dim(X(1215), Y(30), X(1215), Y(805), 'Double height', 7) + P.dim(X(560), Y(300), X(560), Y(805), 'Panelled height', -5);
    s += P.tag(X(650), Y(500), X(650), Y(500), '1') + P.tag(X(740), Y(420), X(740), Y(420), '2') + P.tag(X(890), Y(500), X(890), Y(500), '3') + P.tag(X(1110), Y(600), X(1150), Y(640), '4') + P.tag(X(900), Y(292), X(1000), Y(262), '5') + P.tag(X(860), Y(115), X(740), Y(90), '6');
    s += P.titleBlock(0, h - 10, w, { title: 'Feature wall — elevation', status: 'Design development diagram', ref: 'DD-B1', scale: 'NTS', source: 'The burgundy salon · traced from Fig. 01' });
    return P.svg(w, h, s);
  };

  // DD-B2 · Proportion diagram — the wall as a stack of modules (read from Fig. 01).
  P.salonProportion = function (w, h) {
    var s = '', base = h - 16, H = base - 6, Wd = H * (600 / 775), x0 = (w - Wd) / 2, k = Wd / 600;
    function xx(px) { return x0 + (px - 610) * k; } function yy(py) { return base - (805 - py) * k; }
    s += P.rect(xx(610), yy(30), Wd, yy(805) - yy(30), { w: W.thin, stroke: C.mid });
    s += P.rect(xx(690), yy(305), 420 * k, 495 * k, { w: W.heavy, fill: C.tint2 });
    s += P.rect(xx(610), yy(305), 80 * k, 495 * k, { w: W.thin, fill: P.fill('timv') }) + P.rect(xx(1110), yy(305), 100 * k, 495 * k, { w: W.thin, fill: P.fill('timv') });
    s += P.line(xx(690), yy(305), xx(1110), yy(800), W.hair, C.bronze) + P.line(xx(1110), yy(305), xx(690), yy(800), W.hair, C.bronze);
    s += P.line(xx(560), yy(305), xx(1260), yy(305), W.hair, C.bronze, '2 1');
    s += P.text(xx(1215) + 2, yy(170), 'Void', { size: 2.45, fill: C.mid }) + P.text(xx(1215) + 2, yy(560), 'Panelled', { size: 2.45, fill: C.mid });
    return P.svg(w, h, s);
  };

  /* ================= 07 · AN EARTHY WELCOME ================= */

  // DD-M1 · Majlis feature wall, traced from Fig. 01.
  P.majlisWall = function (w, h) {
    var T = tracer(840, 100, 1720, 760, w, h, { center: true, reserve: 32, pad: 16, top: 10 }), X = T.X, Y = T.Y, R = T.R, s = bands(X(840), X(1720), Y(110), Y(740));
    s += T.L(840, 110, 1720, 110, W.med) + P.line(X(840), Y(740), X(1720), Y(740), W.cut);
    s += R(900, 110, 1600, 590, { fill: P.fill('timv'), w: W.med });
    s += R(990, 205, 1445, 590, { fill: P.fill('dot'), w: W.heavy });
    s += led(X(985), Y(200), X(1450), Y(200)) + led(X(985), Y(200), X(985), Y(590)) + led(X(1450), Y(200), X(1450), Y(590));
    s += R(1600, 100, 1710, 740, { fill: C.tint2, w: W.thin }) + T.L(1655, 100, 1655, 740, W.fine);
    s += R(845, 150, 900, 740, { fill: C.tint2, w: W.thin });
    // low perimeter seating on a plinth
    s += R(810, 690, 1575, 720, { fill: P.fill('tim'), w: W.med }) + R(815, 610, 1570, 690, { fill: C.paper, w: W.heavy });
    [1005, 1250].forEach(function (x) { s += T.L(x, 610, x, 690, W.thin); });
    s += R(815, 575, 1570, 612, { fill: C.paper, w: W.thin });
    [[900, 590], [1180, 600], [1400, 605], [1470, 610]].forEach(function (c) { s += R(c[0] - 35, c[1] - 12, c[0] + 35, c[1] + 22, { w: W.thin, fill: C.tint, rx: .6 }); });
    s += R(1565, 690, 1720, 740, { fill: P.fill('tim'), w: W.thin });
    s += P.dim(X(990), Y(740), X(1445), Y(740), 'Lit plaster panel', 6) + P.dim(X(900), Y(740), X(1600), Y(740), 'Oak-clad wall', 12);
    s += P.tag(X(1215), Y(400), X(1215), Y(400), '1') + P.tag(X(1450), Y(400), X(1520), Y(420), '2') + P.tag(X(940), Y(300), X(940), Y(300), '3') + P.tag(X(1300), Y(650), X(1300), Y(650), '4') + P.tag(X(1100), Y(705), X(1100), Y(705), '5') + P.tag(X(1655), Y(300), X(1655), Y(300), '6');
    s += P.titleBlock(0, h - 10, w, { title: 'Majlis — feature wall elevation', status: 'Design development diagram', ref: 'DD-M1', scale: 'NTS', source: 'An earthy welcome · traced from Fig. 01' });
    return P.svg(w, h, s);
  };

  // MS-M1 · Frieze motif — traced as vector (material study, from Fig. 01 + 03).
  P.frieze = function (w, h, o) {
    o = o || {};
    var s = '', mh = h * .44, cy = h / 2, r = mh / 2, step = mh * 1.25, col = o.col || C.bronze, col2 = o.col2 || C.mid;
    function diamond(x, y, rr, fill) { return P.path('M' + x + ' ' + (y - rr) + ' L' + (x + rr) + ' ' + y + ' L' + x + ' ' + (y + rr) + ' L' + (x - rr) + ' ' + y + ' Z', { fill: fill, stroke: 'none' }); }
    s += P.line(0, cy - r - 3, w, cy - r - 3, W.med, col) + P.line(0, cy + r + 3, w, cy + r + 3, W.med, col);
    for (var x = 1.6; x < w; x += 3.2) { s += diamond(x, cy - r - 5.4, .95, col2) + diamond(x, cy + r + 5.4, .95, col2); }
    for (var i = 0, x0 = step / 2; x0 < w - r * .6; i++, x0 += step) {
      var c = i % 2 ? col2 : col, st = r * .28;
      var d = 'M' + x0 + ' ' + (cy - r) + ' L' + (x0 + st) + ' ' + (cy - r + st) + ' L' + (x0 + st) + ' ' + (cy - st) + ' L' + (x0 + r - st) + ' ' + (cy - st) + ' L' + (x0 + r) + ' ' + cy + ' L' + (x0 + r - st) + ' ' + (cy + st) + ' L' + (x0 + st) + ' ' + (cy + st) + ' L' + (x0 + st) + ' ' + (cy + r - st) + ' L' + x0 + ' ' + (cy + r) + ' L' + (x0 - st) + ' ' + (cy + r - st) + ' L' + (x0 - st) + ' ' + (cy + st) + ' L' + (x0 - r + st) + ' ' + (cy + st) + ' L' + (x0 - r) + ' ' + cy + ' L' + (x0 - r + st) + ' ' + (cy - st) + ' L' + (x0 - st) + ' ' + (cy - st) + ' L' + (x0 - st) + ' ' + (cy - r + st) + ' Z';
      s += P.path(d, { fill: c, stroke: 'none' }) + diamond(x0, cy, r * .42, C.paper) + diamond(x0, cy, r * .2, c);
    }
    return P.svg(w, h, s);
  };

  // CD-M1 · Concept detail — lit oak shelf niche (elevation + section), reads Fig. 03.
  P.shelfNiche = function (w, h) {
    var s = '', ex = 6, ey = 8, EW = w * .34, EH = h - 36;
    s += P.caps(ex, ey - 2, 'Elevation', { size: 2.45, fill: C.mid });
    s += P.rect(ex, ey, EW, EH, { fill: P.fill('timv'), w: W.heavy });
    [.36, .7].forEach(function (f) { s += P.rect(ex, ey + EH * f, EW, 2, { fill: P.fill('tim'), w: W.med }) + P.line(ex + 1.5, ey + EH * f + 2.6, ex + EW - 6, ey + EH * f + 2.6, W.med, C.bronze, '1.4 .5'); });
    s += P.line(ex + 1.5, ey + 1.2, ex + EW - 6, ey + 1.2, W.med, C.bronze, '1.4 .5');
    s += P.rect(ex + EW, ey, 5, EH, { fill: P.fill('dot'), w: W.thin });
    var sx = ex + EW + 12, SW = 12;
    s += P.caps(sx, ey - 2, 'Section', { size: 2.45, fill: C.mid });
    s += P.rect(sx, ey, 4, EH, { fill: P.fill('cc'), w: W.med }) + P.rect(sx + 4, ey, 1.8, EH, { fill: P.fill('tim'), w: W.thin });
    [.36, .7].forEach(function (f) {
      var y = ey + EH * f;
      s += P.rect(sx + 5.8, y, SW, 2, { fill: P.fill('tim'), w: W.med }) + P.rect(sx + SW + 1.4, y + 2, 3.4, 1.4, { w: W.thin, fill: C.paper }) + P.rect(sx + SW + 1.8, y + 3.4, 2.6, .5, { fill: C.bronze, stroke: 'none' });
    });
    s += P.label(sx + SW + 3, ey + EH * .36 + 3, sx + SW + 6, ey + EH * .52, 'LED at front edge');
    s += P.label(sx + 12, ey + EH * .7 + 1, sx + SW + 6, ey + EH * .86, 'Oak shelf');
    s += P.titleBlock(0, h - 10, w, { title: 'Lit oak shelf niche', status: 'Concept detail', ref: 'CD-M1', scale: 'NTS', source: 'An earthy welcome · reads Fig. 03' });
    return P.svg(w, h, s);
  };
})();
