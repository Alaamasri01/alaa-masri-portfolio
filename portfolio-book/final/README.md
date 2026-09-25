# Portfolio book — final production source

Built on the approved QC master standard (`../07-qc-technical-grid-sample.md`).

| File | What it is |
|---|---|
| `book.html` | All 42 pages in reading order. Every position is a grid value: columns start at 15 + 15k mm (verso) or 20 + 15k mm (recto), and every top edge sits on 15 + 4.5n mm. |
| `final.css` | Master grid, type scale (7.5 pt minimum), light and dark pages, components and output modes |
| `cad2.js` | CAD v2 drafting library: line weights, vector hatches, oblique-tick dimensions, datums, markers, keynotes, finish codes, drawing titles and sheet title blocks (status field in bronze) |
| `walnut-sheets.js` | Walnut suite drawing set (DD-01/02/03, CD-01/02) and the RE-02 shop-drawing format |
| `cad-adapter.js` | Runs the other project drawings through the CAD v2 standard, including its minimum text size and hatches |
| `cad-projects.js` | Project studies for the arched retreat, skyline suite, villa, garden, salon and majlis |
| `cad-legacy.js` | Skyline wardrobe bay, representative ceiling section, conventions, coordination diagram and arch elevation |
| `pages.js` | Expertise rows and the skyline material-board strip |
| `rich.js` | Detail crops cut from renders (never stretched), with a bounds check; colour chips |
| `book.js` | Drawings, numbering, running heads, folios, contents, works index, page references and output modes |
| `palette.js` · `sample_palette.py` | Colours sampled from named regions of named renders |
| `prep_images.py` · `build.mjs` · `finish_pdfs.py` | Image preparation, then QC report and PDFs, then page boxes and CMYK |

```bash
python3 prep_images.py && node build.mjs && python3 finish_pdfs.py
```

`book.html#grid` shows the grid overlay in a browser. `#screen`, `#print` and `#marks` show each output layout.

`build.mjs` fails nothing silently. It prints the page count, the minimum text size (page and drawing), any text within 8 mm of the trim, and any image below 230 ppi.
