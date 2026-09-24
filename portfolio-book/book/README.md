# Portfolio book — editable source

| File | What it is |
|---|---|
| `book.html` | Every page in reading order: text, image placement and data attributes |
| `book.css` | The approved design system: tokens, grid, type scale, light and dark pages, output modes |
| `book.js` | Numbers pages and assigns verso/recto, writes folios, builds the contents and project index, expands tables, lays out output modes |
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

- **Fill in a project fact:** in `book.js`, the templates `data-meta5` and `data-rows` write "To confirm". For a single project, replace the generated placeholder in `book.html` with real text, or give the element a data attribute and extend the template.
- **Replace an image with a high-resolution original:** put the file into `../../projects/` or `../../gallery/` with the same name, then rerun all three steps. Placement is in millimetres, so the layout does not move. Keep the original aspect ratio (16 : 9 for project renders).
- **Add a drawing to the register:** replace a `.sheet` on page 37 (in `book.js` → `SHEETS`) with a `.fig` holding the drawing PDF exported as a high-resolution PNG, or as vector SVG.
- **Change page order:** move `<section class="page">` blocks. Numbering, sides, folios and contents update automatically. The build warns if a page designed for one side lands on the other.
- **A3 landscape edition:** set `.page` to 420 × 297 mm and pair each spread's two pages into one page; the grid modules carry over. This needs high-resolution originals.
