# Alaa Masri — Portfolio Book 2026–2027
## Final build — rich edition (approved Phase 5 direction)

**Status:** complete 42-page book, built in the approved Phase 5 density, with the final refinements applied. This supersedes the Phase 4 build (`04-final-build-report.md`, kept in git history). The public website was not modified.

### Outputs (`output/`)

| File | Use |
|---|---|
| `Alaa-Masri-Portfolio-2026-2027-screen.pdf` | Screen review and email: A4 trim size, 7 MB, clickable contact links |
| `Alaa-Masri-Portfolio-2026-2027-print-bleed.pdf` | **Print master:** 216 × 303 mm media (A4 + 3 mm bleed), TrimBox and BleedBox set, full-resolution RGB images |
| `Alaa-Masri-Portfolio-2026-2027-print-cropmarks.pdf` | Same file on a 236 × 323 mm sheet with crop marks and a slug line, for printers who ask for marks |
| `Alaa-Masri-Portfolio-2026-2027-print-bleed-CMYK.pdf` | CMYK conversion with Ghostscript's generic profile. Prefer the printer converting the RGB master with their own profile (FOGRA39, FOGRA51 or GRACoL) |
| `proof-overview-1/2/3-*.jpg` | All spreads on three sheets, for a quick look |
| `proof-report.json` | Machine check: ppi of every image placement and text distance to the trim |

**Editable source:** `book/`. The README there lists every file and how to rebuild.

### Refinements applied from the Phase 5 approval

1. **Cover 3, Aperture + CAD.**
   - The name is set larger (176 pt, up from 150 pt) and is clearly dominant. "Alaa" is lowered to sit beside the arch pair, and "Masri" straddles the edge of the sand block.
   - The arch elevation and the render crop are larger and share one bronze datum line.
   - The colour chips were removed to reduce clutter. The drawing is labelled "Design development diagram".
2. **Legibility.**
   - Body text rises from 8.5 to 9 pt, captions from 6.5 to 7.3 pt, and table text from 6.5 to 7.3 pt.
   - Labels and folios are 6.6 pt, notes 7.8 pt and keys 7.3 pt.
   - Drawing text rises from 6.1 to 7.1 pt, and title-block text is 6.5 pt. The smallest text anywhere in the book is 6.5 pt.
3. **Project uniqueness.** Each project follows its own sequence (see the page index). No two projects share the same order of spreads.
4. **Density and rhythm.**
   - Dense technical spreads, rich image-and-detail spreads and cinematic moments alternate.
   - The cinematic moments are the pool hall, the skyline suite's dark spreads, the villa at dusk and the full-bleed hero openers.
5. **Authenticity.** All labels are kept.
   - Every generated drawing carries its status in its title block, a plain-language note on the page, and a key to the status labels on the contents page.
6. **Technical capability.** Board 11 is kept as the benchmark, with larger type and the new drawing conventions.
7. **Expertise.** The studies are larger (a 92 mm study column, up from 84 mm, and larger swatches, section and detail).
8. **Contact and ending.** Board 12 is kept. The contact page moves to a right-hand page, and the arch studies are now labelled.

### Checks carried out before export

- **Resolution.** Every image placement except one prints at 230 ppi or more (range 234–836 ppi).
  - The exception: three 15 mm swatches cut from the skyline suite material board print at 203–220 ppi, which is fine at that size. The full board on page 16 prints at 400 ppi.
  - No image is enlarged beyond its native pixels, and every crop was checked to lie inside its source image.
- **Trim, bleed and margins.**
  - Full-bleed images extend 3 mm past the trim.
  - No text sits within 8 mm of the trim; the automated check found zero cases.
  - The type area is 14 / 16 / 24 / 14 mm (top, bottom, inner, outer).
- **Page sides.** All 42 pages land on their designed side. Openers, spreads and folios all check out.
- **Folios.**
  - Numbering is automatic. The cover, the profile portrait page and the back cover carry no folio by design.
  - Contents, the project index and all page references are generated, so they cannot drift.
- **Fonts.** Instrument Serif and Inter are embedded as TrueType (Type0) in all four PDFs, with no Type 3 or fallback fonts.
  - Two symbols (the tick and the matrix dots) were redrawn in CSS after the first export showed them falling back to a system font.
- **Vector drawings.**
  - The first export showed that the drawing hatches (SVG patterns) were rasterised at 72 ppi.
  - Every hatch is now drawn as clipped vector lines. The final PDFs contain no raster patterns, and hatches print sharp at any size.
- **Project naming.** The same names are used everywhere, in the contents, openers, running heads, folios, index strips and captions:
  - An arched retreat
  - The skyline suite
  - The walnut suite
  - The illuminated villa
  - Living by the garden
  - The burgundy salon
  - An earthy welcome
- **Repetition.** No two consecutive spreads share a layout.
  - Openers use both left and right pages and both light and dark grounds: skyline and villa open dark, the rest open light.
  - Every project runs a different sequence of spreads after its opener.

---

## 1 · Page-by-page content index

| Page | Side | Content | Images | Generated studies |
|---|---|---|---|---|
| 01 | R | **Cover** — Aperture + CAD | arched-retreat-07 (crop) | Arch elevation (DD) |
| 02 | V | Introduction: statement, four key figures, four discipline details, contact | 4 crops (arched-03, walnut-03, villa-04, garden-03) | — |
| 03 | R | Contents (auto) and *How to read the drawings*, the status-label key | — | — |
| 04 | V | Profile: statement, portrait, selected-work column | portrait, arched-01, walnut-02, villa-02 | — |
| 05 | R | Profile: first-person text, 15+, fact cells, concept-to-handover chain | — | — |
| 06–07 | V/R | Expertise: seven disciplines, each with a study | crops from walnut-03/05, arched-01 | Material study, RD section, RD detail, BOQ format, coordination diagram, checklist format |
| 08 | V dark | Selected works: project index with page numbers, thumbnail strip | 7 thumbnails | — |
| **01 · An arched retreat** — architecture, arches, spatial rhythm, elevations, material and lighting ||||
| 09 | R | Opener: hero, title, three arch details, metadata, concept, 4 sampled colours | arched-01, crops of 01/03/05 | — |
| 10 | V | *The arch as a system*: dining view, key elements, arcade elevation, the same rhythm room by room | arched-03; crops of 04/02/05/06 | DD-A1 arcade elevation |
| 11 | R | Conceptual elevations: arch family above the real openings; guest suite; spaces list; design cells | arched-02; 5 arch crops | DD-A2 arch family |
| 12 | V | Cinematic pool hall, *Light as material*: lighting layers, 4 lighting details | arched-05 (full bleed) + 4 crops | DD-A3 pool wall and lighting layers |
| 13 | R | Banquet at dusk, rooftop lounge, lit-niche detail, three chandeliers | arched-04, arched-06; 3 crops | CD-A1 lit niche section |
| 14 | V | Guest bedroom and material study: 6 swatches, 4 sampled colours, finish codes | arched-07; 6 swatches | Material study |
| **02 · The skyline suite** — cinematic dark spreads, bedroom and wardrobe, lighting and joinery ||||
| 15 | R dark | Opener: hero, title, metadata, concept, headboard elevation next to its render | skyline-01 + crop | DD-S1 headboard wall |
| 16 | V dark | Wardrobe wall view; palette strip cut from the project's own material board; board; bed detail | skyline-02, -06, -03 | — |
| 17 | R dark | Wardrobe development: bay elevation, bay crop, pendant, lit shoe display | skyline-04, -05; 2 crops | DD-04 wardrobe bay |
| 18 | V | Space and lighting: layout reading, E1/E2 views, lighting-layer ceiling reading | skyline-01, -02 (thumbnails) | DD-S2 space study, DD-S3 lighting layers |
| 19 | R | Lighting and joinery details (4 enlargements); material study; palette sequence | 4 crops + 3 crops | Material study |
| **03 · The walnut suite** — joinery, material detail, media wall, wardrobe and headboard ||||
| 20 | V | Opener: hero, title, three details, metadata, concept, 6 colours | walnut-01 + 3 crops | — |
| 21 | R | Design language: media wall, key elements, 6 sampled colours, design cells, 2 enlargements | walnut-02; crops of 01 and 04 | — |
| 22 | V | Space study with key and E1/E2 views | walnut-01, -02 (thumbnails) | DD-01 space study |
| 23 | R | Elevations: media wall, headboard wall and render | crop of walnut-01 | DD-02 media wall, DD-03 headboard |
| 24 | V | Detail: annotated joinery render, lit shelf section, junction plan | walnut-03 | RD-01 shelf section, CD-01 junction |
| 25 | R | Materiality: velvet junction, two enlargements, material schedule format | 3 crops; 6 schedule swatches | Material study |
| **04 · The illuminated villa** — exterior architecture, facade light, vertical screening, massing and elevation ||||
| 26 | V dark | Opener at dusk: title, metadata, concept, three lighting details, 4 colours | villa-02 + 3 crops | — |
| 27 | R dark | Facade lighting: screening detail view, lighting-strategy elevation, key | villa-04 | DD-V2 lighting strategy |
| 28 | V | Daylight elevation: render and traced front elevation, key | villa-05 | DD-V1 front elevation |
| 29 | R | Aerial, massing axonometric, screen and soffit detail, entrance, material study | villa-01, -03; 4 swatches | DD-V3 massing, CD-V1 screen detail |
| **05 · Living by the garden** — planning, indoor/outdoor, material palette, furniture zoning ||||
| 30 | V | Opener: hero, title, three details, metadata, concept, 5 colours | garden-01 + 3 crops | — |
| 31 | R | Planning and zoning: layout reading, E1/E2 views, furniture zoning with 4 zone crops | garden-01, -02; 4 crops | DD-G1 space study |
| 32 | V | Indoor/outdoor: dining view, section, 4 view enlargements | garden-02; 4 crops | DD-G3 section |
| 33 | R | Material palette: fireplace wall render and elevation, lounge chair, coffee table, swatches | garden-03, -05, -04; 5 swatches | DD-G2 fireplace wall; material study |
| **06 · The burgundy salon** — feature wall, materiality, vertical proportions, lighting accents ||||
| 34 | V | Opener: hero, title, metadata, concept, three details, 4 colours | salon-01 + 3 crops | — |
| 35 | R | Feature wall elevation, proportion diagram, lower view, velvet close-up, material and light accents | salon-02, -03; 3 swatches | DD-B1 feature wall (with proportion diagram) |
| **07 · An earthy welcome** — composition of the first view, tone and material palette, wall and joinery ||||
| 36 | V | Opener: annotated hero (composition), title, metadata, concept, three detail views | majlis-01, -02, -04, -05 | Annotation overlay |
| 37 | R | Feature wall elevation, lit shelf detail, frieze motif traced as vector, 6 sampled colours | majlis-03 + frieze crop | DD-M1 wall, CD-M1 shelf niche, MS-M1 frieze |
| **Back matter** ||||
| 38 | V | Technical capability: ceiling section, plan fragment, conventions, drawing register | — | RD-02, RE-01, conventions |
| 39 | R | Wardrobe shop-drawing format, BOQ format (sample values), finish schedule, coordination matrix, site checklist | 4 swatches | RE-02; formats |
| 40 | V | Experience: role, career-record placeholders, responsibilities (CV), sectors | — | — |
| 41 | R | Contact: closing line, project index strip, contact register, arch study | 7 thumbnails | Arch elevation (DD) |
| 42 | V dark | Back cover: three details, villa at dusk, arch study, name, contact row | 4 crops | Arch elevation (DD) |

---

## 2 · Missing information (placeholders in the book read "To confirm")

**For every project (7 × 5 fields):** location, year, role, scope and status.
- These appear in the metadata row of each opener.
- The arched retreat is marked "Design study", because that is how the website describes it. Please confirm whether it was built.

**Design intent, in your own words, 2–3 sentences per project.**
- The placeholders are on pages 11, 19 and 21.
- The other projects use the website's concept line. Say if you want your own intent added there too.

**Render authorship.** The expertise note says "Project renders are Alaa Masri's visualisations". Please confirm this for every image, including the gallery images, which are not used in this edition.

**Career record (page 40):**
- employers or studios;
- positions;
- locations and years for each role.

**Education:** the meaning of "TS studies, Interior Design", and years.

**Wording to confirm.** These lines were written for the book and are not from your material:
- "Drawn to be built."
- "Concept to handover — how a project is carried"
- "The arch as a system — pier, opening, light."
- "Light as material — the pool hall."
- "Sleep, lounge, dress — one room, three zones."
- "One open room — cook, gather, look out."
- "The garden as the fourth wall."
- "Seven design stories — each told through its own strengths."
- the introduction line "Each project is shown through its visualisations and through studies drawn from them…"

**Captions I wrote from what the image shows (not from the website):**
- living by the garden Fig. 04 ("Coffee table with ceramics, books and layered textiles");
- the short detail captions (A, B, C, and the room-by-room strips).

**Spelling standard.** The book uses UK spelling (visualisation, colour), except for proper names from the website ("3D visualization", "AI-assisted design & visualization"). Please choose one standard.

**Your own source material:**
- "Boucle" (as on the website) or "Bouclé".
- The typo "REFEENCE" is baked into the skyline suite material board image (Fig. 06); it can only be fixed in the source file.

---

## 3 · Missing high-resolution images

All renders are the website files: 1800 px wide, except walnut-04 and majlis-02/04/05, which are 1344 px. They print well at the sizes used (≥ 234 ppi), but they are at their limit.

| Priority | Image | Why an original matters |
|---|---|---|
| 1 | arched-retreat-07 | Cover image (crop at 245 ppi). An original of ≥ 4000 px would allow a larger cover crop and an A3 edition |
| 1 | arched-retreat-01, walnut-suite-01, skyline-suite-01, illuminated-villa-02, garden-lounge-01, burgundy-salon-01, earth-toned-majlis-01 | Full-width heroes at 189–190 mm (241–242 ppi) |
| 2 | arched-retreat-05, -04; skyline-suite-02, -04; walnut-suite-02; villa-04; garden-lounge-02 | Full-bleed or 172 mm placements, 234–242 ppi |
| 2 | skyline-suite-06 (material board) | Swatches cut from it print at 203–220 ppi; an original board file (or the physical samples photographed) would give sharper swatches |
| 3 | All others | Used at 54–113 mm; fine as they are |
| A3 | Every image | An A3 landscape edition needs ≥ 3600 px wide originals throughout |

**To replace an image:** put the original into `projects/` with the same file name (any size, same aspect ratio) and rebuild. The layout does not move.

---

## 4 · Conceptual and representative graphics created for this book

Every item is labelled in its title block with the status below. None is a survey, an approved drawing or a construction document.

| Ref | Title | Page | Status label | Basis |
|---|---|---|---|---|
| — | Arched opening (cover, contact, back cover) | 1, 41, 42 | Design development diagram | Proportions of the arched-retreat openings |
| DD-A1 | Dining — end wall, arcade elevation | 10 | Design development diagram | Traced from arched-retreat Fig. 03 |
| DD-A2 | Arch family — one language, five openings | 11 | Design development diagram | Height/span ratios read from Figs. 01, 03, 05, 06, 07 (approximate, perspective included) |
| DD-A3 | Pool hall — back wall and lighting layers | 12 | Design development diagram | Traced from Fig. 05; lighting as visible in the render |
| CD-A1 | Lit arched niche — section | 13 | Concept detail | Reads Fig. 05 |
| DD-S1 | Skyline suite — headboard wall | 15 | Design development diagram | Traced from skyline Fig. 01 |
| DD-04 | Wardrobe bay — elevation | 17 | Design development diagram | Traced from skyline Fig. 04 |
| DD-S2 | Skyline suite — layout reading | 18 | Conceptual space study | Reads Figs. 01 + 02 |
| DD-S3 | Lighting layers — reflected ceiling reading | 18 | Conceptual space study | Reads Figs. 01, 02, 04 |
| DD-01 | Walnut suite — layout reading | 22 | Conceptual space study | Reads Figs. 01 + 02 |
| DD-02 | Media wall elevation | 23 | Design development diagram | Traced from walnut Fig. 02 |
| DD-03 | Headboard wall | 23 | Design development diagram | Traced from walnut Fig. 01 |
| RD-01 | Lit display shelf — section | 24 (and 06) | Representative detail | Generic, typical sizes |
| CD-01 | Walnut / light / velvet junction — plan | 24 | Concept detail | Reads walnut Fig. 05 |
| — | Annotation overlays (walnut Fig. 03, majlis Fig. 01) | 24, 36 | Callouts on the render | Items visible in the render |
| DD-V1 | Villa front elevation — massing and materials | 28 | Design development diagram | Traced from villa Fig. 05 |
| DD-V2 | Villa front elevation — facade lighting strategy | 27 | Design development diagram | Fig. 05 with the lighting visible in Figs. 02–04 |
| DD-V3 | Villa massing | 29 | Conceptual massing study | Reads the aerial view, Fig. 01 |
| CD-V1 | Timber screen and soffit light | 29 | Concept detail | Reads villa Fig. 04 |
| DD-G1 | Living by the garden — layout reading | 31 | Conceptual space study | Reads Figs. 01 + 02 |
| DD-G2 | Fireplace wall — elevation | 33 | Design development diagram | Traced from garden Fig. 03 |
| DD-G3 | Indoor / outdoor section | 32 | Conceptual section study | Reads Figs. 01 + 02 |
| DD-B1 | Burgundy salon — feature wall (with proportion diagram) | 35 | Design development diagram | Traced from salon Fig. 01 |
| DD-M1 | Majlis — feature wall elevation | 37 | Design development diagram | Traced from majlis Fig. 01 |
| CD-M1 | Lit oak shelf niche | 37 | Concept detail | Reads majlis Fig. 03 |
| MS-M1 | Frieze motif, vector trace | 37 | Material study | Traced from majlis Figs. 01 + 03 |
| RD-02 | Lighting cove — ceiling section | 38 (and 06) | Representative detail | Generic, typical sizes |
| RE-01 | Plan fragment — dimensioning | 38 | Representative example | Generic |
| RE-02 | Wardrobe — shop-drawing format | 39 | Representative example | Generic, typical sizes |
| — | Drawing conventions | 38 | Legend | — |
| — | Coordination diagram | 07 | From the profile | The partners named in your CV |
| — | BOQ extract (06) and BOQ format (39) | 06, 39 | Representative format · sample values | Generic items, sample quantities, no rates |
| — | Finish schedule, coordination matrix, site checklists | 07, 39 | Representative format | Generic; trades from your CV |
| MS | Material studies: swatches, sampled colours, finish codes | 09, 14, 19, 20–21, 25, 26, 29, 30, 33–37 | Material study | Swatches are pixel crops of the renders. Colours are medians of recorded regions (`book/sample_palette.py`). Finish codes (ST-01, WD-01 …) are portfolio references, not project codes. Products and suppliers read "To specify" |

---

## 5 · Items to replace later with real technical documents

When real documents exist, they should replace or sit beside the conceptual drawings, and the register on page 38 should be updated.

1. **Surveyed or as-designed plans** for each project, replacing DD-01, DD-S2, DD-G1 and the layout readings. Reflected ceiling plans replace DD-S3.
2. **Real elevations and sections:**
   - walnut media wall and headboard (DD-02, DD-03);
   - skyline headboard (DD-S1);
   - garden fireplace wall (DD-G2);
   - salon feature wall (DD-B1);
   - majlis wall (DD-M1);
   - arched-retreat arcade and pool hall (DD-A1, DD-A3);
   - villa elevations (DD-V1, DD-V2) and sections (DD-G3).
3. **Shop drawings**, replacing the representative RE-02 and the DD-04 bay: wardrobes, media units, headboards, shelving and stone ledges.
4. **Construction details**, replacing RD-01, RD-02, CD-01, CD-A1, CD-V1 and CD-M1: lit shelves, coves, niches, screens and junctions.
5. **A real BOQ extract**, anonymised if needed, replacing the sample-value BOQ tables on pages 06 and 39.
6. **Real material and finish schedules**, with approved samples, products and suppliers, completing the "To specify" columns and replacing the portfolio finish codes.
7. **Site records**: inspection reports, snag lists, coordination minutes and site photographs, replacing the checklist and matrix formats. Include client-approved photographs of completed work where available.
8. **Facade lighting layouts** for the villa, replacing the lighting reading in DD-V2.
9. **The drawing register** (page 38): replace the "To be supplied" row with the real sheet numbers.

**How to add one:**
- Export the sheet as vector SVG, or as a PNG of at least 300 ppi at the placed size.
- Place it in a `.fig` in `book/book.html` in place of the `.cad` element.
- Keep, or update, the status label.
