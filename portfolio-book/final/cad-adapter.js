/*
 * Adapter: exposes the project-drawing API (window.CAD) on top of the approved
 * CAD v2 standard (cad2.js). Every primitive is re-expressed with CAD v2 line
 * weights, vector hatches, oblique-tick dimensions, keynote bubbles, split-circle
 * markers and CAD v2 text sizes (never below 2.65 mm ≈ 7.5 pt). Title blocks are
 * no longer drawn inside the drawing: each drawing gets the standard CAD v2
 * drawing title on the page and each technical page one sheet title block.
 */
(function () {
  'use strict';
  var D = window.CAD2, DW = D.W, DT = D.T;
  var C = { ink: D.INK, mid: D.GREY, light: D.LIGHT, bronze: D.LED, tint: '#e6ded1', tint2: '#efe8dc', paper: D.PAPER };
  var W = { hair: DW.ref, fine: DW.dim, thin: DW.fix, med: DW.sec, heavy: DW.major, cut: DW.cut };
  var HATCH = { tim: 'ply', timv: 'grainV', st: 'stone', cc: 'masonry', dot: 'gyp', up: 'uph' };
  function sz(v) { return Math.max(v || DT.note, 2.65); }
  function nums(d) { return (d.match(/-?\d*\.?\d+/g) || []).map(Number); }

  var P = { C: C, W: W };
  P.theme = function (dark) { D.theme(!!dark); };
  P.svg = function (w, h, body) { return D.svg(w, h, body); };
  P.fill = function (name) { return 'H:' + (HATCH[name] || name); };
  P.line = function (x1, y1, x2, y2, w, c, dash) { return D.L(x1, y1, x2, y2, w || W.med, c || C.ink, dash); };
  P.rect = function (x, y, w, h, o) {
    o = o || {}; var f = o.fill || 'none', hatch = null;
    if (f.indexOf('H:') === 0) { hatch = f.slice(2); f = null; } else if (f === 'none') f = null;
    return D.R(x, y, w, h, { fill: f, hatch: hatch, stroke: o.stroke === undefined ? C.ink : (o.stroke === 'none' ? 'none' : o.stroke), w: o.w || W.med, dash: o.dash, rx: o.rx });
  };
  P.path = function (d, o) {
    o = o || {}; var f = o.fill || 'none', s = '';
    if (f.indexOf('H:') === 0) { var b = o.bbox; if (!b) { var n = nums(d), xs = n.filter(function (_, i) { return i % 2 === 0; }), ys = n.filter(function (_, i) { return i % 2 === 1; }); b = [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs) - Math.min.apply(null, xs), Math.max.apply(null, ys) - Math.min.apply(null, ys)]; } s += D.hatch(f.slice(2), b[0], b[1], b[2], b[3], '<path d="' + d + '"/>'); f = 'none'; }
    var out = s + D.P(d, { fill: f, stroke: o.stroke === undefined ? C.ink : o.stroke, w: o.w || W.med, dash: o.dash });
    if (o.arrow) { var n2 = nums(d), L = n2.length; out += D.arrowHead(n2[L - 2], n2[L - 1], Math.atan2(n2[L - 1] - n2[L - 3], n2[L - 2] - n2[L - 4]) * 180 / Math.PI); }
    return out;
  };
  P.circle = function (x, y, r, o) { o = o || {}; return D.C(x, y, r, { fill: o.fill, stroke: o.stroke === undefined ? C.ink : o.stroke, w: o.w || W.thin, dash: o.dash }); };
  P.text = function (x, y, t, o) { o = o || {}; return D.Tx(x, y, t, { size: sz(o.size), fill: o.fill, anchor: o.anchor, weight: o.weight, ls: o.ls, rot: o.rot, serif: o.serif, italic: o.italic }); };
  P.caps = function (x, y, t, o) { o = o || {}; return D.Tx(x, y, t, { size: sz(o.size), fill: o.fill, anchor: o.anchor, weight: o.weight || 500, ls: o.ls !== undefined ? Math.min(o.ls, .2) : .16, caps: true, rot: o.rot }); };
  P.dim = function (x1, y1, x2, y2, label, off) {
    off = off || 0;
    if (Math.abs(y2 - y1) < Math.abs(x2 - x1)) return D.dimH([x1, x2], y1 + off + (off > 0 ? 6 : off < 0 ? -2 : 0), y1, [label]);
    return D.dimV([y1, y2], x1 + off, x1, [label]);
  };
  P.bubble = function (x, y, t) { return D.bubble(x, y, t); };
  P.tag = function (x, y, tx, ty, n) { return D.key(x, y, tx, ty, n); };
  P.label = function (x, y, tx, ty, t, anchor) {
    var e = anchor === 'end';
    return D.L(x, y, tx, ty, DW.dim) + D.C(x, y, .55, { fill: C.ink, stroke: 'none' }) + D.L(tx, ty, tx + (e ? -2.5 : 2.5), ty, DW.dim) + D.Tx(tx + (e ? -3.2 : 3.2), ty + .95, t, { size: DT.note, anchor: e ? 'end' : 'start' });
  };
  P.marker = function (x, y, t, ang, sheet) { return D.secMark(x, y, t, sheet || '', ang || 0); };
  P.statusTag = function () { return ''; };
  P.titleBlock = function () { return ''; };
  P.grid = function (x0, y0, x1, y1, cols, rows) {
    var s = '';
    cols.forEach(function (c) { s += D.grid(c[0], y0 + 3.3, c[0], y1) + D.bubble(c[0], y0, c[1]); });
    rows.forEach(function (r) { s += D.grid(x0 + 3.3, r[0], x1, r[0]) + D.bubble(x0, r[0], r[1]); });
    return s;
  };
  P.arrow = function (d) { return P.path(d, { stroke: C.mid, w: DW.dim, dash: '2 1', arrow: true }); };
  window.CAD = P;
})();
