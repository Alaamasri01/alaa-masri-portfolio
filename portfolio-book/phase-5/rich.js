/*
 * Phase 5 — rich layout helpers.
 *   <div class="crop" data-img="projects/x.webp" data-r="x,y,w,h"> — detail crop of a source region,
 *        height follows the region's aspect; image is never stretched.
 *   <div class="cad" data-cad="walnutPlan" data-w data-h [data-dark]> — CAD drawing from cad.js
 *   <div class="chip" data-pal="walnut"> — colour sampled from the renders (palette.js)
 */
(function () {
  'use strict';
  function dims(src) {
    if (/walnut-suite-04/.test(src)) return [1344, 768];
    if (/earth-toned-majlis-0[245]/.test(src)) return [1344, 756];
    if (/selection-(08|10)/.test(src)) return [1195, 1600];
    if (/selection-(07|12)/.test(src)) return [1600, 1600];
    if (/selection-(01|02|09)/.test(src)) return [1600, 893];
    if (/gallery\//.test(src)) return [1600, 1195];
    return [1800, 1005];
  }
  document.querySelectorAll('.crop').forEach(function (el) {
    var r = el.dataset.r.split(',').map(Number), src = el.dataset.img, n = dims(src);
    var bw = parseFloat(el.style.width), k = bw / r[2];
    if (!el.style.height) el.style.height = (r[3] * k).toFixed(2) + 'mm';
    var bh = parseFloat(el.style.height); k = Math.max(bw / r[2], bh / r[3]);
    el.innerHTML = '<img src="../../' + src + '" alt="" style="width:' + (n[0] * k).toFixed(2) + 'mm; height:' + (n[1] * k).toFixed(2) + 'mm; left:' + (-r[0] * k).toFixed(2) + 'mm; top:' + (-r[1] * k).toFixed(2) + 'mm">' + el.innerHTML;
    el.dataset.ppi = Math.round(r[2] / (bw / 25.4));
  });
  document.querySelectorAll('.cad[data-cad]').forEach(function (el) {
    var fn = window.CAD[el.dataset.cad], w = +el.dataset.w, h = +el.dataset.h;
    var args = [w, h];
    if (el.dataset.arg) args.push(JSON.parse(el.dataset.arg));
    if (el.dataset.dark) { window.CAD.theme(true); }
    el.innerHTML = fn.apply(null, args);
    window.CAD.theme(false);
  });
  document.querySelectorAll('.chip').forEach(function (el) {
    var p = window.PAL[el.dataset.pal];
    el.querySelector('i').style.background = p.hex;
    var t = el.querySelector('span');
    if (t) t.innerHTML = '<b>' + (el.dataset.name || p.label) + '</b>' + p.hex + (el.dataset.nosrc ? '' : ' · Fig. ' + p.src.match(/(\d+)\.webp$/)[1]);
  });
  document.querySelectorAll('.gridpaper').forEach(function (el) {
    var w = 216, h = 303, s = '';
    for (var x = -2; x <= w; x += 5) s += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + h + '" stroke="' + ((x - 3) % 25 === 0 ? '#cdc4b5' : '#e3dccf') + '" stroke-width="' + ((x - 3) % 25 === 0 ? .16 : .08) + '"/>';
    for (var y = -2; y <= h; y += 5) s += '<line x1="0" y1="' + y + '" x2="' + w + '" y2="' + y + '" stroke="' + ((y - 3) % 25 === 0 ? '#cdc4b5' : '#e3dccf') + '" stroke-width="' + ((y - 3) % 25 === 0 ? .16 : .08) + '"/>';
    el.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + 'mm" height="' + h + 'mm">' + s + '</svg>';
  });
  document.documentElement.dataset.ready = '1';
})();
