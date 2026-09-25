/* QC sample — assembles drawings, titles, sheet blocks, running heads, folios, and the #grid overlay. */
(function () {
  'use strict';
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var D = window.CAD2, WN = window.WALNUT;
  $('[data-dwg]').forEach(function (el) { el.innerHTML = WN[el.dataset.dwg](+el.dataset.w, +el.dataset.h); });
  $('[data-title]').forEach(function (el) { var t = JSON.parse(el.dataset.title); el.innerHTML = D.drawingTitle(t.w, t.num, t.sheet, t.title, t.sub); });
  $('[data-annot]').forEach(function (el) {
    var w = +el.dataset.w, k = w / 1800, s = '';
    JSON.parse(el.dataset.annot).forEach(function (a) { s += D.key(a[0] * k, a[1] * k, a[2] * k, a[3] * k, a[4]); });
    el.innerHTML = D.svg(w, +el.dataset.h, s);
  });
  $('.page').forEach(function (p) {
    var recto = p.classList.contains('recto'), x0 = recto ? 20 : 15;
    if (p.dataset.block) p.insertAdjacentHTML('beforeend', '<div class="dwg" style="left:' + x0 + 'mm; top:262.5mm">' + D.sheetBlock(175, JSON.parse(p.dataset.block)) + '</div>');
    if (p.dataset.rh) {
      var r = p.dataset.rh.split('|');
      p.insertAdjacentHTML('beforeend', '<div class="rh" style="left:' + x0 + 'mm">' + r[0] + '</div><div class="rh" style="right:' + (recto ? 15 : 20) + 'mm"><span>' + r[1] + '</span></div><div class="hair" style="left:' + x0 + 'mm; width:175mm; top:19.5mm"></div>');
    }
    if (p.dataset.folio) { var f = p.dataset.folio.split('|'); p.insertAdjacentHTML('beforeend', '<div class="folio"><b>' + f[0] + '</b><span>' + f[1] + '</span></div>'); }
    if (/grid/.test(location.hash)) {
      var g = '<div class="gridov">';
      for (var c = 0; c < 12; c++) g += '<div class="col" style="left:' + (x0 + c * 15) + 'mm"></div>';
      for (var b = 0; b <= 59; b++) g += '<div class="bl" style="top:' + (15 + b * 4.5) + 'mm' + (b % 5 === 0 ? '; border-top-color: rgba(40,120,200,.7)' : '') + '"></div>';
      g += '<div class="zone" style="top:262.5mm; height:17mm"></div><div class="m" style="left:' + x0 + 'mm; top:15mm; width:175mm; height:265.5mm"></div></div>';
      p.insertAdjacentHTML('beforeend', g);
    }
  });
  if (/print/.test(location.hash)) document.body.classList.remove('screen');
})();
