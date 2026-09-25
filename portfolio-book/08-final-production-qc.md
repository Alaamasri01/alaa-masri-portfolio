# Alaa Masri — Portfolio 2026–2027 · Final production build and QC summary

**Status:** complete 42-page rebuild. The approved QC sample (`07-qc-technical-grid-sample.md`) is the master standard for every page. The public website was not modified.

- **Source:** `final/`, see `final/README.md`
- **Outputs:** `output/`
- **Supersedes:** the rich-edition build in `book/`, described in `06-final-rich-build.md`. That document's lists of missing information, missing high-resolution images and items to replace remain valid; changes to them are noted below.

## Outputs (`output/`)

| File | Use |
|---|---|
| `Alaa-Masri-Portfolio-2026-2027-screen.pdf` | Review and email. A4 trim, clickable contact links. |
| `Alaa-Masri-Portfolio-2026-2027-print-bleed.pdf` | **Print master.** 216 × 303 mm media (3 mm bleed), TrimBox and BleedBox set, full-resolution images. |
| `Alaa-Masri-Portfolio-2026-2027-print-cropmarks.pdf` | The same pages with crop marks and a slug line. |
| `Alaa-Masri-Portfolio-2026-2027-print-bleed-CMYK.pdf` | Generic CMYK version. Prefer that the printer converts the RGB master with their own profile. |
| `Alaa-Masri-Portfolio-2026-2027-grid-overlay.pdf` | All 42 pages with the 12-column grid, the 4.5 mm baselines, the type area and the title-block zone shown. |
| `proof-overview-*.jpg`, `proof/` | Spread proofs. |
| `proof-report.json` | Machine QC: text sizes, trim distances, ppi of every image placement. |

## Corrections applied from the QC approval

1. **Minimum text size is 7.5 pt everywhere.**
   - Page text: measured minimum is 7.5 pt.
   - Drawing text: measured minimum is 2.65 mm, which is 7.51 pt.
   - Two items were raised to meet it: the sheet references inside markers and the drawing-title reference line (both from 2.5 to 2.65 mm).
   - The old drawings' 2.1–2.45 mm labels are now floored at 2.65 mm by the adapter.
2. **No shrinking to fit.**
   - Where content was dense, drawings were enlarged, or the content was split or redistributed.
   - The pool-hall, fireplace-wall and villa elevations were widened to 175 mm, with their keys moved beneath them.
3. **CD-01 (page 24):** about 6% more room.
   - Keynote bubbles move about 4 mm further out.
   - The dimension strings step out 1.5–2 mm.
   - The drawing size is unchanged.
4. **Walnut suite opener (page 20):**
   - The title is reduced from 84 to 80 pt, about 5%.
   - There are 4.5 mm (one baseline) more between the title and the content below.
5. **Grid:** the same grid, baseline, margins, running heads, folios and sheet-block zone are used on every page. The `grid-overlay` PDF is the evidence.
6. **Line weights:**
   - The approved hierarchy is kept.
   - The finest lines (0.10–0.12 mm) carry only grids, hatches and extension lines.
   - All information sits on 0.15 mm lines or heavier: dimensions, leaders, keynotes and text.
7. **Status field:** bronze in every sheet block; the rest of the block stays neutral.
8. **Technical capability:** page 39 (RE-02) is unchanged and remains the benchmark. Page 38 was rebuilt to the same standard.
9. **Authenticity:**
   - Every drawing keeps its status label in its drawing title and sheet block.
   - Unknown sizes read "to survey": room widths and depths, arch sizes, facade heights, ground level and ceiling levels.
   - No project dimensions, specifications, products or suppliers have been added.
10. **Variety on one grid.** The seven openers use five different compositions:
    - Hero with tall detail crop (arched retreat).
    - Dark, with the drawing on the opener (skyline suite).
    - Hero with two detail crops, from the QC sample (walnut suite, villa).
    - Inset hero with facts across the page (garden).
    - Title first, image second (burgundy salon).
    - Annotated hero (earthy welcome).

    Material pages also vary: stacked swatch boards, a board strip, a schedule table, chip rows and the frieze trace.
11. **Micro-drawings removed.** See the table below.

## Page-by-page QC

Checked on every page:
- grid and baseline alignment;
- minimum text size;
- line-weight hierarchy;
- drawing readability at 100% A4;
- title-block consistency;
- cross-references;
- page numbers and running heads;
- image resolution and cropping;
- overlaps, clipping and overflow;
- invented information;
- terminology and drawing codes.

Automated results (`proof-report.json`):
- 42 pages, no page-side or engine problems;
- no text within 8 mm of the trim;
- no text below 7.5 pt;
- no image below 230 ppi (minimum 230; the full-bleed renders print at 239–242 ppi);
- every crop checked to lie inside its source image;
- all fonts embedded as TrueType, with no rasterised patterns in any PDF.

Cross-references verified:
- walnut suite plan markers E1 → DD-02 and E2 → DD-03;
- section 01 → CD-01 and detail 02 → CD-02;
- expertise page references CD-01 on p. 24 and DD-02 on p. 23;
- the contents, the works index and the contact index;
- the technical note (pp. 38–39) and the drawing register (project studies pp. 09–37).

## Pages substantially changed from the 42-page rich build

| Page | Change |
|---|---|
| 01 Cover | Recomposed on the grid. The arch drawing and render are the same height (90 mm) on one datum, and the name is larger. |
| 02 Introduction | Recomposed on the grid. The statement sits on the baseline, with four detail crops. |
| 03 Contents | The status-label key was rewritten as a CAD-code table (DD, CD, RE, MS, "to survey"). |
| 06–07 Expertise | **Micro-drawings removed.** The tiny ceiling-section, shelf and arch icons are replaced by an annotated render of the arched reception hall (interior architecture) and an annotated joinery render linked to CD-01 and DD-02 (technical drawings). The swatches, BOQ table, coordination diagram and checklist are larger. |
| 08 Selected works | The index gains a thumbnail per project; the separate thumbnail strip is removed. |
| 10 Architecture & rhythm | The arcade elevation (DD-A1) is widened to 175 mm, with floor and ceiling datums; the key sits beneath. The small room-by-room crop strip is removed. |
| 11 Arch family | Redrawn on a 35 mm module so each arch sits over its render crop. |
| 12 Pool hall | DD-A3 is enlarged to 175 mm with datums. The lighting key moves beneath it; the two small light crops are removed. |
| 13 Dusk | The niche section (CD-A1) is enlarged to 85 × 126 mm. |
| 15 Skyline opener | The headboard elevation is redrawn at the new standard (ivory lines on the dark ground). |
| 18 Skyline space and lighting | The plan is enlarged to 175 mm and given named room dimensions ("to survey"). The lighting plan is enlarged and the keys split into two lists. |
| 20–25 Walnut suite | Pages 20–24 are the approved QC pages with corrections 3 and 4. Page 25 was recomposed as a design-language page; the material schedule moved to page 21, as in the QC sample. |
| 27–29 Villa | The dark lighting elevation is enlarged to 175 mm, with lighter slab fills. The daylight elevation gains a ground-level datum. The massing, screen detail and material study were recomposed; the screen plan labels are corrected. |
| 31 Garden planning | Recomposed: the plan is given named depth dimensions ("to survey"), and four zone crops with zoning cells replace the empty lower field. |
| 32–33 Garden | The section is widened to 175 mm. The fireplace elevation (DD-G2) is widened to 175 mm, with its key beneath and a compact material band. |
| 34–35 Burgundy salon | The opener was recomposed title first. The feature wall (DD-B1) is enlarged to 115 × 148 mm, with the proportion diagram beside it. |
| 36–37 Earthy welcome | The annotated opener was recomposed. The feature wall (DD-M1) is enlarged. The frieze trace and colour chips now sit on one sand band. |
| 38 Technical capability | The ceiling section (RD-02) is enlarged to 115 × 99 mm. The register and conventions legend are rebuilt; the conventions symbol legend was re-spaced to remove an overlap. The BOQ, finish schedule, coordination matrix and checklist formats now live on page 39's system and in the expertise section, rather than as small tables. |
| 41 Contact | Recomposed. The arch study is larger and labelled "DD diagram"; a text index of the works replaces the thumbnail strip. |
| 42 Back cover | Recomposed on the grid. |

### Content removed or relocated, rather than shrunk

- **Removed:**
  - the tiny ceiling-section, shelf and arch icons (expertise);
  - the room-by-room arch strip (page 10) and two small pool light crops (page 12);
  - two small villa detail thumbnails;
  - the standalone finish-schedule, BOQ and coordination tables from page 39 of the rich build. The BOQ extract survives on page 06, and the coordination diagram and checklist on page 07.
- **Drawing re-numbered:** the skyline wardrobe bay is now DD-S4 (it was DD-04).

## Missing information and images

These are unchanged from `06-final-rich-build.md`:
- project facts marked "To confirm";
- design intent (placeholders on pages 19 and 25; the other projects use the website concept line);
- career record;
- "TS studies";
- the UK/US spelling standard;
- "Boucle" vs "Bouclé";
- the board typo baked into the image;
- high-resolution originals, with the cover (arched-retreat-07) and the seven openers as the priority.
