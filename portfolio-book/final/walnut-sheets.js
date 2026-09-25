/*
 * Walnut suite — QC drawing set (CAD v2).
 * DD-01 plan reading · DD-02 media wall (traced from Fig. 02) · DD-03 headboard wall (traced from Fig. 01)
 * CD-01 lit shelf section · CD-02 reveal junction (concept details, typical sizes)
 * RE-02 wardrobe shop-drawing format (representative example, typical sizes)
 */
(function () {
  'use strict';
  var D = window.CAD2, W = D.W, T = D.T, INK = D.INK, GREY = D.GREY, LED = D.LED, PAPER = D.PAPER;
  var S = {};

  function tracer(x0, y0, x1, left, top, width) {
    var k = width / (x1 - x0);
    return { k: k, X: function (px) { return left + (px - x0) * k; }, Y: function (py) { return top + (py - y0) * k; } };
  }
  function box(T2, a, b, c, d, o) { return D.R(T2.X(a), T2.Y(b), (c - a) * T2.k, (d - b) * T2.k, o); }
  function curtain(x, y1, y2) { var d = 'M' + x + ' ' + y1, i = 0; for (var y = y1; y < y2; y += 1.2, i++) d += ' L' + (x + (i % 2 ? .8 : -.8)) + ' ' + (y + 1.2); return D.P(d, { w: W.dim, stroke: GREY }); }
  function breakV(x, y1, y2) { var m = (y1 + y2) / 2; return D.P('M' + x + ' ' + y1 + ' V' + (m - 2) + ' l1.4 .9 l-2.8 2.2 l1.4 .9 V' + y2, { w: W.fix, stroke: GREY }); }
  function breakH(x1, x2, y) { var m = (x1 + x2) / 2; return D.P('M' + x1 + ' ' + y + ' H' + (m - 2) + ' l.9 -1.4 l2.2 2.8 l.9 -1.4 H' + x2, { w: W.fix, stroke: GREY }); }

  /* ================= DD-01 · Layout reading (conceptual space study) ================= */
  S.plan = function (w, h) {
    var s = '', cx = 88;
    // structural / reference grid
    s += D.grid(21.5, 9, 21.5, 150) + D.grid(154.5, 9, 154.5, 150) + D.grid(9, 21.5, 168, 21.5) + D.grid(9, 136.5, 168, 136.5);
    s += D.cl(cx, 30, 162, 161);
    // rug and ceiling items first (below)
    s += D.R(50, 48, 76, 58, { w: W.dim, dash: '2.4 1.2', stroke: GREY });
    // walls — cut, solid poche
    [[19, 19, 138, 5], [19, 134, 109, 5], [146, 134, 11, 5], [19, 24, 5, 14], [19, 74, 5, 60], [152, 24, 5, 14], [152, 74, 5, 60]].forEach(function (r) { s += D.R(r[0], r[1], r[2], r[3], { fill: INK, stroke: 'none' }); });
    // windows (west, east): frame, double glazing, sill
    [19, 152].forEach(function (x) {
      s += D.R(x, 38, 5, 36, { w: W.fix, fill: PAPER }) + D.L(x + 2.2, 38, x + 2.2, 74, W.hatch) + D.L(x + 2.8, 38, x + 2.8, 74, W.hatch);
      s += D.L(x, 38, x + 5, 38, W.sec) + D.L(x, 74, x + 5, 74, W.sec);
    });
    s += curtain(26.4, 33, 79) + D.L(25.3, 32, 25.3, 80, W.ref, GREY, '1.2 .8') + curtain(149.6, 33, 79) + D.L(150.7, 32, 150.7, 80, W.ref, GREY, '1.2 .8');
    // door (south-east): jambs, leaf, swing, threshold
    s += D.R(128, 134, 1.2, 5, { w: W.fix, fill: PAPER }) + D.R(144.8, 134, 1.2, 5, { w: W.fix, fill: PAPER });
    s += D.R(143.8, 118.4, 1, 15.6, { w: W.sec, fill: PAPER }) + D.P('M129.2 134 A15.6 15.6 0 0 1 143.8 118.4', { w: W.hatch }) + D.L(129.2, 136.5, 144.8, 136.5, W.ref, GREY);
    // headboard feature wall: walnut panels, lit reveals, channel-upholstered centre
    s += D.R(38, 24, 24, 2, { hatch: 'grainH', w: W.fix }) + D.R(114, 24, 24, 2, { hatch: 'grainH', w: W.fix });
    s += D.L(50, 24, 50, 26, W.hatch) + D.L(126, 24, 126, 26, W.hatch);
    [62, 112].forEach(function (x) { s += D.R(x, 24, 2, 1.4, { w: W.hatch }) + D.R(x + .4, 24.25, 1.2, .5, { fill: LED, stroke: 'none' }); });
    s += D.R(64, 24, 48, 1.1, { hatch: 'ply', w: W.fix });
    var bw = 48 / 7, sc = 'M64 25.1';
    for (var i = 0; i < 7; i++) sc += ' Q' + (64 + bw * (i + .5)).toFixed(2) + ' 28.2 ' + (64 + bw * (i + 1)).toFixed(2) + ' 25.1';
    s += D.P(sc, { w: W.sec, fill: PAPER });
    // bedside tables (stone), lamps
    [55, 111].forEach(function (x) { s += D.R(x, 26.5, 10, 10, { hatch: 'stone', w: W.fix, fill: PAPER }) + D.C(x + 5, 31.5, 2.7, { fill: PAPER }) + D.C(x + 5, 31.5, .7); });
    // bed
    s += D.R(68, 28.4, 40, 52, { w: W.sec, rx: 1, fill: PAPER }) + D.R(70, 30.6, 17, 6, { w: W.fix, rx: 1.4 }) + D.R(89, 30.6, 17, 6, { w: W.fix, rx: 1.4 });
    s += D.L(68, 44, 108, 44, W.fix) + D.R(68, 68, 40, 6, { hatch: 'uph', stroke: 'none' }) + D.L(68, 68, 108, 68, W.hatch) + D.L(68, 74, 108, 74, W.hatch);
    // pendant cluster (above — dashed)
    s += D.C(cx, 52, 7, { w: W.hatch, dash: '1.2 .8' });
    for (var p = 0; p < 7; p++) { var a = p / 7 * Math.PI * 2; s += D.C(cx + Math.cos(a) * 4.2, 52 + Math.sin(a) * 4.2, .9, { w: W.hatch, dash: '.6 .5' }); }
    // media wall joinery (south): tall units, lit niches (above), back panel, stone ledge
    [26, 110].forEach(function (x) { s += D.R(x, 122, 14, 12, { w: W.sec, fill: PAPER }) + D.L(x, 122, x + 14, 134, W.hatch) + D.L(x, 122.8, x + 14, 122.8, W.hatch); });
    s += D.R(40, 130, 70, 4, { hatch: 'grainH', w: W.fix });
    s += D.R(42, 125, 66, 5, { hatch: 'stone', w: W.fix, fill: PAPER });
    s += D.R(40, 126, 10, 4, { dash: '1.2 .8', w: W.hatch }) + D.R(100, 126, 10, 4, { dash: '1.2 .8', w: W.hatch });
    // circulation
    s += D.P('M137 116 C128 100 120 90 116.6 81.5', { w: W.dim, stroke: GREY, dash: '2 1' }) + D.arrowHead(116, 80, -112);
    s += D.P('M135 118 C110 112 64 108 60.4 85', { w: W.dim, stroke: GREY, dash: '2 1' }) + D.arrowHead(60.2, 83, -98);
    // cut line A (through the lit niche) and elevation markers
    s += D.cutLine(45, 117, 45, 139) + D.secMark(45, 111.5, '01', 'CD-01', 180);
    s += D.secMark(cx, 111, 'E1', 'DD-02', 90) + D.secMark(cx, 92, 'E2', 'DD-03', -90);
    // detail reference — reveal junction
    s += D.detailCircle(113, 25.6, 4.4) + D.L(116.6, 28.4, 134.4, 37.4, W.dim) + D.secMark(138, 40, '02', 'CD-02', null);
    // room tag
    s += D.R(27.5, 86, 19.5, 10, { w: W.fix, fill: PAPER }) + D.Tx(37.25, 90.6, 'Bedroom', { caps: true, size: T.note, anchor: 'middle', weight: 600, ls: .12 }) + D.Tx(37.25, 94.4, 'RM 01 · FL-01', { size: T.dim, anchor: 'middle', fill: GREY });
    // keynotes
    s += D.key(44, 25.2, 36, 42, '1') + D.key(79, 27.6, 79, 40.6, '2') + D.key(63, 24.9, 40, 52, '3') + D.key(88, 62, 88, 62, '4');
    s += D.key(118, 34, 140, 52, '5') + D.key(93.4, 47.2, 99, 58.5, '6') + D.key(33, 128, 36, 114, '7') + D.key(70, 127.5, 64, 116.5, '8');
    s += D.key(84, 131.6, 102, 119, '9') + D.key(26.4, 62, 36, 64, '10') + D.key(21.5, 71, 36, 76, '11') + D.key(137.5, 125, 138, 106, '12');
    // dimensions — named, not measured
    s += D.dimH([24, 38, 62, 114, 138, 152], 14, 19, ['Wall', 'Walnut', 'Upholstered centre', 'Walnut', 'Wall']);
    s += D.dimH([26, 40, 50, 100, 110, 124, 128, 146], 146, 139, ['Unit', 'Niche', 'Media wall', 'Niche', 'Unit', '', 'Door']);
    s += D.dimH([24, 152], 155, 139, ['Room width — to survey']);
    s += D.dimV([24, 134], 13, 19, ['Room depth — to survey']);
    // grid bubbles last (on top)
    s += D.bubble(21.5, 5.5, '1') + D.bubble(154.5, 5.5, '2') + D.bubble(5.5, 21.5, 'A') + D.bubble(5.5, 136.5, 'B');
    return D.svg(w, h, s);
  };

  /* ================= DD-02 · E1 media wall, traced from Fig. 02 ================= */
  S.mediaWall = function (w, h) {
    var t = tracer(290, 150, 1640, 20, 17, 130), X = t.X, Y = t.Y, k = t.k, s = '';
    var R = function (a, b, c, d, o) { return box(t, a, b, c, d, o); };
    // ceiling build-up, floor slab, side returns (cut)
    s += D.R(X(275), Y(150) - 5, X(1655) - X(275), 5, { hatch: 'gyp', w: W.sec });
    s += D.R(X(275), Y(790), X(1655) - X(275), 4, { hatch: 'conc', w: W.sec });
    s += D.R(X(275), Y(150), X(290) - X(275), Y(790) - Y(150), { fill: INK, stroke: 'none' }) + D.R(X(1640), Y(150), X(1655) - X(1640), Y(790) - Y(150), { fill: INK, stroke: 'none' });
    s += D.L(X(290), Y(790), X(1640), Y(790), W.cut) + D.L(X(290), Y(150), X(1640), Y(150), W.cut);
    // tall units — two flush leaves each, hinge chevrons, grain
    [[300, 490], [1310, 1500]].forEach(function (u) {
      var m = (u[0] + u[1]) / 2;
      s += R(u[0], 152, u[1], 788, { w: W.major, hatch: 'grainV' }) + D.L(X(m), Y(152), X(m), Y(788), W.fix);
      s += D.P('M' + X(m) + ' ' + Y(160) + ' L' + X(u[0] + 6) + ' ' + Y(470) + ' L' + X(m) + ' ' + Y(780), { w: W.hatch, stroke: GREY, dash: '1.4 .9' });
      s += D.P('M' + X(m) + ' ' + Y(160) + ' L' + X(u[1] - 6) + ' ' + Y(470) + ' L' + X(m) + ' ' + Y(780), { w: W.hatch, stroke: GREY, dash: '1.4 .9' });
    });
    // top panel and light line
    s += R(490, 152, 1310, 215, { w: W.sec, hatch: 'grainV' }) + D.led(X(496), Y(220), X(1304), Y(220));
    // display niches: frame, back panel, shelves with thickness, light under each shelf
    [[500, 590], [1205, 1300]].forEach(function (nn) {
      s += R(nn[0], 225, nn[1], 600, { w: W.sec, hatch: 'grainH' });
      [302, 387, 467].forEach(function (yy) { s += R(nn[0], yy, nn[1], yy + 6, { w: W.fix, fill: PAPER }) + D.led(X(nn[0]) + .6, Y(yy + 10), X(nn[1]) - .6, Y(yy + 10)); });
    });
    [600, 700, 1100, 1200].forEach(function (xx) { s += D.L(X(xx), Y(225), X(xx), Y(600), W.hatch, GREY); });
    s += R(590, 225, 1205, 600, { w: W.fix });
    // media recess: frame, inner reveal, screen (dashed, by others)
    s += R(705, 330, 1095, 560, { w: W.sec, fill: PAPER }) + R(718, 342, 1082, 548, { w: W.fix }) + R(735, 356, 1065, 534, { w: W.hatch, dash: '1.4 .8', stroke: GREY });
    // shadow gap band, stone ledge with light below, recessed plinth
    s += R(490, 600, 1310, 612, { w: W.fix, fill: '#ddd6ca' }) + D.led(X(496), Y(618), X(1304), Y(618));
    s += R(490, 665, 1310, 740, { w: W.major, hatch: 'stone', fill: PAPER }) + D.led(X(496), Y(747), X(1304), Y(747));
    s += D.L(X(490), Y(778), X(1310), Y(778), W.fix) + R(490, 778, 1310, 790, { fill: '#d6cfc3', stroke: 'none' });
    // door: architrave, leaf, handle, hinge chevron
    s += R(1505, 176, 1645, 790, { w: W.fix }) + R(1518, 188, 1632, 790, { w: W.major }) + R(1538, 440, 1546, 500, { w: W.sec, fill: INK });
    s += D.P('M' + X(1520) + ' ' + Y(190) + ' L' + X(1630) + ' ' + Y(490) + ' L' + X(1520) + ' ' + Y(788), { w: W.hatch, stroke: GREY, dash: '1.4 .9' });
    // datums
    s += D.level(X(275) - 1, Y(790), 'FFL ±0.00', 'end') + D.level(X(275) - 1, Y(150) - 5, 'CL — to survey', 'end');
    // section cut through the left niche
    s += D.cutLine(X(545), Y(150) - 6, X(545), Y(226)) + D.secMark(X(545), Y(150) - 11, '01', 'CD-01', 180);
    // keynotes and finish codes
    s += D.key(X(345), Y(600), X(345), Y(600), '7') + D.key(X(760), Y(702), X(760), Y(702), '8') + D.key(X(900), Y(445), X(900), Y(445), '9') + D.key(X(1575), Y(620), X(1575), Y(620), '12');
    s += D.code(X(900), Y(183), X(900) - 7, Y(183), 'WD-01') + D.code(X(1180), Y(702), X(1180) - 7, Y(702), 'ST-01') + D.code(X(1000), Y(618), X(1000) - 7, Y(640), 'LT-01');
    // dimensions (named)
    s += D.dimH([X(300), X(490), X(705), X(1095), X(1310), X(1500), X(1518), X(1632)], Y(790) + 10, Y(790) + 4, ['Tall unit', 'Display', 'Media recess', 'Display', 'Tall unit', '', 'Door']);
    s += D.dimH([X(290), X(1640)], Y(790) + 18, Y(790) + 4, ['Wall length — to survey']);
    s += D.dimV([Y(150), Y(215), Y(600), Y(665), Y(740), Y(790)], X(1655) + 8, X(1655), ['', 'Display zone', '', '', '']);
    s += D.dimV([Y(150), Y(790)], X(1655) + 16, X(1655), ['Floor to ceiling — to survey']);
    return D.svg(w, h, s);
  };

  /* ================= DD-03 · E2 headboard wall, traced from Fig. 01 ================= */
  S.headboard = function (w, h) {
    var t = tracer(470, 175, 1330, 20, 17, 80), X = t.X, Y = t.Y, s = '';
    var R = function (a, b, c, d, o) { return box(t, a, b, c, d, o); };
    s += D.R(X(470), Y(178) - 5, X(1330) - X(470), 5, { hatch: 'gyp', w: W.sec }) + D.R(X(470), Y(790), X(1330) - X(470), 4, { hatch: 'conc', w: W.sec });
    s += D.L(X(470), Y(790), X(1330), Y(790), W.cut) + D.L(X(470), Y(178), X(1330), Y(178), W.cut);
    s += breakV(X(470), Y(178), Y(790)) + breakV(X(1330), Y(178), Y(790));
    // walnut panels with joints and grain
    [[500, 660, 575], [1140, 1310, 1225]].forEach(function (p) { s += R(p[0], 180, p[1], 790, { w: W.major, hatch: 'grainV' }) + D.L(X(p[2]), Y(180), X(p[2]), Y(790), W.fix); });
    // lit reveals
    [[660, 680], [1120, 1140]].forEach(function (r) { s += R(r[0], 185, r[1], 700, { w: W.hatch, fill: '#efe3cf' }) + D.led(X((r[0] + r[1]) / 2), Y(190), X((r[0] + r[1]) / 2), Y(695)); });
    // channel-upholstered centre
    s += R(680, 185, 1120, 700, { w: W.major, hatch: 'uph' });
    for (var i = 1; i < 7; i++) s += D.L(X(680 + i * 440 / 7), Y(185), X(680 + i * 440 / 7), Y(700), W.fix);
    // bedside tables and lamps
    [[480, 640], [1160, 1320]].forEach(function (b) {
      var m = (b[0] + b[1]) / 2;
      s += R(b[0], 700, b[1], 790, { w: W.sec, hatch: 'stone', fill: PAPER }) + D.L(X(b[0]), Y(742), X(b[1]), Y(742), W.fix);
      s += D.P('M' + X(m - 34) + ' ' + Y(660) + ' L' + X(m - 24) + ' ' + Y(612) + ' H' + X(m + 24) + ' L' + X(m + 34) + ' ' + Y(660) + ' Z', { w: W.fix, fill: PAPER }) + D.L(X(m), Y(660), X(m), Y(700), W.sec);
    });
    // bed in front (dashed)
    s += R(560, 690, 1240, 786, { w: W.hatch, dash: '1.6 .9', stroke: GREY });
    // pendant cluster
    s += D.L(X(900), Y(178), X(900), Y(212), W.fix);
    [[745, 255], [800, 225], [860, 262], [915, 238], [975, 215], [1030, 250], [1070, 228]].forEach(function (c) { s += D.L(X(c[0]), Y(212), X(c[0]), Y(c[1]) - 1.3, W.hatch) + D.C(X(c[0]), Y(c[1]), 1.3, { w: W.fix, fill: PAPER }); });
    s += D.L(X(745), Y(212), X(1070), Y(212), W.fix);
    // datums, detail reference, keynotes, codes
    s += D.level(X(470) - 1.5, Y(790), 'FFL ±0.00', 'end') + D.level(X(470) - 1.5, Y(178) - 5, 'CL — to survey', 'end');
    s += D.detailCircle(X(1130), Y(420), 3.6) + D.L(X(1130) + 2.6, Y(420) - 2.6, X(1130) + 8, Y(420) - 9, W.dim) + D.secMark(X(1130) + 11, Y(420) - 12, '02', 'CD-02', null);
    s += D.key(X(580), Y(430), X(580), Y(430), '1') + D.key(X(900), Y(480), X(900), Y(480), '2') + D.key(X(670), Y(560), X(625), Y(560), '3') + D.key(X(560), Y(765), X(560), Y(765), '5') + D.key(X(975), Y(215), X(1010), Y(186) + 1, '6');
    s += D.code(X(1225), Y(600), X(1225) - 7, Y(600), 'WD-01') + D.code(X(800), Y(600), X(800) - 7, Y(600), 'UP-01') + D.code(X(1240), Y(760), X(1240) - 7, Y(760), 'ST-01');
    s += D.dimH([X(500), X(660), X(680), X(1120), X(1140), X(1310)], Y(790) + 10, Y(790) + 4, ['Walnut', '', 'Upholstered centre', '', 'Walnut']);
    s += D.dimV([Y(185), Y(700), Y(790)], X(1330) + 8, X(1330), ['Headboard', '']);
    return D.svg(w, h, s);
  };

  /* ================= CD-01 · Lit display shelf — vertical section (typical sizes) ================= */
  // Drawn at 1 : 5 on the page (1 mm paper = 5 mm); stated as NTS, typical sizes.
  S.shelfSection = function (w, h) {
    var s = '', x0 = 6;
    // blockwork, plaster, battens, back panel, veneer
    s += D.R(x0, 10, 20, 140, { hatch: 'masonry', w: W.cut, fill: PAPER });
    s += D.R(x0 + 20, 10, 2.4, 140, { hatch: 'gyp', w: W.sec });
    [[36, 10], [72, 10], [106, 10], [133, 10]].forEach(function (b) { s += D.batten(x0 + 22.4, b[0], 5, b[1]); });
    s += D.R(x0 + 27.4, 21, 3.6, 129, { hatch: 'mdf', w: W.sec }) + D.L(x0 + 31.2, 21, x0 + 31.2, 150, W.major);
    // niche head with 5 mm shadow gap
    s += D.R(x0 + 27.4, 10, 64.4, 10, { hatch: 'ply', w: W.sec }) + D.L(x0 + 27.4, 20, x0 + 91.8, 20, W.major) + D.R(x0 + 27.4, 20, 4, 1, { fill: INK, stroke: 'none' });
    // shelves: veneered core, solid lipping, recessed LED profile with diffuser
    [40, 110].forEach(function (y) {
      s += D.R(x0 + 31.2, y, 60, 5, { hatch: 'ply', w: W.major, fill: PAPER }) + D.R(x0 + 91.2, y, .7, 5, { fill: INK, stroke: 'none' });
      s += D.R(x0 + 82.2, y + 3.2, 3.6, 1.8, { w: W.fix, fill: PAPER }) + D.R(x0 + 82.5, y + 3.4, 3, .5, { fill: LED, stroke: 'none' }) + D.L(x0 + 82.2, y + 5, x0 + 85.8, y + 5, W.major, LED);
      // concealed steel support, resin-anchored into the blockwork
      s += D.R(x0 + 8, y + 1.8, 63, 1.4, { fill: INK, stroke: 'none' }) + D.L(x0 + 7, y + 1.2, x0 + 7, y + 3.8, W.fix) + D.R(x0 + 6, y + .9, 12, 3.2, { w: W.hatch, dash: '.8 .5' });
      // light spread
      s += D.L(x0 + 84, y + 5.4, x0 + 70, y + 30, W.hatch, LED, '1.2 .8') + D.L(x0 + 84, y + 5.4, x0 + 91, y + 26, W.hatch, LED, '1.2 .8');
    });
    // cable route in the batten void
    s += D.P('M' + (x0 + 82) + ' ' + 44.2 + ' H' + (x0 + 34) + ' M' + (x0 + 25) + ' 47 V92', { w: W.dim, dash: '1 .7', stroke: GREY }) + D.arrowHead(x0 + 25, 94, 90, 1.6);
    s += breakH(x0 - 2, x0 + 34, 9) + breakH(x0 - 2, x0 + 34, 151);
    // dimensions — typical sizes
    s += D.dimH([x0 + 20, x0 + 31.2, x0 + 91.8], 158.5, 151, ['56', '300']);
    s += D.dimH([x0 + 82.2, x0 + 85.8, x0 + 91.8], 32.5, 40, ['17', '30']);
    s += D.dimV([40, 45, 110], x0 + 100, x0 + 92.5, ['25', '325 typ.']);
    // keynotes
    s += D.key(x0 + 10, 62, 60, 56, '1') + D.key(x0 + 21.2, 66, 60, 65, '2') + D.key(x0 + 24.9, 77, 60, 74, '3') + D.key(x0 + 29.2, 86, 60, 83, '4') + D.key(x0 + 31.2, 95, 60, 92, '5');
    s += D.key(x0 + 60, 42.5, 74, 26.5, '7') + D.key(x0 + 88, 42.4, x0 + 101, 23.5, '6') + D.key(x0 + 84, 45, x0 + 102, 58, '8') + D.key(x0 + 25, 80, 60, 101, '9') + D.key(x0 + 30, 20.5, 54, 29, '10');
    return D.svg(w, h, s);
  };

  /* ================= CD-02 · Walnut / lit reveal / upholstery junction — plan section ================= */
  S.revealPlan = function (w, h) {
    var s = '', y0 = 7;
    s += D.R(0, y0 + 26, w, 8, { hatch: 'masonry', w: W.cut, fill: PAPER }) + D.R(0, y0 + 23.6, w, 2.4, { hatch: 'gyp', w: W.sec });
    [8, 48, 88, 128, 162].forEach(function (x) { s += D.batten(x, y0 + 18.6, 10, 5); });
    // walnut panel: MDF + veneer
    s += D.R(0, y0 + 15, 60, 3.6, { hatch: 'mdf', w: W.sec }) + D.L(0, y0 + 14.8, 60, y0 + 14.8, W.major);
    // reveal: veneered returns, recessed LED channel
    s += D.L(60, y0 + 14.8, 60, y0 + 18.6, W.sec) + D.L(72, y0 + 5.4, 72, y0 + 18.6, W.sec);
    s += D.R(63.6, y0 + 15.2, 4.8, 3.4, { w: W.fix, fill: PAPER }) + D.R(64, y0 + 17.4, 4, .6, { fill: LED, stroke: 'none' }) + D.L(63.6, y0 + 15.2, 68.4, y0 + 15.2, W.major, LED);
    s += D.L(66, y0 + 14.6, 58, y0 + 2, W.hatch, LED, '1.2 .8') + D.L(66, y0 + 14.6, 71, y0 + 4, W.hatch, LED, '1.2 .8');
    // upholstered panels: ply base, foam, fabric wrap with channels; 10 mm shadow gap
    [[72, 122], [124, 175]].forEach(function (p) {
      var a = p[0], b = p[1];
      s += D.R(a, y0 + 15, b - a, 3.6, { hatch: 'ply', w: W.fix });
      var d = 'M' + a + ' ' + (y0 + 15) + ' V' + (y0 + 6.4) + ' Q' + a + ' ' + (y0 + 5.4) + ' ' + (a + 1) + ' ' + (y0 + 5.4);
      for (var x = a + 1; x < b - 2; x += 12) { var e = Math.min(x + 12, b - 1); d += ' H' + (e - 1.2) + ' L' + (e - .6) + ' ' + (y0 + 7) + ' L' + e + ' ' + (y0 + 5.4); }
      d += ' Q' + b + ' ' + (y0 + 5.4) + ' ' + b + ' ' + (y0 + 6.4) + ' V' + (y0 + 15);
      s += D.R(a, y0 + 5.6, b - a, 9.4, { hatch: 'insul', stroke: 'none' }) + D.P(d, { w: W.major });
    });
    s += D.R(122, y0 + 5.4, 2, 13.2, { fill: INK, stroke: 'none' });
    s += breakV(0.2, y0 + 3, y0 + 34.5) + breakV(w - .2, y0 + 3, y0 + 34.5);
    // labels (typical build-up) — two rows, all inside the drawing width
    function lab(x, y, tx, ty, t, anc) { return D.L(x, y, tx, ty, W.dim) + D.C(x, y, .55, { fill: INK, stroke: 'none' }) + D.L(tx, ty, tx + (anc === 'end' ? -2.5 : 2.5), ty, W.dim) + D.Tx(tx + (anc === 'end' ? -3.2 : 3.2), ty + .95, t, { size: T.note, anchor: anc === 'end' ? 'end' : 'start' }); }
    s += lab(30, y0 + 16.5, 4, 3.5, 'Walnut veneer on 18 MDF') + lab(66, y0 + 16, 58, 3.5, 'Lit reveal 60 — LED channel') + lab(123, y0 + 12, 104, 3.5, 'Shadow gap 10') + lab(150, y0 + 9, 172, 3.5, 'Fabric, 50 foam, 18 ply', 'end');
    s += lab(53, y0 + 21, 4, h - 3.8, 'Batten 25 × 50') + lab(100, y0 + 30, 64, h - 3.8, 'Plaster on blockwork');
    return D.svg(w, h, s);
  };

  /* ================= RE-02 · Wardrobe — shop drawing format (representative, 1 : 25) ================= */
  // Elevation: 2 400 × 2 750 at 1:25 → 96 × 110 mm
  S.wardElev = function (w, h) {
    var s = '', X0 = 16, Y0 = 14, Wd = 96, Hd = 110, B = Y0 + Hd, k = 1 / 25;
    function yy(mm) { return B - mm * k; }
    s += D.R(X0 - 4, Y0 - 5, Wd + 8, 5, { hatch: 'gyp', w: W.sec }) + D.R(X0 - 4, B, Wd + 8, 4, { hatch: 'conc', w: W.sec });
    s += D.R(X0 - 4, Y0, 4, Hd, { hatch: 'masonry', w: W.cut, fill: PAPER }) + D.R(X0 + Wd, Y0, 4, Hd, { hatch: 'masonry', w: W.cut, fill: PAPER });
    s += D.R(X0, Y0, Wd, Hd, { w: W.major });
    s += D.R(X0 + .8, yy(2750), Wd - 1.6, 60 * k, { w: W.fix, hatch: 'grainH' }) + D.led(X0 + 2, yy(2690) + .8, X0 + Wd - 2, yy(2690) + .8);
    s += D.R(X0 + .8, yy(100), Wd - 1.6, 100 * k, { fill: '#d6cfc3', stroke: 'none' }) + D.L(X0, yy(100), X0 + Wd, yy(100), W.fix);
    for (var b = 0; b < 3; b++) {
      var bx = X0 + .8 + b * (Wd - 1.6) / 3, bw = (Wd - 1.6) / 3;
      for (var d = 0; d < 2; d++) {
        var dx = bx + d * bw / 2, dw = bw / 2, top = yy(2690), bot = yy(700);
        s += D.R(dx + .15, top, dw - .3, bot - top, { w: W.sec }) + D.R(dx + 2, top + 2, dw - 4, bot - top - 4, { w: W.fix }) + D.hatch('glass', dx + 2, top + 2, dw - 4, 20);
        s += D.P('M' + (d ? dx + .6 : dx + dw - .6) + ' ' + (top + .6) + ' L' + (d ? dx + dw - 1 : dx + 1) + ' ' + ((top + bot) / 2) + ' L' + (d ? dx + .6 : dx + dw - .6) + ' ' + (bot - .6), { w: W.hatch, stroke: GREY, dash: '1.4 .9' });
        s += D.L(d ? dx + 1.1 : dx + dw - 1.1, yy(1400), d ? dx + 1.1 : dx + dw - 1.1, yy(1700), W.major);
      }
      s += D.L(bx + 2, yy(2150), bx + bw - 2, yy(2150), W.hatch, GREY, '1.2 .8') + D.L(bx + 2, yy(1950), bx + bw - 2, yy(1950), W.hatch, GREY, '1.2 .8');
      [[100, 400], [400, 700]].forEach(function (dr) { s += D.R(bx + .15, yy(dr[1]), bw - .3, (dr[1] - dr[0]) * k, { w: W.sec, hatch: 'grainH' }) + D.L(bx + bw / 2 - 5, yy(dr[1]) + 1.2, bx + bw / 2 + 5, yy(dr[1]) + 1.2, W.major); });
      if (b) s += D.L(bx, Y0, bx, B, W.sec);
    }
    s += D.level(X0 - 5, B, 'FFL ±0.00', 'end');
    s += D.cutLine(X0 + Wd * .5, Y0 - 9, X0 + Wd * .5, Y0 - 1) + D.secMark(X0 + Wd * .5 + 6.5, Y0 - 9.5, 'A', 'RE-02', 0);
    s += D.detailCircle(X0 + 10, yy(2690), 4.2) + D.L(X0 + 13, yy(2690) - 3, X0 + 22, Y0 - 8.4, W.dim) + D.secMark(X0 + 26.4, Y0 - 9, '02', 'RE-02', null);
    s += D.code(X0 + 26, yy(2200), X0 + 26, yy(2200), 'GL-01') + D.code(X0 + 58, yy(1550), X0 + 60.5, yy(1550) - 8, 'HW-01') + D.code(X0 + 44, yy(550), X0 + 44, yy(550), 'WD-01') + D.code(X0 + 70, yy(2690) + .8, X0 + 76, yy(2580), 'LT-01');
    s += D.dimH([X0, X0 + Wd / 3, X0 + Wd * 2 / 3, X0 + Wd], B + 10, B + 4, ['800', '800', '800']) + D.dimH([X0, X0 + Wd], B + 18, B + 4, ['2 400']);
    s += D.dimV([Y0, yy(2690), yy(700), yy(100), B], X0 + Wd + 12, X0 + Wd + 4, ['', '1 990', '600', '']) + D.dimV([Y0, B], X0 + Wd + 20, X0 + Wd + 4, ['2 750']);
    return D.svg(w, h, s);
  };
  // Section A–A (1:25): depth 600 → 24 mm
  S.wardSection = function (w, h) {
    var s = '', X0 = 6, Y0 = 14, Dp = 24, Hd = 110, B = Y0 + Hd, k = 1 / 25;
    function yy(mm) { return B - mm * k; }
    s += D.R(X0 - 2, Y0 - 5, Dp + 8, 5, { hatch: 'gyp', w: W.sec }) + D.R(X0 - 2, B, Dp + 8, 4, { hatch: 'conc', w: W.sec }) + D.R(X0 + Dp, Y0, 4, Hd, { hatch: 'masonry', w: W.cut, fill: PAPER });
    s += D.R(X0, Y0, Dp, Hd, { w: W.cut }) + D.R(X0 + Dp - .72, Y0 + .72, .72, Hd - 4.72, { hatch: 'mdf', w: W.fix });
    s += D.R(X0 + .7, yy(2750) + .1, Dp - 1.4, .72, { fill: INK, stroke: 'none' }) + D.R(X0 + 2, yy(2690) - .6, 3.4, 1.2, { w: W.fix }) + D.R(X0 + 2.2, yy(2690) + .6, 3, .4, { fill: LED, stroke: 'none' });
    s += D.R(X0 + .7, yy(2150), Dp - 1.4, .72, { fill: INK, stroke: 'none' }) + D.C(X0 + Dp / 2, yy(1950), .8, { w: W.sec }) + D.L(X0 + Dp / 2, yy(2150) + .72, X0 + Dp / 2, yy(1950) - .8, W.fix);
    s += D.R(X0 + .7, yy(700), Dp - 1.4, .72, { fill: INK, stroke: 'none' });
    [[100, 400], [400, 700]].forEach(function (dr) { s += D.R(X0 + .1, yy(dr[1]) + .2, 1, (dr[1] - dr[0]) * k - .4, { hatch: 'ply', w: W.sec }) + D.R(X0 + 1.1, yy(dr[1]) + 2, Dp - 3.4, (dr[1] - dr[0]) * k - 3, { w: W.fix }); });
    s += D.R(X0, yy(2690), .9, (2690 - 700) * k, { w: W.sec, fill: PAPER }) + D.L(X0 + .45, yy(2690) + 2, X0 + .45, yy(700) - 2, W.hatch, GREY);
    s += D.R(X0 + 2, yy(100), Dp - 2.7, 100 * k, { w: W.fix, fill: '#d6cfc3' });
    s += D.dimH([X0, X0 + Dp], B + 10, B + 4, ['600']);
    return D.svg(w, h, s);
  };
  // Plan (1:25)
  S.wardPlan = function (w, h) {
    var s = '', X0 = 16, Y0 = 14, Wd = 96, Dp = 24;
    s += D.R(X0 - 4, Y0 - 4, Wd + 8, 4, { hatch: 'masonry', w: W.cut, fill: PAPER }) + D.R(X0 - 4, Y0, 4, Dp + 2, { hatch: 'masonry', w: W.cut, fill: PAPER }) + D.R(X0 + Wd, Y0, 4, Dp + 2, { hatch: 'masonry', w: W.cut, fill: PAPER });
    s += D.R(X0, Y0, Wd, Dp, { w: W.major }) + D.L(X0, Y0 + .72, X0 + Wd, Y0 + .72, W.fix) + D.L(X0 + 3, Y0 + 12, X0 + Wd - 3, Y0 + 12, W.hatch, GREY, '4 1 1 1');
    for (var b = 0; b < 3; b++) {
      var bx = X0 + b * Wd / 3, bw = Wd / 3, r = bw / 2 - .6;
      if (b) s += D.R(bx - .36, Y0, .72, Dp, { fill: INK, stroke: 'none' });
      s += D.R(bx + .3, Y0 + Dp, .8, r, { w: W.fix, fill: PAPER }) + D.R(bx + bw - 1.1, Y0 + Dp, .8, r, { w: W.fix, fill: PAPER });
      s += D.P('M' + (bx + 1.1 + r) + ' ' + (Y0 + Dp) + ' A' + r + ' ' + r + ' 0 0 1 ' + (bx + 1.1) + ' ' + (Y0 + Dp + r), { w: W.hatch, stroke: GREY });
      s += D.P('M' + (bx + bw - 1.1 - r) + ' ' + (Y0 + Dp) + ' A' + r + ' ' + r + ' 0 0 0 ' + (bx + bw - 1.1) + ' ' + (Y0 + Dp + r), { w: W.hatch, stroke: GREY });
    }
    s += D.dimH([X0, X0 + Wd / 3, X0 + Wd * 2 / 3, X0 + Wd], Y0 - 9, Y0 - 4, ['800', '800', '800']) + D.dimV([Y0, Y0 + Dp], X0 - 9, X0 - 4, ['600']);
    return D.svg(w, h, s);
  };
  // Detail 02 (1:2): top rail with recessed LED profile and glass door head
  S.wardDetail = function (w, h) {
    var s = '', x0 = 6, y0 = 6;
    s += D.R(x0, y0, 32, 9, { hatch: 'ply', w: W.cut, fill: PAPER }) + D.L(x0, y0 + 9, x0 + 32, y0 + 9, W.major) + breakV(x0, y0 - 1, y0 + 10);
    s += D.R(x0 + 18, y0 + 9, 9, 4, { w: W.sec, fill: PAPER }) + D.R(x0 + 18.8, y0 + 9.2, 7.4, 1, { fill: LED, stroke: 'none' }) + D.L(x0 + 18, y0 + 13, x0 + 27, y0 + 13, W.major, LED);
    s += D.L(x0 + 22.5, y0 + 13.4, x0 + 15, y0 + 27, W.hatch, LED, '1.2 .8') + D.L(x0 + 22.5, y0 + 13.4, x0 + 29, y0 + 27, W.hatch, LED, '1.2 .8');
    s += D.R(x0 + 33, y0 + 10.5, 11, 22, { hatch: 'grainH', w: W.major, fill: PAPER }) + D.R(x0 + 37, y0 + 17, 3, 15.5, { w: W.sec, fill: '#e3e6e6' });
    s += D.dimV([y0, y0 + 9], x0 - 2, x0, ['18']) + D.dimH([x0 + 18, x0 + 27], y0 + 32, y0 + 14, ['17']);
    function lab(x, y, tx, ty, t) { return D.L(x, y, tx, ty, W.dim) + D.C(x, y, .55, { fill: INK, stroke: 'none' }) + D.L(tx, ty, tx + 2, ty, W.dim) + D.Tx(tx + 2.6, ty + .95, t, { size: T.note }); }
    s += lab(x0 + 10, y0 + 4.5, x0, y0 + 40.5, 'Top panel 18, veneered') + lab(x0 + 22.5, y0 + 11, x0, y0 + 45, 'LED profile, diffuser') + lab(x0 + 38.5, y0 + 26, x0, y0 + 49.5, 'Frame, 6 tinted glass');
    return D.svg(w, h, s);
  };

  window.WALNUT = S;
})();
