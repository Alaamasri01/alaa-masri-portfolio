/*
 * Portfolio book — page assembly.
 * 1. Expands the small templates (metadata rows, tables, sheets) from verified copy.
 * 2. Numbers pages, assigns verso/recto, writes folios, contents and project index.
 * 3. Lays the pages out for the requested output mode (URL hash):
 *      (none)   proof — spreads on a desk          #guides  proof + 8 mm safe-zone lines
 *      #screen  trim-size pages, screen images      #print   3 mm bleed, print images
 *      #marks   bleed + crop marks on a slug sheet
 */
(function () {
  'use strict';

  var mode = (location.hash || '').replace('#', '') || 'proof';
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pages = $('#book > .page');

  /* ---------- Verified copy ---------- */
  // Process — website "One vision. Every step."
  var STEPS = [
    ['Envision', 'Listen. Explore. Find the direction.', 'Understand the brief, study the space and develop a concept that balances aesthetics with everyday function.'],
    ['Develop', 'Refine the idea. Resolve the details.', 'Translate the vision into layouts, materials, technical drawings and clear quantities and cost estimates.'],
    ['Deliver', 'Coordinate. Bring it to life.', 'Work with clients, contractors, suppliers and site teams to resolve challenges and maintain quality through handover.']
  ];
  // Concept-to-execution chain — condensed from the CV responsibilities.
  var CHAIN = ['Technical drawings', 'Shop drawing coordination', 'BOQ, take-off & cost estimation', 'Material & sample review', 'Supplier & factory coordination', 'Site inspections & quality control', 'Handover'];
  // Interior fit-out works — profile, verbatim.
  var FITOUT = ['Gypsum & decorative ceilings', 'Woodwork & joinery', 'Wall cladding', 'Decorative panels', 'Stone & marble works', 'Steel & metal fabrication', 'Glass works', 'Lighting coordination', 'Custom furniture manufacturing'];
  // Coordination partners — profile summary and CV responsibilities.
  var COORD = ['Clients', 'Consultants', 'Contractors & subcontractors', 'Suppliers', 'Carpentry workshops & steel fabricators', 'Stone & glass suppliers', 'Factories', 'Site teams'];
  // Drawing register — empty sheets only.
  var SHEETS = [
    ['T-01', 'Plans', 'Layout · reflected ceiling', 24, 52, 113.3, 86],
    ['T-02', 'Elevations', 'Sections', 141.3, 52, 54.7, 86],
    ['T-03', 'Joinery details', '', 24, 144, 54.7, 60],
    ['T-04', 'Shop drawings', '', 82.7, 144, 54.7, 60],
    ['T-05', 'BOQ excerpt', 'Anonymised', 141.3, 144, 54.7, 60],
    ['T-06', 'Material schedule', 'Finishes · samples', 24, 210, 84, 68],
    ['T-07', 'Site coordination', 'Execution record', 112, 210, 84, 68]
  ];
  // Responsibilities — CV page 2, verbatim, grouped.
  var RESP = [
    ['Design', ['Developing creative, functional interior concepts.', 'Space planning and furniture layouts.', 'Mood boards; selecting materials, finishes, colours and furniture.', 'Designing luxury residential interiors — TV and feature walls, entrances, ceilings, partitions, custom furniture.']],
    ['Technical', ['Technical drawings and shop-drawing coordination for execution.', 'BOQs, quantity take-offs and cost estimations.', 'Pricing interior works; quotations with suppliers and subcontractors.']],
    ['Coordination', ['Coordinating carpentry workshops, steel fabricators, stone and glass suppliers.', 'Reviewing samples against project specifications.', 'Coordinating clients, contractors, suppliers, factories and site teams.']],
    ['Execution', ['Following up execution; resolving technical and design issues.', 'Site inspections and quality control.', 'Managing detail from design approval to final handover.']]
  ];

  function fill(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var TBC = '<span class="val tbc">To confirm</span>';

  fill('exp', window.EXP.map(function (e, i) {
    return '<div style="display:grid; grid-template-columns:8mm 42mm 1fr; border-top:.3pt solid var(--rule); padding-top:2.3mm; height:25.5mm">' +
      '<span class="num" style="font-size:11pt; line-height:1.2">' + pad(i + 1) + '</span>' +
      '<span class="serif" style="font-size:18pt; line-height:1.02; padding-right:3mm">' + e[0] + '</span>' +
      '<span><span class="cap" style="display:block; font-size:6.8pt">' + e[1] + '</span><span class="cap" style="display:block; margin-top:1.3mm; color:var(--muted)">' + e[2] + '</span></span></div>';
  }).join(''));

  fill('steps', STEPS.map(function (s, i) {
    var x = [24, 82.7, 141.3][i];
    return '<div class="cell" style="top:212mm; left:' + x + 'mm; width:54.7mm">' +
      '<div class="num" style="font-size:24pt; line-height:1">' + pad(i + 1) + '</div>' +
      '<div class="serif" style="font-size:20pt; line-height:1.1; margin-top:3mm">' + s[0] + '</div>' +
      '<div class="serif it" style="font-size:11pt; line-height:1.25; color:var(--ink-2); margin:1.5mm 0 3mm">' + s[1] + '</div>' +
      '<div class="body">' + s[2] + '</div></div>';
  }).join(''));

  function numberedRows(list) {
    return list.map(function (c, i) {
      return '<div class="row" style="grid-template-columns:8mm 1fr; padding:.8mm 0 1mm"><span class="num" style="font-size:9pt">' + pad(i + 1) + '</span><span class="val">' + c + '</span></div>';
    }).join('');
  }
  fill('chain', numberedRows(CHAIN));
  fill('fitout', numberedRows(FITOUT));
  fill('coord', numberedRows(COORD));

  fill('sheets', SHEETS.map(function (s) {
    return '<div class="sheet" style="left:' + s[3] + 'mm; top:' + s[4] + 'mm; width:' + s[5] + 'mm; height:' + s[6] + 'mm">' +
      '<div class="sheet__head"><span>' + s[1] + '</span><span>' + s[2] + '</span></div>' +
      '<div class="sheet__note">Reserved — to be supplied</div>' +
      '<div class="sheet__tb"><span><b>' + s[0] + '</b></span><span>Proj. TBC</span><span>Scale TBC</span></div></div>';
  }).join(''));

  fill('career', '<div class="row" style="grid-template-columns:52mm 52mm 40mm 1fr"><span class="lbl lbl--m">Position</span><span class="lbl lbl--m">Employer / studio</span><span class="lbl lbl--m">Location</span><span class="lbl lbl--m">Years</span></div>' +
    [1, 2, 3].map(function () {
      return '<div class="row" style="grid-template-columns:52mm 52mm 40mm 1fr">' + TBC + TBC + TBC + TBC + '</div>';
    }).join(''));

  fill('resp', RESP.map(function (g) {
    return '<div style="border-top:.3pt solid var(--rule); padding-top:2.1mm"><div class="lbl lbl--m" style="margin-bottom:2mm">' + g[0] + '</div>' +
      g[1].map(function (t) { return '<div class="cap" style="margin-bottom:1.6mm">' + t + '</div>'; }).join('') + '</div>';
  }).join(''));

  // Five-cell metadata row: Category · Location · Year · Role · Scope
  $('[data-meta5]').forEach(function (el) {
    var x = el.dataset.meta5 === 'recto' ? [24, 82.7, 112, 141.3, 170.7] : [14, 72.7, 102, 131.3, 160.7];
    var top = el.dataset.top;
    var cells = [['Category', '<div class="val">' + el.dataset.cat + '</div>', 54.7], ['Location', TBC, 25.3], ['Year', TBC, 25.3], ['Role', TBC, 25.3], ['Scope', TBC, 25.3]];
    el.outerHTML = cells.map(function (c, i) {
      return '<div class="cell" style="top:' + top + 'mm; left:' + x[i] + 'mm; width:' + c[2] + 'mm"><div class="lbl lbl--m">' + c[0] + '</div>' + c[1].replace('span', 'div').replace('</span>', '</div>') + '</div>';
    }).join('');
  });
  // Six-row project facts table
  $('[data-rows]').forEach(function (el) {
    var x = el.dataset.rows === 'recto' ? 24 : 14;
    var rows = [['Category', '<span class="val">' + el.dataset.cat + '</span>'], ['Location', TBC], ['Year', TBC], ['Status', TBC], ['Role', TBC], ['Scope', TBC]];
    el.outerHTML = '<div class="abs rows" style="top:' + el.dataset.top + 'mm; left:' + x + 'mm; width:84mm">' +
      rows.map(function (r) { return '<div class="row"><span class="lbl lbl--m">' + r[0] + '</span>' + r[1] + '</div>'; }).join('') + '</div>';
  });
  // Design-intent placeholder
  $('[data-intent]').forEach(function (el) {
    var x = el.dataset.intent === 'recto' ? 112 : 102;
    el.outerHTML = '<div class="cell" style="top:' + el.dataset.top + 'mm; left:' + x + 'mm; width:84mm"><div class="lbl lbl--m">Design intent</div><div class="body tbc">To confirm — two or three sentences in Alaa’s words.</div></div>';
  });

  /* ---------- Numbering, sides, folios ---------- */
  var section = '';
  var problems = [];
  pages.forEach(function (p, i) {
    var n = i + 1;
    var side = n % 2 === 0 ? 'verso' : 'recto';
    p.classList.add(side);
    p.dataset.page = n;
    if (p.dataset.side && p.dataset.side !== side) problems.push('Page ' + n + ' designed as ' + p.dataset.side + ' but falls on ' + side);
    section = p.dataset.section || section;
    if (!p.classList.contains('no-folio')) {
      p.insertAdjacentHTML('beforeend', '<div class="folio"><b>' + pad(n) + '</b><span>' + section + '</span></div>');
    }
  });
  window.bookProblems = problems;
  // Page references: <span data-pref="walnut"></span> → number of the page carrying data-anchor="walnut"
  $('[data-pref]').forEach(function (el) {
    var t = document.querySelector('[data-anchor="' + el.dataset.pref + '"]');
    if (t) el.textContent = pad(+t.dataset.page); else problems.push('Missing anchor ' + el.dataset.pref);
  });

  fill('toc', pages.filter(function (p) { return p.dataset.toc; }).map(function (p) {
    var sub = p.dataset.tocLevel === '2';
    var num = sub ? p.dataset.project.split('|')[0] : '';
    return '<div class="row" style="grid-template-columns:' + (sub ? '10mm 12mm' : '10mm 0mm') + ' 1fr 12mm; padding:' + (sub ? '1.4mm' : '2.4mm') + ' 0 ' + (sub ? '1.6mm' : '2.6mm') + '">' +
      '<span></span><span class="num" style="font-size:10pt">' + num + '</span>' +
      '<span class="serif" style="font-size:' + (sub ? '13pt' : '16pt') + '; line-height:1.1">' + p.dataset.toc + '</span>' +
      '<span class="lbl" style="text-align:right">' + pad(+p.dataset.page) + '</span></div>';
  }).join(''));

  fill('works', pages.filter(function (p) { return p.dataset.project; }).map(function (p) {
    var d = p.dataset.project.split('|');
    return '<div class="row" style="grid-template-columns:12mm 76mm 1fr 12mm; padding:2mm 0 2.2mm">' +
      '<span class="num" style="font-size:11pt">' + d[0] + '</span><span class="serif" style="font-size:15pt; line-height:1.1">' + d[1] + '</span>' +
      '<span class="lbl lbl--m">' + d[2] + '</span><span class="lbl" style="text-align:right">' + pad(+p.dataset.page) + '</span></div>';
  }).join(''));

  /* ---------- Output modes ---------- */
  function setPageSize(w, h) {
    var st = document.createElement('style');
    st.textContent = '@page { size: ' + w + 'mm ' + h + 'mm; margin: 0; }';
    document.head.appendChild(st);
  }
  function swapImages(dir) {
    $('img').forEach(function (img) {
      img.src = img.getAttribute('src').replace('../../', dir + '/').replace(/\.webp$/, '.jpg');
    });
  }
  var book = document.getElementById('book');

  if (mode === 'screen') {
    swapImages('img-screen');
    setPageSize(210, 297);
    pages.forEach(function (p) { p.style.breakAfter = 'page'; });
  } else if (mode === 'print' || mode === 'marks') {
    swapImages('img-print');
    pages.forEach(function (p) {
      var bleed = document.createElement('div');
      bleed.className = 'bleed' + (p.classList.contains('dark') ? ' dark' : '');
      p.parentNode.insertBefore(bleed, p);
      bleed.appendChild(p);
      if (mode === 'marks') {
        var slug = document.createElement('div');
        slug.className = 'slug';
        bleed.parentNode.insertBefore(slug, bleed);
        slug.appendChild(bleed);
        // Crop marks: 0.25 pt, 5 mm long, offset 3 mm outside the trim (outside the bleed).
        var t = 13, b = 13 + 297, l = 13, r = 13 + 210, len = 5, off = 3, w = 0.09;
        var marks = [
          [l - off - len, t, len, w], [l, t - off - len, w, len], [r + off, t, len, w], [r, t - off - len, w, len],
          [l - off - len, b, len, w], [l, b + off, w, len], [r + off, b, len, w], [r, b + off, w, len]
        ];
        marks.forEach(function (m) {
          slug.insertAdjacentHTML('beforeend', '<div class="cropmark" style="left:' + m[0] + 'mm; top:' + m[1] + 'mm; width:' + m[2] + 'mm; height:' + m[3] + 'mm"></div>');
        });
        slug.insertAdjacentHTML('beforeend', '<div class="slug__info">Alaa Masri — Portfolio 2026–2027 · page ' + p.dataset.page + ' / ' + pages.length + ' · A4 210 × 297 mm trim · 3 mm bleed</div>');
      }
    });
    if (mode === 'print') setPageSize(216, 303); else setPageSize(236, 323);
  } else {
    // Proof: cover alone, then spreads, back cover alone.
    document.body.classList.add('proof');
    if (mode === 'guides') document.body.classList.add('guides');
    setPageSize(450, 320);
    var rows = [[pages[0]]];
    for (var i = 1; i < pages.length - 1; i += 2) rows.push(pages.slice(i, i + 2));
    rows.push([pages[pages.length - 1]]);
    rows.forEach(function (group) {
      var row = document.createElement('div');
      row.className = 'spreadrow' + (group.length === 2 ? ' spreadrow--two' : '');
      book.appendChild(row);
      group.forEach(function (p) { row.appendChild(p); });
      row.insertAdjacentHTML('beforeend', '<div class="spreadrow__no">' + group.map(function (p) { return pad(+p.dataset.page); }).join(' — ') + '</div>');
    });
  }
  document.documentElement.dataset.ready = '1';
})();
