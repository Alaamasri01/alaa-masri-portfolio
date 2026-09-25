/*
 * CAD v2 — professional drafting library for the portfolio (SVG, paper millimetres).
 *
 * Conventions (plotted weights, mm):
 *   cut 0.55 · major outline 0.35 · secondary 0.25 · joinery/fixtures 0.18
 *   dimensions/leaders 0.15 · hatches 0.12 · grid/reference 0.10
 * Text (font size, mm): annotation 2.75 · dimensions 2.65 · markers 3.0–3.3 · drawing titles 4.0
 *   → nothing below 7.5 pt in print.
 *
 * AUTHENTICITY: every sheet carries its status (conceptual space study, design development
 * diagram, concept detail, representative example) in the sheet title block and the drawing
 * titles. Project drawings are readings of named renders; dimension strings on project drawings
 * are named, not measured. Only the representative examples carry typical numeric sizes.
 */
(function () {
  'use strict';
  var INK = '#1c1b19', GREY = '#6b665e', LIGHT = '#a39d92', LED = '#a8743a', PAPER = '#f4f1eb';
  var W = { cut: .55, major: .35, sec: .25, fix: .18, dim: .15, hatch: .12, ref: .1 };
  var T = { note: 2.75, dim: 2.65, mark: 3.0, ref: 3.3, title: 4.0 };
  var clipN = 0;
  function n(v) { return Math.round(v * 100) / 100; }
  function at(o) { var s = ''; for (var k in o) if (o[k] !== undefined && o[k] !== null && o[k] !== false) s += ' ' + k + '="' + o[k] + '"'; return s; }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  var D = { INK: INK, GREY: GREY, LIGHT: LIGHT, LED: LED, PAPER: PAPER, W: W, T: T };
  // Dark pages: ivory linework on the dark ground (same weights and sizes).
  D.theme = function (dark) {
    INK = dark ? '#ece7dc' : '#1c1b19'; GREY = dark ? '#b3aea3' : '#6b665e'; LIGHT = dark ? '#77746b' : '#a39d92'; LED = dark ? '#c9a676' : '#a8743a'; PAPER = dark ? '#151612' : '#f4f1eb';
    D.INK = INK; D.GREY = GREY; D.LIGHT = LIGHT; D.LED = LED; D.PAPER = PAPER;
    if (window.CAD && window.CAD.C) { var K = window.CAD.C; K.ink = INK; K.mid = GREY; K.light = LIGHT; K.bronze = LED; K.paper = PAPER; K.tint = dark ? '#2a2d24' : '#e6ded1'; K.tint2 = dark ? '#23261e' : '#efe8dc'; }
  };

  D.svg = function (w, h, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + 'mm" height="' + h + 'mm" style="display:block;overflow:visible" font-family="Inter, Helvetica, Arial, sans-serif" stroke-linecap="butt" stroke-linejoin="miter">' + body + '</svg>';
  };
  D.L = function (x1, y1, x2, y2, w, c, dash) { return '<line' + at({ x1: n(x1), y1: n(y1), x2: n(x2), y2: n(y2), stroke: c || INK, 'stroke-width': w || W.sec, 'stroke-dasharray': dash }) + '/>'; };
  D.R = function (x, y, w, h, o) {
    o = o || {};
    var s = '';
    if (o.hatch) s += D.hatch(o.hatch, x, y, w, h, '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"/>', o.hc);
    return (o.fill && o.under ? '' : '') + (o.fill ? '<rect' + at({ x: n(x), y: n(y), width: n(w), height: n(h), fill: o.fill, stroke: 'none' }) + '/>' : '') + s +
      (o.stroke === 'none' ? '' : '<rect' + at({ x: n(x), y: n(y), width: n(w), height: n(h), fill: 'none', stroke: o.stroke || INK, 'stroke-width': o.w || W.sec, 'stroke-dasharray': o.dash, rx: o.rx }) + '/>');
  };
  D.P = function (d, o) { o = o || {}; return '<path' + at({ d: d, fill: o.fill || 'none', stroke: o.stroke === undefined ? INK : o.stroke, 'stroke-width': o.w || W.sec, 'stroke-dasharray': o.dash, 'stroke-linejoin': o.join }) + '/>'; };
  D.C = function (x, y, r, o) { o = o || {}; return '<circle' + at({ cx: n(x), cy: n(y), r: r, fill: o.fill || 'none', stroke: o.stroke === undefined ? INK : o.stroke, 'stroke-width': o.w || W.fix, 'stroke-dasharray': o.dash }) + '/>'; };
  D.Tx = function (x, y, t, o) {
    o = o || {};
    var str = o.caps ? String(t).toUpperCase() : t;
    return '<text' + at({ x: n(x), y: n(y), 'font-size': o.size || T.note, fill: o.fill || INK, 'text-anchor': o.anchor, 'font-weight': o.weight || 400, 'letter-spacing': o.ls !== undefined ? o.ls : (o.caps ? .18 : undefined), transform: o.rot ? 'rotate(' + o.rot + ' ' + n(x) + ' ' + n(y) + ')' : undefined, 'font-family': o.serif ? 'Instrument Serif, Georgia, serif' : undefined, 'font-style': o.italic ? 'italic' : undefined }) + '>' + esc(str) + '</text>';
  };

  /* ---------- Hatches: clipped vector lines (never SVG patterns) ---------- */
  D.hatch = function (type, x, y, w, h, clip, col) {
    var id = 'k' + (clipN++), s = '', c = col || GREY, i, sw = W.hatch;
    function diag(step, dir) { var o = ''; for (i = -h; i < w + h; i += step) o += dir > 0 ? D.L(x + i, y + h, x + i + h, y, sw, c) : D.L(x + i, y, x + i + h, y + h, sw, c); return o; }
    if (type === 'masonry') s = diag(1.8, 1);
    else if (type === 'brick') s = diag(1.8, 1) + diag(1.8, -1);
    else if (type === 'mdf') { sw = .1; s = diag(.9, -1); }
    else if (type === 'ply') { sw = .1; for (i = y + .5; i < y + h; i += .9) s += D.L(x, i, x + w, i, sw, c); }
    else if (type === 'stone') { s = diag(1.3, -1); }
    else if (type === 'grainV') { sw = .1; c = col || LIGHT; for (i = x + .8; i < x + w; i += 1.6) s += D.L(i, y, i + ((i * 7) % 3 - 1) * .15, y + h, sw, c); }
    else if (type === 'grainH') { sw = .1; c = col || LIGHT; for (i = y + .6; i < y + h; i += 1.2) s += D.L(x, i, x + w, i, sw, c); }
    else if (type === 'gyp') { var dd = ''; for (var yy = y + .6; yy < y + h; yy += 1.2) for (var xx = x + .6 + ((yy * 10) % 2 ? .6 : 0); xx < x + w; xx += 1.2) dd += 'M' + n(xx) + ' ' + n(yy) + 'h.25'; s = '<path d="' + dd + '" stroke="' + c + '" stroke-width=".2" fill="none"/>'; }
    else if (type === 'conc') { var d2 = ''; for (var y3 = y + 1; y3 < y + h; y3 += 2.2) for (var x3 = x + 1 + ((y3 * 3) % 2); x3 < x + w; x3 += 2.6) d2 += 'M' + n(x3) + ' ' + n(y3) + 'l.5 -.8l.5 .8z'; s = '<path d="' + d2 + '" stroke="' + c + '" stroke-width=".1" fill="none"/>' + diag(3.2, 1); }
    else if (type === 'uph') { for (var r = y; r < y + h + 1.6; r += 1.6) { var p = 'M' + n(x) + ' ' + n(r + 1.2); for (var k = x; k < x + w; k += 1.6) p += ' Q' + n(k + .8) + ' ' + n(r - .2) + ' ' + n(k + 1.6) + ' ' + n(r + 1.2); s += '<path d="' + p + '" fill="none" stroke="' + c + '" stroke-width=".1"/>'; } }
    else if (type === 'insul') { var z = 'M' + n(x) + ' ' + n(y + h); var step = Math.max(1.2, h * .5); for (var q = x; q < x + w; q += step) z += ' L' + n(q + step / 2) + ' ' + n(y) + ' L' + n(q + step) + ' ' + n(y + h); s = '<path d="' + z + '" fill="none" stroke="' + c + '" stroke-width=".12"/>'; }
    else if (type === 'glass') { for (i = 0; i < 3; i++) s += D.L(x + w * .2 + i * 1.2, y + h * .35, x + w * .2 + i * 1.2 + 2.2, y + h * .35 - 2.2, .1, c); return s; }
    return '<clipPath id="' + id + '">' + clip + '</clipPath><g clip-path="url(#' + id + ')">' + s + '</g>';
  };
  // Timber batten cut in section: rectangle with a cross
  D.batten = function (x, y, w, h) { return D.R(x, y, w, h, { w: W.fix }) + D.L(x, y, x + w, y + h, .1) + D.L(x + w, y, x, y + h, .1); };

  /* ---------- Dimensions (architectural oblique ticks) ---------- */
  function tick(x, y) { return D.L(x - .9, y + .9, x + .9, y - .9, W.major); }
  // Horizontal chain: xs = [x0, x1, …], y = dimension line, yo = object edge (for extension lines), labels per segment
  D.dimH = function (xs, y, yo, labels, o) {
    o = o || {}; var s = '', dir = yo > y ? 1 : -1;
    xs.forEach(function (x) { s += D.L(x, yo - dir * 1.2, x, y - dir * 1.4, W.ref, INK); s += tick(x, y); });
    s += D.L(xs[0] - 1.6, y, xs[xs.length - 1] + 1.6, y, W.dim);
    for (var i = 0; i < xs.length - 1; i++) if (labels[i]) s += D.Tx((xs[i] + xs[i + 1]) / 2, y - 1.1, labels[i], { size: T.dim, anchor: 'middle', fill: o.col });
    return s;
  };
  D.dimV = function (ys, x, xo, labels, o) {
    o = o || {}; var s = '', dir = xo > x ? 1 : -1;
    ys.forEach(function (y) { s += D.L(xo - dir * 1.2, y, x - dir * 1.4, y, W.ref, INK); s += tick(x, y); });
    s += D.L(x, ys[0] - 1.6, x, ys[ys.length - 1] + 1.6, W.dim);
    for (var i = 0; i < ys.length - 1; i++) if (labels[i]) s += D.Tx(x - 1.1, (ys[i] + ys[i + 1]) / 2, labels[i], { size: T.dim, anchor: 'middle', rot: -90 });
    return s;
  };

  /* ---------- Symbols ---------- */
  D.grid = function (x1, y1, x2, y2) { return D.L(x1, y1, x2, y2, W.ref, GREY, '7 1.4 1 1.4'); };
  D.bubble = function (x, y, t) { return D.C(x, y, 3.3, { fill: PAPER, w: W.sec }) + D.Tx(x, y + 1.15, t, { size: T.ref, anchor: 'middle', weight: 500 }); };
  D.cl = function (x, y1, y2, labelY) { return D.L(x, y1, x, y2, W.ref, GREY, '9 1.4 1.4 1.4') + D.Tx(x + 1.2, labelY, 'CL', { size: T.dim, fill: GREY, weight: 500 }); };
  // Datum / level marker
  D.level = function (x, y, label, anchor) {
    var s = D.P('M' + n(x) + ' ' + n(y) + ' l-1.6 -2.6 h3.2 z', { fill: INK, stroke: 'none' }) + D.L(x - 2.4, y, x + (anchor === 'end' ? -16 : 16), y, W.dim);
    return s + D.Tx(x + (anchor === 'end' ? -2.6 : 2.6), y - 1.2, label, { size: T.dim, anchor: anchor === 'end' ? 'end' : 'start', weight: 500 });
  };
  // Section / detail reference marker: split circle, number over sheet, filled pointer
  D.secMark = function (x, y, num, sheet, ang) {
    var r = 5.4, a = (ang || 0) * Math.PI / 180, s = '';
    if (ang !== null && ang !== undefined) {
      var px = x + Math.cos(a) * (r + 2.4), py = y + Math.sin(a) * (r + 2.4), l = a + 1.15, rr = a - 1.15;
      s += D.P('M' + n(x + Math.cos(l) * r) + ' ' + n(y + Math.sin(l) * r) + ' L' + n(px) + ' ' + n(py) + ' L' + n(x + Math.cos(rr) * r) + ' ' + n(y + Math.sin(rr) * r) + ' Z', { fill: INK, stroke: 'none' });
    }
    s += D.C(x, y, r, { fill: PAPER, w: W.sec }) + D.L(x - r, y, x + r, y, W.fix);
    s += D.Tx(x, y - 1.3, num, { size: T.mark, anchor: 'middle', weight: 600 }) + D.Tx(x, y + 3.5, sheet, { size: 2.65, anchor: 'middle' });
    return s;
  };
  D.cutLine = function (x1, y1, x2, y2) { return D.L(x1, y1, x2, y2, W.major, INK, '8 1.4 1.4 1.4'); };
  D.detailCircle = function (x, y, r) { return D.C(x, y, r, { w: W.fix, dash: '2 1' }); };
  // Keynote: dot on the element, leader, numbered circle
  D.key = function (x, y, tx, ty, num, o) {
    o = o || {}; var r = 2.7, dx = tx - x, dy = ty - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
    var s = (d > r + .5 ? D.L(x, y, tx - dx / d * r, ty - dy / d * r, W.dim) + D.C(x, y, .55, { fill: INK, stroke: 'none' }) : '');
    return s + D.C(tx, ty, r, { fill: PAPER, w: W.fix }) + D.Tx(tx, ty + .95, num, { size: T.note, anchor: 'middle', weight: 600 });
  };
  // Finish tag: leader to a boxed material code
  D.code = function (x, y, tx, ty, code, anchor) {
    var w = code.length * 1.72 + 3.4, x0 = anchor === 'end' ? tx - w : tx, s = '';
    var ax = anchor === 'end' ? tx : tx;
    s += D.L(x, y, ax, ty, W.dim) + D.C(x, y, .55, { fill: INK, stroke: 'none' });
    s += D.R(x0, ty - 2.5, w, 5, { fill: PAPER, w: W.fix }) + D.Tx(x0 + w / 2, ty + .95, code, { size: T.dim, anchor: 'middle', weight: 600, ls: .1 });
    return s;
  };
  D.arrowHead = function (x, y, ang, sz) { var a = ang * Math.PI / 180, s = sz || 1.8; return D.P('M' + n(x) + ' ' + n(y) + ' L' + n(x - Math.cos(a - .38) * s) + ' ' + n(y - Math.sin(a - .38) * s) + ' L' + n(x - Math.cos(a + .38) * s) + ' ' + n(y - Math.sin(a + .38) * s) + ' Z', { fill: GREY, stroke: 'none' }); };
  D.led = function (x1, y1, x2, y2) { return D.L(x1, y1, x2, y2, W.sec, LED, '1.6 .6'); };

  /* ---------- Drawing title (per drawing) and sheet title block (per page) ---------- */
  // num: drawing number on the sheet, sheet: sheet reference, title, sub: scale · status · source
  D.drawingTitle = function (w, num, sheet, title, sub) {
    var s = D.C(5.5, 5.5, 5.4, { w: W.sec }) + D.L(.1, 5.5, 10.9, 5.5, W.fix) + D.Tx(5.5, 4.2, num, { size: T.mark, anchor: 'middle', weight: 600 }) + D.Tx(5.5, 9, sheet, { size: 2.65, anchor: 'middle' });
    s += D.Tx(14, 4.8, title, { size: T.title, weight: 600, caps: true, ls: .12 }) + D.L(14, 6.4, w, 6.4, W.cut);
    s += D.Tx(14, 10.6, sub, { size: T.note, fill: GREY, caps: true, ls: .14 });
    return D.svg(w, 12, s);
  };
  // f: project, title, no, status, scale, issue
  D.sheetBlock = function (w, f) {
    var h = 17, cols = [['Project', f.project, .17], ['Sheet title', f.title, .27], ['Dwg no.', f.no, .12], ['Status', f.status, .23], ['Scale', f.scale, .11], ['Issue', f.issue || '2026–27', .1]];
    var tot = cols.reduce(function (a, c) { return a + c[2]; }, 0), x = 0, s = D.R(0, 0, w, h, { w: W.major });
    cols.forEach(function (c, i) {
      var cw = w * c[2] / tot;
      if (i) s += D.L(x, 0, x, h, W.fix);
      s += D.Tx(x + 2, 4.6, c[0], { size: 2.65, caps: true, fill: GREY, ls: .16 });
      var big = i === 1, bold = i === 2;
      s += D.Tx(x + 2, big ? 12.6 : 12.2, c[1], { size: big ? 4.2 : (bold ? 3.5 : 2.85), weight: bold || i === 3 ? 600 : 400, serif: big, fill: i === 3 ? LED : INK });
      x += cw;
    });
    return D.svg(w, h, s);
  };

  window.CAD2 = D;
})();
