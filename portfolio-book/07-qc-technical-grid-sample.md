# QC sample — technical and grid polish (The walnut suite, 6 pages)

**Status:** review sample only. The 42-page book is **not** rebuilt; it waits for your approval of this standard.

## Files (`qc/review/`)

- **A. Normal PDF:** `QC-walnut-6pp-normal.pdf`
- **B. Grid-overlay PDF:** `QC-walnut-6pp-grid-overlay.pdf`, showing the 12 columns in red, the 4.5 mm baselines in blue, the type area dashed and the title-block zone shaded. Also `grid-*.jpg`.
- **C. 100% A4 screenshots:** `A4-100pct-*.png`, at 96 px per inch, i.e. the page at actual size on a standard screen.
- **D. 300 dpi close-ups:** plan, elevation, section detail, junction detail, title block and shop drawing (`closeup-*.png`).
- **Source:** `qc/qc.html`, `qc.css`, `cad2.js` (the new drafting library), `walnut-sheets.js` (the drawings), `qc.js`, `render.mjs`.

| Page | Type | Content |
|---|---|---|
| 20 | Project opener | Hero render, one-line title, concept, fact table, 6 colours, 2 large detail crops |
| 21 | Render + material | Annotated joinery render, 4 large swatches, finish schedule |
| 22 | Plan | DD-01 layout reading, drawn at 175 mm wide |
| 23 | Elevations | DD-02 media wall (full width) and DD-03 headboard wall, with a keynote and finish-code legend |
| 24 | Construction details | CD-01 lit shelf section (typical build-up) and CD-02 plan section of the reveal junction |
| 39 | Technical capability | RE-02 wardrobe shop-drawing sheet: elevation, section, plan and head detail |

## Master grid

The same grid will be used for the whole book.

- **Page and margins:** A4 with 3 mm bleed. Margins are 15 mm top, 16.5 mm bottom, 20 mm inner and 15 mm outer.
- **Columns:** 12 columns of 10 mm with 5 mm gutters, making a 175 mm type area on a 15 mm module.
- **Baseline:** 4.5 mm, starting at 15 mm. Every top edge sits on a baseline, and every left edge sits on a column.
- **Fixed zones:**
  - running head at 15 mm, with a rule at 19.5 mm;
  - content starts at 24 mm;
  - sheet title block at 262.5–279.5 mm;
  - folio at 284.5 mm.

## Drafting standard (`cad2.js`)

- **Line weights (mm):**

  | Line | Weight |
  |---|---|
  | Cut | 0.55 |
  | Major outline | 0.35 |
  | Secondary | 0.25 |
  | Joinery / fixtures | 0.18 |
  | Dimensions / leaders | 0.15 |
  | Hatches | 0.12 |
  | Grid / reference | 0.10 |

- **Text sizes:**

  | Text | Size |
  |---|---|
  | Annotation | 2.75 mm |
  | Dimensions | 2.65 mm |
  | Markers | 3.0–3.3 mm |
  | Drawing titles | 4 mm |
  | Title-block values | 2.85–4.2 mm |

  Page text is 9 pt body, 8 pt captions and tables, and 7.5 pt labels. Nothing in the sample is below 7.5 pt.
- **Conventions:**
  - oblique-tick dimension strings with extension lines;
  - FFL and ceiling datums;
  - grid bubbles and a centre line;
  - section, elevation and detail markers that cross-reference sheets (for example, E1 on the plan points to DD-02, and 01 points to CD-01);
  - keynote bubbles and boxed finish codes;
  - solid wall poche and break lines;
  - vector hatches for masonry, plaster, MDF, ply, timber grain, stone, upholstery, insulation and glass;
  - LED lines in bronze.
- **One title-block system:**
  - Each drawing has a drawing title: a reference bubble, a caps title with a heavy underline, and scale / status / source.
  - Each technical page has one sheet block: project, sheet title, drawing number, status, scale and issue.

## Authenticity, unchanged

- **Status labels:**
  - The plan is a *conceptual space study*.
  - The elevations are *design development diagrams* traced from the renders.
  - The details are *concept details* with typical sizes.
  - The wardrobe sheet is a *representative example*.
- **Dimensions:**
  - Project drawings use named dimensions ("to survey"), never invented measurements.
  - Only the representative sheet and the typical-build-up details carry numbers.
- **Materials:** no product or supplier names appear.

## What changed from the 42-page build

- Drawings are 2–3 times larger. Pages carry one or two large drawings instead of several small ones.
- The micro-drawings are gone: the tiny icons in the expertise section, the massing sketch and similar.
  - In the full rebuild, each one is either redrawn to this standard or replaced by a larger annotated render or material study.
- Captions, keys and tables share the baseline, and legends sit in fixed columns.

## What I need from you

Please approve or correct:
1. the grid;
2. the drafting standard, including line weights, text sizes and density;
3. the title-block system;
4. the opener and material-page layouts.

After approval I will rebuild all 42 pages to this standard: every project, expertise and technical page, and the covers.
