# Portfolio book — editable source (rich edition)

| File | What it is |
|---|---|
| `book.html` | Every page in reading order: text, image placement, crops (`.crop`), drawings (`.cad`) and data attributes |
| `book.css` | Design system: tokens, grid, type scale (smallest text 6.5 pt), light and dark pages, rich components, output modes |
| `cad.js` | Vector drawing library in millimetres: line weights, vector hatches, dimensions, callouts, title blocks with status labels, and the walnut suite, skyline wardrobe and representative drawings |
| `cad-projects.js` | The project studies for the arched retreat, skyline suite, villa, garden, salon and majlis. Each is traced from, or reads, a named render |
| `pages.js` | Generated page parts: expertise rows and studies, the skyline material-board strip, checklists, project index strips, annotation overlays |
| `rich.js` | Turns `.crop` (a detail cut from a render, never stretched), `.cad` and `.chip` elements into markup; warns if a crop leaves its image |
| `palette.js` · `sample_palette.py` | Colours sampled from named regions of the renders. The script records each file and region; rerun it after replacing an image |
| `book.js` | Numbers pages, assigns verso/recto, writes folios, builds the contents and project index, resolves page references (`data-pref` → `data-anchor`), and lays out the output modes |
| `content.js` | Expertise copy (website, verbatim) |
| `fonts/` | Static Inter instances cut from the website's variable font. Instrument Serif is loaded from `../../fonts/` |
| `prep_images.py` | Makes print copies (native size, JPEG q95) and screen copies (≤ 1400 px) of every image the book uses |
| `build.mjs` | Renders the PDFs, the proof spreads and `proof-report.json` (image ppi, text-to-trim distances) |
| `finish_pdfs.py` | Sets TrimBox/BleedBox and metadata, and writes the CMYK version with Ghostscript |

## Rebuild

```bash
cd portfolio-book/book
python3 prep_images.py      # after adding or replacing images
node build.mjs              # PDFs + proof (needs Playwright/Chromium)
python3 finish_pdfs.py      # page boxes, metadata, CMYK (needs PyMuPDF; Ghostscript for CMYK)
```

Preview in a browser by opening `book.html`: pages are shown as spreads. Add `#guides` to the URL to show the 8 mm safe zone. `#screen`, `#print` and `#marks` show each output layout.

## Common edits

- **Fill in a project fact:** `book.js` writes "To confirm" through the `data-meta5` template. For one project, replace the element with real cells, or extend the template with a data attribute.
- **Replace an image with an original:** put the file into `../../projects/` with the same name and the same aspect ratio, then run all three steps. Crops are defined in source pixels (`data-r="x,y,w,h"`), so if the original is larger, scale those numbers by the same factor, or add the new size to `dims()` in `rich.js`.
- **Replace a conceptual drawing with a real one:** swap the `.cad` element for a `.fig` holding the exported sheet (vector SVG, or PNG ≥ 300 ppi at the placed size), and update the register on page 38.
- **Change page order:** move `<section class="page">` blocks. Numbering, sides, folios, contents and page references update automatically. The build warns if a page designed for one side lands on the other.
- **Hatches** are drawn as vector lines (`CAD.hatch`), not SVG patterns, because patterns are rasterised by the PDF engine.
- **A3 landscape edition:** set `.page` to 420 × 297 mm and pair each spread's two pages; the grid modules carry over. This needs high-resolution originals.
