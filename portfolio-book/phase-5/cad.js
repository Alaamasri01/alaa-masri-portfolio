/*
 * CAD-style drawing library for the portfolio (SVG, millimetre units).
 *
 * AUTHENTICITY RULE: nothing here is a construction document. Every drawing
 * carries a status label (CONCEPTUAL SPACE STUDY, DESIGN DEVELOPMENT DIAGRAM,
 * REPRESENTATIVE DETAIL, CONCEPT DETAIL, MATERIAL STUDY, REPRESENTATIVE EXAMPLE)
 * inside its title block. Project drawings are traced from the proportions of
 * the named render; representative examples are generic and tied to no project.
 */
(function () {
  'use strict';
  var C = {
    ink: '#2b2a27', mid: '#6f6a62', light: '#a8a196', bronze: '#93734e', tint: '#e6ded1', tint2: '#efe8dc', paper: '#f4f1eb'
  };
  var W = { hair: 0.1, fine: 0.13, thin: 0.18, med: 0.25, heavy: 0.35, cut: 0.5 };
  var FS = 2.15; // 6.1 pt — the smallest text used anywhere

  function a(o) { var s = ''; for (var k in o) if (o[k] !== undefined && o[k] !== null) s += ' ' + k + '="' + o[k] + '"'; return s; }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  var P = {
    theme: function (dark) { C.ink = dark ? '#ece7dc' : '#2b2a27'; C.mid = dark ? '#b8b4a9' : '#6f6a62'; C.light = dark ? '#6d6b63' : '#a8a196'; C.bronze = dark ? '#c2a37d' : '#93734e'; C.tint = dark ? '#2a2d24' : '#e6ded1'; C.tint2 = dark ? '#23261e' : '#efe8dc'; C.paper = dark ? '#151612' : '#f4f1eb'; },
    svg: function (w, h, body, id) {
      id = id || ('s' + Math.random().toString(36).slice(2, 7));
      var defs = '<defs>' +
        '<pattern id="' + id + 'tim" width="1.2" height="1.2" patternUnits="userSpaceOnUse"><path d="M0 .6 H1.2" stroke="' + C.mid + '" stroke-width=".08"/></pattern>' +
        '<pattern id="' + id + 'timv" width="1.2" height="1.2" patternUnits="userSpaceOnUse"><path d="M.6 0 V1.2" stroke="' + C.mid + '" stroke-width=".08"/></pattern>' +
        '<pattern id="' + id + 'st" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 .8 H1.6" stroke="' + C.mid + '" stroke-width=".1"/></pattern>' +
        '<pattern id="' + id + 'cc" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 1.2 H2.4 M1.2 0 V2.4" stroke="' + C.mid + '" stroke-width=".09"/></pattern>' +
        '<pattern id="' + id + 'dot" width="1.4" height="1.4" patternUnits="userSpaceOnUse"><circle cx=".7" cy=".7" r=".13" fill="' + C.mid + '"/></pattern>' +
        '<pattern id="' + id + 'up" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M0 2 Q1 0 2 2" fill="none" stroke="' + C.mid + '" stroke-width=".09"/></pattern>' +
        '<marker id="' + id + 'ar" viewBox="0 0 4 4" refX="3.6" refY="2" markerWidth="3" markerHeight="3" orient="auto"><path d="M0 0 L4 2 L0 4 z" fill="' + C.bronze + '"/></marker>' +
        '</defs>';
      P._id = id;
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + 'mm" height="' + h + 'mm" style="display:block; overflow:visible; font-family:Inter, Helvetica, Arial, sans-serif">' + defs + body + '</svg>';
    },
    fill: function (name) { return 'url(#' + P._id + name + ')'; },
    line: function (x1, y1, x2, y2, w, c, dash) { return '<line' + a({ x1: x1, y1: y1, x2: x2, y2: y2, stroke: c || C.ink, 'stroke-width': w || W.med, 'stroke-dasharray': dash, 'stroke-linecap': 'butt' }) + '/>'; },
    rect: function (x, y, w, h, o) { o = o || {}; return '<rect' + a({ x: x, y: y, width: w, height: h, fill: o.fill || 'none', stroke: o.stroke === undefined ? C.ink : o.stroke, 'stroke-width': o.w || W.med, 'stroke-dasharray': o.dash, rx: o.rx }) + '/>'; },
    path: function (d, o) { o = o || {}; return '<path' + a({ d: d, fill: o.fill || 'none', stroke: o.stroke === undefined ? C.ink : o.stroke, 'stroke-width': o.w || W.med, 'stroke-dasharray': o.dash, 'marker-end': o.arrow ? 'url(#' + P._id + 'ar)' : undefined }) + '/>'; },
    circle: function (x, y, r, o) { o = o || {}; return '<circle' + a({ cx: x, cy: y, r: r, fill: o.fill || 'none', stroke: o.stroke === undefined ? C.ink : o.stroke, 'stroke-width': o.w || W.thin, 'stroke-dasharray': o.dash }) + '/>'; },
    text: function (x, y, t, o) {
      o = o || {};
      return '<text' + a({ x: x, y: y, 'font-size': o.size || FS, fill: o.fill || C.ink, 'text-anchor': o.anchor || 'start', 'font-weight': o.weight || 400, 'letter-spacing': o.ls, transform: o.rot ? 'rotate(' + o.rot + ' ' + x + ' ' + y + ')' : undefined, 'font-family': o.serif ? 'Instrument Serif, Georgia, serif' : undefined, 'font-style': o.italic ? 'italic' : undefined }) + '>' + esc(t) + '</text>';
    },
    caps: function (x, y, t, o) { o = o || {}; o.ls = o.ls || 0.32; o.weight = o.weight || 500; return P.text(x, y, String(t).toUpperCase(), o); },
    // Dimension line with 45° ticks and extension lines. label may be text or a number.
    dim: function (x1, y1, x2, y2, label, off, o) {
      o = o || {}; off = off || 0;
      var horiz = Math.abs(y2 - y1) < Math.abs(x2 - x1), s = '', c = o.c || C.mid;
      if (horiz) {
        var y = y1 + off;
        s += P.line(x1, y1, x1, y + (off < 0 ? -1 : 1), W.hair, c) + P.line(x2, y2, x2, y + (off < 0 ? -1 : 1), W.hair, c);
        s += P.line(x1 - 1, y, x2 + 1, y, W.fine, c) + P.line(x1 - .7, y + .7, x1 + .7, y - .7, W.med, c) + P.line(x2 - .7, y + .7, x2 + .7, y - .7, W.med, c);
        s += P.text((x1 + x2) / 2, y - .8, label, { anchor: 'middle', fill: C.ink, size: o.size });
      } else {
        var x = x1 + off;
        s += P.line(x1, y1, x + (off < 0 ? -1 : 1), y1, W.hair, c) + P.line(x2, y2, x + (off < 0 ? -1 : 1), y2, W.hair, c);
        s += P.line(x, y1 - 1, x, y2 + 1, W.fine, c) + P.line(x - .7, y1 + .7, x + .7, y1 - .7, W.med, c) + P.line(x - .7, y2 + .7, x + .7, y2 - .7, W.med, c);
        s += P.text(x - .8, (y1 + y2) / 2, label, { anchor: 'middle', rot: -90, fill: C.ink, size: o.size });
      }
      return s;
    },
    bubble: function (x, y, t, r, o) { o = o || {}; r = r || 2.4; return P.circle(x, y, r, { w: W.thin, stroke: o.c || C.ink, fill: o.fill || C.paper }) + P.text(x, y + .75, t, { anchor: 'middle', size: o.size || 2.1, weight: 500, fill: o.c || C.ink }); },
    // Numbered leader: dot at target, line to a bronze numbered bubble.
    tag: function (x, y, tx, ty, n) { return P.circle(x, y, .45, { fill: C.bronze, stroke: 'none' }) + P.line(x, y, tx, ty, W.thin, C.bronze) + P.circle(tx, ty, 2.1, { fill: C.paper, stroke: C.bronze, w: W.thin }) + P.text(tx, ty + .75, n, { anchor: 'middle', size: 2.1, weight: 600, fill: C.bronze }); },
    label: function (x, y, tx, ty, t, anchor) { return P.circle(x, y, .4, { fill: C.bronze, stroke: 'none' }) + P.line(x, y, tx, ty, W.thin, C.bronze) + P.line(tx, ty, tx + (anchor === 'end' ? -3 : 3), ty, W.thin, C.bronze) + P.text(tx + (anchor === 'end' ? -3.6 : 3.6), ty + .7, t, { anchor: anchor || 'start', size: 2.15 }); },
    // Elevation / section marker: circle with a pointer
    marker: function (x, y, t, ang) {
      var r = 2.8, rad = (ang || 0) * Math.PI / 180, px = x + Math.cos(rad) * (r + 2.2), py = y + Math.sin(rad) * (r + 2.2);
      var l = x + Math.cos(rad + 1.1) * r, lt = y + Math.sin(rad + 1.1) * r, rr = x + Math.cos(rad - 1.1) * r, rt = y + Math.sin(rad - 1.1) * r;
      return '<path d="M' + l + ' ' + lt + ' L' + px + ' ' + py + ' L' + rr + ' ' + rt + ' Z" fill="' + C.ink + '"/>' + P.circle(x, y, r, { fill: C.paper, w: W.med }) + P.text(x, y + .8, t, { anchor: 'middle', size: 2.2, weight: 600 });
    },
    statusTag: function (x, y, t, anchor) {
      var w = t.length * 1.52 + 4, x0 = anchor === 'end' ? x - w : x;
      return P.rect(x0, y - 3.4, w, 4.8, { stroke: C.bronze, w: W.thin }) + P.caps(x0 + 2, y + .1, t, { fill: C.bronze, size: 2.1, ls: .3 });
    },
    // Title block strip: title · status · reference · scale
    titleBlock: function (x, y, w, o) {
      var s, kick = o.kicker || (o.source ? o.source : 'Alaa Masri · Interior architecture');
      if (w < 130) { // two-row block for narrow drawings (occupies 16 mm)
        y -= 6;
        s = P.rect(x, y, w, 16, { w: W.thin }) + P.line(x, y + 9.5, x + w, y + 9.5, W.hair) + P.line(x + w * .62, y + 9.5, x + w * .62, y + 16, W.hair);
        s += P.caps(x + 1.6, y + 3.4, kick, { size: 2.1, fill: C.mid, ls: .22 }) + P.text(x + 1.6, y + 7.6, o.title, { size: 2.8, serif: true });
        s += P.caps(x + 1.6, y + 13.8, o.status, { size: 2.1, fill: C.bronze, weight: 600, ls: .2 }) + P.caps(x + w * .62 + 1.6, y + 13.8, o.ref + ' · ' + (o.scale || 'NTS'), { size: 2.1, weight: 500, ls: .2 });
        return s;
      }
      var h = 9.5, c1 = x + w * .5, c2 = x + w * .78;
      s = P.rect(x, y, w, h, { w: W.thin }) + P.line(c1, y, c1, y + h, W.hair) + P.line(c2, y, c2, y + h, W.hair);
      s += P.caps(x + 1.6, y + 3.4, kick, { size: 2.1, fill: C.mid, ls: .25 });
      s += P.text(x + 1.6, y + 7.6, o.title, { size: 2.8, serif: true });
      s += P.caps(c1 + 1.6, y + 3.4, 'Status', { size: 2.1, fill: C.mid });
      s += P.caps(c1 + 1.6, y + 7.4, o.status, { size: 2.1, fill: C.bronze, weight: 600, ls: .2 });
      s += P.caps(c2 + 1.6, y + 3.4, 'Ref · scale', { size: 2.1, fill: C.mid });
      s += P.caps(c2 + 1.6, y + 7.4, o.ref + ' · ' + (o.scale || 'NTS'), { size: 2.1, weight: 500 });
      return s;
    },
    grid: function (x0, y0, x1, y1, cols, rows) {
      var s = '';
      cols.forEach(function (c) { s += P.line(c[0], y0 + 3, c[0], y1, W.hair, C.light, '3 1 .6 1') + P.bubble(c[0], y0, c[1], 2.2); });
      rows.forEach(function (r) { s += P.line(x0 + 3, r[0], x1, r[0], W.hair, C.light, '3 1 .6 1') + P.bubble(x0, r[0], r[1], 2.2); });
      return s;
    },
    arrow: function (d) { return P.path(d, { stroke: C.bronze, w: W.thin, dash: '1.2 .8', arrow: true }); },
    C: C, W: W
  };

  /* ================= PROJECT DRAWINGS — The walnut suite ================= */

  // DD-01 · Conceptual space study (plan). Layout read from Fig. 01 (headboard wall) and Fig. 02 (media wall).
  P.walnutPlan = function (w, h) {
    var s = '', X = 14, Y = 12, RW = w - 26, RH = h - 34, t = 2.2;
    s += P.grid(X - 6, Y - 7, X + RW + 3, Y + RH + 3, [[X, '1'], [X + RW / 2, '2'], [X + RW, '3']], [[Y, 'A'], [Y + RH, 'B']]);
    // walls (poche)
    s += P.rect(X - t, Y - t, RW + 2 * t, t, { fill: C.ink, stroke: 'none' }) + P.rect(X - t, Y + RH, RW + 2 * t, t, { fill: C.ink, stroke: 'none' });
    s += P.rect(X - t, Y, t, RH, { fill: C.ink, stroke: 'none' }) + P.rect(X + RW, Y, t, RH, { fill: C.ink, stroke: 'none' });
    // windows in side walls (glazing + curtain line)
    [[X - t, Y + 10], [X + RW, Y + 10]].forEach(function (p) {
      s += P.rect(p[0], p[1], t, 30, { fill: C.paper, stroke: C.ink, w: W.thin }) + P.line(p[0] + t / 2, p[1], p[0] + t / 2, p[1] + 30, W.fine);
      var cx = p[0] === X - t ? X + 2 : X + RW - 2, d = 'M' + cx + ' ' + (p[1] - 2);
      for (var i = 0; i < 12; i++) d += ' q ' + (i % 2 ? 1 : -1) + ' 1.4 0 2.8';
      s += P.path(d, { stroke: C.mid, w: W.fine });
    });
    // door (right wall, towards media wall)
    var dy = Y + RH - 24;
    s += P.rect(X + RW, dy, t, 16, { fill: C.paper, stroke: 'none' }) + P.line(X + RW, dy, X + RW - 16, dy, W.thin) + P.path('M' + (X + RW - 16) + ' ' + dy + ' A16 16 0 0 0 ' + (X + RW) + ' ' + (dy + 16), { w: W.hair, stroke: C.mid, dash: '1 .6' });
    // zones
    var bx = X + RW / 2 - 16, by = Y + 7;
    s += P.rect(X + 18, Y + 2, RW - 36, 58, { fill: C.tint2, stroke: 'none' });
    s += P.rect(X + 4, Y + RH - 16, RW - 8, 14, { fill: C.tint, stroke: 'none' });
    // headboard feature wall: walnut panels + upholstered centre
    s += P.rect(X + RW / 2 - 30, Y, 60, 2.6, { fill: P.fill('timv'), w: W.thin });
    s += P.rect(X + RW / 2 - 17, Y, 34, 3.4, { fill: P.fill('up'), w: W.thin });
    // bed, bedsides, rug, pendant
    s += P.rect(X + RW / 2 - 36, by + 4, 72, 62, { dash: '1.2 .8', w: W.hair, stroke: C.mid });
    s += P.rect(bx, by, 32, 40, { w: W.heavy, fill: C.paper });
    s += P.rect(bx + 2, by + 2, 13, 6, { w: W.thin, rx: 1 }) + P.rect(bx + 17, by + 2, 13, 6, { w: W.thin, rx: 1 });
    s += P.line(bx, by + 13, bx + 32, by + 13, W.thin) + P.path('M' + bx + ' ' + (by + 16) + ' L' + (bx + 32) + ' ' + (by + 22), { w: W.hair, stroke: C.mid });
    s += P.rect(bx - 9, by, 7, 6, { w: W.thin, fill: P.fill('st') }) + P.rect(bx + 34, by, 7, 6, { w: W.thin, fill: P.fill('st') });
    s += P.circle(X + RW / 2, by + 18, 7, { dash: '1 .7', w: W.fine, stroke: C.bronze }) + P.circle(X + RW / 2, by + 18, .6, { fill: C.bronze, stroke: 'none' });
    // media wall joinery (south)
    var jy = Y + RH - 7;
    s += P.rect(X + 4, jy, RW - 8, 7, { fill: P.fill('timv'), w: W.thin });
    s += P.rect(X + 4, jy, 14, 7, { w: W.thin }) + P.rect(X + RW - 18, jy, 14, 7, { w: W.thin });
    s += P.rect(X + 24, jy + 1.5, 8, 5.5, { fill: C.paper, w: W.fine }) + P.rect(X + RW - 32, jy + 1.5, 8, 5.5, { fill: C.paper, w: W.fine });
    s += P.rect(X + 18, jy - 2.2, RW - 36, 2.2, { fill: P.fill('st'), w: W.thin });
    s += P.rect(X + RW / 2 - 18, jy + 3, 36, 4, { fill: C.paper, w: W.fine });
    // circulation
    s += P.arrow('M' + (X + RW - 10) + ' ' + (dy + 8) + ' C ' + (X + RW - 22) + ' ' + (dy + 8) + ' ' + (X + RW / 2 + 10) + ' ' + (by + 52) + ' ' + (X + RW / 2) + ' ' + (by + 52));
    s += P.arrow('M' + (X + RW / 2) + ' ' + (by + 52) + ' C ' + (bx - 8) + ' ' + (by + 52) + ' ' + (bx - 7) + ' ' + (by + 30) + ' ' + (bx - 6) + ' ' + (by + 10));
    s += P.arrow('M' + (X + RW / 2) + ' ' + (by + 52) + ' C ' + (bx + 40) + ' ' + (by + 52) + ' ' + (bx + 39) + ' ' + (by + 30) + ' ' + (bx + 38) + ' ' + (by + 10));
    // elevation markers
    s += P.marker(X + RW / 2, by + 60, 'E1', 90) + P.marker(X + RW / 2 + 44, by + 12, 'E2', -90);
    // numbered tags
    s += P.tag(X + RW / 2 - 24, Y + 1.3, X + RW / 2 - 40, Y + 9, '1') + P.tag(X + RW / 2, Y + 2, X + RW / 2 + 22, Y - 1.5 + 12, '2');
    s += P.tag(bx + 16, by + 30, bx - 16, by + 44, '3') + P.tag(X + RW / 2 + 6, by + 18, X + RW / 2 + 24, by + 30, '4');
    s += P.tag(X + RW / 2 + 10, jy + 4.5, X + RW / 2 + 28, jy - 8, '5') + P.tag(X + 11, jy + 3.5, X + 12, jy - 10, '6') + P.tag(X - 1, Y + 25, X + 8, Y + 48, '7');
    // zone names
    s += P.caps(X + 20, Y + 57, 'Sleep zone', { size: 2.1, fill: C.bronze }) + P.caps(X + 6, Y + RH - 12.5, 'Media & display wall', { size: 2.1, fill: C.bronze }) + P.caps(X + RW - 40, dy - 3, 'Circulation', { size: 2.1, fill: C.bronze });
    s += P.titleBlock(0, h - 10, w, { title: 'The walnut suite — layout reading', status: 'Conceptual space study', ref: 'DD-01', scale: 'NTS', source: 'Reads Fig. 01 + 02 · not a surveyed plan' });
    return P.svg(w, h, s);
  };

  // DD-02 · Media wall elevation, proportions traced from Fig. 02 (px → mm).
  P.walnutMediaWall = function (w, h) {
    var x0 = 290, x1 = 1640, y0 = 150, y1 = 790, pad = 8, top = 8, dh = h - 32;
    var k = Math.min((w - pad * 2) / (x1 - x0), dh / (y1 - y0));
    var X = function (px) { return pad + (px - x0) * k; }, Y = function (py) { return top + (py - y0) * k; };
    var R = function (a, b, c, d, o) { return P.rect(X(a), Y(b), (c - a) * k, (d - b) * k, o); };
    var s = '';
    s += P.line(X(x0) - 4, Y(y1), X(x1) + 4, Y(y1), W.cut) + P.line(X(x0) - 4, Y(y0), X(x1) + 4, Y(y0), W.thin, C.mid);
    s += R(300, 150, 1500, 790, { w: W.heavy });
    s += R(300, 150, 490, 790, { fill: P.fill('timv'), w: W.med }) + P.line(X(395), Y(150), X(395), Y(790), W.thin);
    s += R(1310, 150, 1500, 790, { fill: P.fill('timv'), w: W.med }) + P.line(X(1405), Y(150), X(1405), Y(790), W.thin);
    s += R(1510, 180, 1640, 790, { w: W.thin }) + P.circle(X(1545), Y(470), .5, { fill: C.ink });
    s += R(490, 150, 1310, 215, { fill: P.fill('timv'), w: W.thin });
    s += P.line(X(495), Y(220), X(1305), Y(220), W.med, C.bronze, '1.4 .5');
    [[500, 590], [1205, 1300]].forEach(function (n) {
      s += R(n[0], 225, n[1], 600, { w: W.thin, fill: C.tint2 });
      [302, 387, 467].forEach(function (yy) { s += P.line(X(n[0]), Y(yy), X(n[1]), Y(yy), W.med) + P.line(X(n[0]) + .4, Y(yy) + .7, X(n[1]) - .4, Y(yy) + .7, W.thin, C.bronze, '1 .4'); });
    });
    [600, 700, 1100, 1200].forEach(function (xx) { s += P.line(X(xx), Y(225), X(xx), Y(600), W.fine, C.mid); });
    s += R(705, 330, 1095, 560, { w: W.med }) + R(718, 342, 1082, 548, { w: W.thin, fill: P.fill('dot') });
    s += R(490, 600, 1310, 612, { w: W.thin }) + P.line(X(495), Y(616), X(1305), Y(616), W.med, C.bronze, '1.4 .5');
    s += R(490, 665, 1310, 740, { fill: P.fill('st'), w: W.med });
    s += P.line(X(495), Y(746), X(1305), Y(746), W.med, C.bronze, '1.4 .5');
    // named dimension chain (proportions only — no survey dimensions)
    var dy = Y(790) + 6;
    [[300, 490, 'Tall unit'], [490, 705, 'Display'], [705, 1095, 'Media recess'], [1095, 1310, 'Display'], [1310, 1500, 'Tall unit']].forEach(function (d) { s += P.dim(X(d[0]), Y(790), X(d[1]), Y(790), d[2], 6); });
    s += P.dim(X(1500), Y(150), X(1500), Y(790), 'Floor to ceiling', 10);
    // tags
    s += P.tag(X(345), Y(420), X(345), Y(420) - 2, '1');
    s += P.tag(X(545), Y(302), X(545), Y(262), '2') + P.tag(X(900), Y(445), X(900), Y(445), '3') + P.tag(X(820), Y(702), X(820), Y(702), '4');
    s += P.tag(X(1000), Y(746), X(1060), Y(770), '5') + P.tag(X(1150), Y(219), X(1180), Y(186), '6') + P.tag(X(1545), Y(360), X(1575), Y(360), '7');
    s += P.titleBlock(0, h - 10, w, { title: 'E1 — Media wall elevation', status: 'Design development diagram', ref: 'DD-02', scale: 'NTS', source: 'The walnut suite · traced from Fig. 02' });
    return P.svg(w, h, s);
  };

  // DD-03 · Headboard wall elevation, proportions traced from Fig. 01.
  P.walnutHeadboard = function (w, h) {
    var x0 = 470, x1 = 1330, y0 = 175, y1 = 800, pad = 6, top = 6, dh = h - 26;
    var k = Math.min((w - pad * 2) / (x1 - x0), dh / (y1 - y0));
    var X = function (px) { return pad + (px - x0) * k; }, Y = function (py) { return top + (py - y0) * k; };
    var R = function (a, b, c, d, o) { return P.rect(X(a), Y(b), (c - a) * k, (d - b) * k, o); };
    var s = P.line(X(x0) - 3, Y(y1), X(x1) + 3, Y(y1), W.cut);
    s += R(500, 180, 660, 790, { fill: P.fill('timv'), w: W.med }) + R(1140, 180, 1310, 790, { fill: P.fill('timv'), w: W.med });
    s += P.line(X(575), Y(180), X(575), Y(790), W.thin) + P.line(X(1225), Y(180), X(1225), Y(790), W.thin);
    s += P.line(X(668), Y(185), X(668), Y(700), W.med, C.bronze, '1.2 .5') + P.line(X(1132), Y(185), X(1132), Y(700), W.med, C.bronze, '1.2 .5');
    s += R(680, 185, 1120, 700, { w: W.med, fill: P.fill('up') });
    for (var i = 1; i < 7; i++) s += P.line(X(680 + i * 440 / 7), Y(185), X(680 + i * 440 / 7), Y(700), W.thin);
    s += R(560, 700, 1240, 780, { w: W.thin, dash: '1 .6', stroke: C.mid });
    s += R(480, 700, 640, 790, { w: W.thin, fill: P.fill('st') }) + R(1160, 700, 1320, 790, { w: W.thin, fill: P.fill('st') });
    [[520, 610, 600], [1200, 610, 1280]].forEach(function (l) { s += R(l[0], l[1], l[2], 700, { w: W.thin }); });
    [[745, 255], [800, 225], [860, 262], [915, 238], [975, 215], [1030, 250], [1070, 228]].forEach(function (c) { s += P.line(X(c[0]), Y(185), X(c[0]), Y(c[1]) - 1.2, W.hair, C.mid) + P.circle(X(c[0]), Y(c[1]), 1.3, { w: W.thin }); });
    s += P.tag(X(580), Y(420), X(580), Y(420), '1') + P.tag(X(900), Y(480), X(900), Y(480), '2') + P.tag(X(1132), Y(560), X(1170), Y(560), '3') + P.tag(X(560), Y(745), X(560), Y(745), '4') + P.tag(X(975), Y(215), X(1000), Y(200), '5');
    s += P.titleBlock(0, h - 10, w, { title: 'E2 — Headboard wall', status: 'Design development diagram', ref: 'DD-03', scale: 'NTS', source: 'Traced from Fig. 01' });
    return P.svg(w, h, s);
  };

  // RD-01 · Representative detail — lit display shelf, vertical section (typical, not project-specific).
  P.shelfDetail = function (w, h, mini) {
    var s = '', ox = 10, oy = 8, sc = mini ? (typeof mini === 'number' ? mini : .55) : 1;
    function g(x, y) { return [ox + x * sc, oy + y * sc]; }
    function R(x, y, ww, hh, o) { var p = g(x, y); return P.rect(p[0], p[1], ww * sc, hh * sc, o); }
    s += R(0, 0, 6, 70, { fill: P.fill('cc'), w: W.med });            // wall
    s += R(6, 0, 4, 70, { fill: P.fill('tim'), w: W.thin });          // back panel
    s += R(10, 26, 46, 6, { fill: P.fill('tim'), w: W.med });         // shelf
    s += R(10, 23.4, 46, 2.6, { fill: C.tint, w: W.fine });           // veneer edge / lip
    s += R(12, 32, 7, 3.2, { fill: C.paper, w: W.thin });             // LED profile recess
    s += R(12.6, 35.2, 5.8, .9, { fill: C.bronze, stroke: 'none' });  // diffuser
    s += R(10, 60, 46, 6, { fill: P.fill('tim'), w: W.med });
    s += R(12, 66, 7, 3.2, { fill: C.paper, w: W.thin });
    s += R(12.6, 69.2, 5.8, .9, { fill: C.bronze, stroke: 'none' });
    s += R(6, 12, 4, 2, { fill: C.ink, stroke: 'none' });
    var p1 = g(56, 26), p2 = g(56, 32);
    if (!mini) {
      s += P.dim(p1[0], p1[1], p2[0], p2[1], '25', 6) + P.dim(g(10, 26)[0], g(10, 26)[1], g(56, 26)[0], g(56, 26)[1], '300', -8);
      s += P.label(g(15.5, 36)[0], g(15.5, 36)[1], g(30, 46)[0], g(30, 46)[1], 'LED profile, opal diffuser — recessed');
      s += P.label(g(33, 24.6)[0], g(33, 24.6)[1], g(40, 14)[0], g(40, 14)[1], 'Veneered edge, walnut');
      s += P.label(g(8, 48)[0], g(8, 48)[1], g(30, 52)[0], g(30, 52)[1], 'Back panel on concealed battens');
      s += P.label(g(3, 6)[0], g(3, 6)[1], g(30, 4)[0], g(30, 4)[1], 'Wall / substrate');
      s += P.titleBlock(0, h - 10, w, { title: 'Lit display shelf — section', status: 'Representative detail', ref: 'RD-01', scale: '1:5 typical' });
    }
    return P.svg(w, h, s);
  };

  // CD-01 · Concept detail — plan at walnut / lit reveal / upholstered panel junction (reads Fig. 05).
  P.junctionDetail = function (w, h) {
    var s = '', y = 16, d = 16;
    s += P.rect(4, y + d, w - 8, 5, { fill: P.fill('cc'), w: W.med });                               // substrate wall
    s += P.rect(4, y + 4, 26, d - 4, { fill: P.fill('tim'), w: W.med });                           // walnut panel
    s += P.rect(4, y + 2.6, 26, 1.4, { fill: C.tint, w: W.fine });                                 // veneer face
    s += P.rect(30, y + 7, 8, d - 7, { fill: C.paper, w: W.thin });                                // reveal
    s += P.rect(31.5, y + 9, 5, 3.2, { fill: C.paper, w: W.thin }) + P.rect(32, y + 8.2, 4, .8, { fill: C.bronze, stroke: 'none' });
    s += P.rect(38, y, 30, d, { fill: P.fill('up'), w: W.med }) + P.rect(38, y + d - 4, 30, 4, { fill: P.fill('tim'), w: W.thin });
    s += P.rect(68, y + 4, 2.5, d - 4, { fill: C.ink, stroke: 'none' });                           // shadow gap
    s += P.rect(70.5, y, w - 74.5, d, { fill: P.fill('up'), w: W.med }) + P.rect(70.5, y + d - 4, w - 74.5, 4, { fill: P.fill('tim'), w: W.thin });
    s += P.label(16, y + 3.2, 10, y - 8, 'Walnut veneer on board', 'start');
    s += P.label(34, y + 8.6, 38, y + 27, 'Recessed LED profile — lit reveal', 'start');
    s += P.label(52, y + 5, 46, y - 8, 'Velvet over foam on ply', 'start');
    s += P.label(69.3, y + 10, 64, y + 34, 'Shadow gap', 'start');
    s += P.label(20, y + d + 2.5, 8, y + 41, 'Concealed batten / fixing zone', 'start');
    s += P.titleBlock(0, h - 10, w, { title: 'Walnut / light / velvet junction — plan', status: 'Concept detail', ref: 'CD-01', scale: 'NTS', source: 'The walnut suite · reads Fig. 05' });
    return P.svg(w, h, s);
  };

  /* ================= PROJECT DRAWING — The skyline suite ================= */
  // DD-04 · Wardrobe module elevation, traced from Fig. 04 (one two-door bay).
  P.wardrobeModule = function (w, h, dark) {
    P.theme(dark);
    var x0 = 555, x1 = 845, y0 = 40, y1 = 940, pad = 6, top = 6, dh = h - 30;
    var k = Math.min((w - pad * 2 - 16) / (x1 - x0), dh / (y1 - y0));
    var X = function (px) { return pad + (px - x0) * k; }, Y = function (py) { return top + (py - y0) * k; };
    var R = function (a, b, c, d, o) { return P.rect(X(a), Y(b), (c - a) * k, (d - b) * k, o); };
    var s = R(560, 45, 840, 935, { w: W.heavy }) + R(572, 60, 698, 920, { w: W.thin }) + R(704, 60, 828, 920, { w: W.thin });
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
    var s = '', X = 12, Y = 12, t = 2.4, A = w - 22, B = h - 36;
    s += P.grid(X - 6, Y - 7, X + A, Y + B, [[X, '1'], [X + A * .55, '2'], [X + A, '3']], [[Y, 'A'], [Y + B, 'B']]);
    s += P.rect(X, Y, A, t, { fill: C.ink, stroke: 'none' }) + P.rect(X, Y, t, B, { fill: C.ink, stroke: 'none' }) + P.rect(X, Y + B - t, A, t, { fill: C.ink, stroke: 'none' });
    s += P.rect(X + A * .55 - 1, Y, 2, B * .55, { fill: P.fill('cc'), w: W.thin });
    s += P.rect(X + A * .55 - 1, Y + B * .55 + 11, 2, B * .45 - 11, { fill: P.fill('cc'), w: W.thin });
    s += P.line(X + A * .55, Y + B * .55, X + A * .55 + 11, Y + B * .55, W.thin) + P.path('M' + (X + A * .55 + 11) + ' ' + (Y + B * .55) + ' A11 11 0 0 1 ' + (X + A * .55) + ' ' + (Y + B * .55 + 11), { w: W.hair, stroke: C.mid, dash: '1 .6' });
    s += P.dim(X, Y + B, X + A * .55, Y + B, '4 200', 6) + P.dim(X + A * .55, Y + B, X + A, Y + B, '3 450', 6);
    s += P.dim(X, Y, X, Y + B, '5 100', -6);
    s += P.rect(X + 5, Y + 12, A * .55 - 9, 9, { w: W.thin, fill: C.paper }) + P.caps(X + 7, Y + 16.2, 'Living', { size: 2.1 }) + P.text(X + 7, Y + 19.6, 'FL-01', { size: 2.1, fill: C.mid });
    s += P.rect(X + A * .55 + 4, Y + 12, A * .45 - 7, 9, { w: W.thin, fill: C.paper }) + P.caps(X + A * .55 + 6, Y + 16.2, 'Study', { size: 2.1 }) + P.text(X + A * .55 + 6, Y + 19.6, 'FL-02', { size: 2.1, fill: C.mid });
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
      s += P.rect(cx, ey + 2 + i * 9, 10, 5.6, { w: W.thin }) + P.caps(cx + 1.2, ey + 5.8 + i * 9, c[0], { size: 2.1, weight: 600 }) + P.text(cx + 12, ey + 5.8 + i * 9, c[1], { size: 2.15 });
    });
    s += P.caps(cx, ey + 56, 'Notes', { size: 2.1, fill: C.mid });
    ['All dimensions in mm — verify on site', 'Veneer grain continuous across doors', 'LED driver in accessible void'].forEach(function (n, i) { s += P.text(cx, ey + 60 + i * 4, (i + 1) + '. ' + n, { size: 2.15 }); });
    s += P.titleBlock(0, h - 10, w, { title: 'Wardrobe — shop drawing format', status: 'Representative example', ref: 'RE-02', scale: '1:20 typical' });
    return P.svg(w, h, s);
  };

  // Coordination diagram (from CV: clients, consultants, contractors, suppliers, workshops & factories, site teams)
  P.coordination = function (w, h, nodes) {
    var cx = w / 2, cy = h / 2 - 1, R = Math.min(w, h) * .38, s = '';
    s += P.circle(cx, cy, 8.5, { fill: C.tint, stroke: C.bronze, w: W.med });
    s += P.text(cx, cy - .6, 'Design &', { anchor: 'middle', size: 2.3, serif: true }) + P.text(cx, cy + 2.4, 'coordination', { anchor: 'middle', size: 2.3, serif: true });
    nodes.forEach(function (n, i) {
      var ang = -Math.PI / 2 + i * 2 * Math.PI / nodes.length, x = cx + Math.cos(ang) * R * 1.15, y = cy + Math.sin(ang) * R;
      s += P.line(cx + Math.cos(ang) * 8.5, cy + Math.sin(ang) * 8.5, x - Math.cos(ang) * 3, y - Math.sin(ang) * 3, W.thin, C.mid);
      s += P.circle(x, y, 1.2, { fill: C.bronze, stroke: 'none' });
      s += P.text(x + (Math.cos(ang) > .2 ? 2.2 : Math.cos(ang) < -.2 ? -2.2 : 0), y + (Math.abs(Math.cos(ang)) <= .2 ? (Math.sin(ang) < 0 ? -2 : 3.6) : .8), n, { anchor: Math.cos(ang) > .2 ? 'start' : Math.cos(ang) < -.2 ? 'end' : 'middle', size: 2.2 });
    });
    return P.svg(w, h, s);
  };

  // Drawing conventions legend (line weights, hatches, symbols)
  P.conventions = function (w, h) {
    var s = '', col = w / 4;
    s += P.caps(0, 3, 'Line weights', { size: 2.1, fill: C.mid });
    [['Cut', W.cut], ['Heavy', W.heavy], ['Medium', W.med], ['Fine', W.fine]].forEach(function (l, i) { s += P.line(0, 8 + i * 5, 14, 8 + i * 5, l[1]) + P.text(17, 8.8 + i * 5, l[0] + ' · ' + l[1] + ' mm', { size: 2.15 }); });
    s += P.caps(col, 3, 'Hatches', { size: 2.1, fill: C.mid });
    [['cc', 'Masonry / wall'], ['dot', 'Concrete / gypsum'], ['tim', 'Timber / board'], ['up', 'Upholstery'], ['st', 'Stone / marble']].forEach(function (x, i) { s += P.rect(col, 5.5 + i * 4.4, 8, 3.2, { fill: P.fill(x[0]), w: W.fine }) + P.text(col + 10, 8 + i * 4.4, x[1], { size: 2.15 }); });
    s += P.caps(col * 2, 3, 'Symbols', { size: 2.1, fill: C.mid });
    s += P.marker(col * 2 + 4, 10, 'E1', 0) + P.text(col * 2 + 11, 10.8, 'Elevation / section', { size: 2.15 });
    s += P.bubble(col * 2 + 4, 19, 'A', 2.2) + P.text(col * 2 + 11, 19.8, 'Grid reference', { size: 2.15 });
    s += P.circle(col * 2 + 4, 27, 2.1, { fill: C.paper, stroke: C.bronze }) + P.text(col * 2 + 4, 27.8, '3', { anchor: 'middle', size: 2.1, weight: 600, fill: C.bronze }) + P.text(col * 2 + 11, 27.8, 'Finish / note key', { size: 2.15 });
    s += P.caps(col * 3, 3, 'Dimensioning', { size: 2.1, fill: C.mid });
    s += P.dim(col * 3, 12, col * 3 + 34, 12, '1 200', -1) + P.text(col * 3, 20, 'mm, to finished faces', { size: 2.15 }) + P.text(col * 3, 24, 'CH = clear ceiling height', { size: 2.15 }) + P.text(col * 3, 28, 'NTS = not to scale', { size: 2.15 });
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

  window.CAD = P;
})();
