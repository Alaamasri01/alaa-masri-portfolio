# Alaa Masri — Portfolio 2026–2027
## Final build report

**Status:** full book built on the approved Phase 4 system with the "Aperture" cover.

- **Format:** 40 pages, A4 portrait, self-cover. The count is a multiple of 4, so it can be saddle-stitched or perfect-bound without blank pages.
- **Missing facts:** every one is marked "To confirm"; none were invented.
- **Website:** the public site is unchanged. `portfolio-book/` stays excluded from deployment by `.vercelignore`.

---

## 1 · Outputs (`portfolio-book/output/`)

| File | Use |
|---|---|
| `Alaa-Masri-Portfolio-2026-2027-screen.pdf` | **Screen / email PDF.** 210 × 297 mm, 6.7 MB, images compressed for screen. Email, phone, WhatsApp and website links are clickable. |
| `Alaa-Masri-Portfolio-2026-2027-print-bleed.pdf` | **Print-ready PDF — send this to the printer.** 216 × 303 mm (3 mm bleed), TrimBox 210 × 297, RGB images at full native resolution, fonts embedded. Most digital and offset printers prefer RGB, which they convert with their own press profile. |
| `Alaa-Masri-Portfolio-2026-2027-print-cropmarks.pdf` | The same file on a 236 × 323 mm sheet, with 0.25 pt crop marks and a slug line, for printers who ask for marks. |
| `Alaa-Masri-Portfolio-2026-2027-print-bleed-CMYK.pdf` | CMYK conversion made with Ghostscript's **generic** CMYK profile. Use it only if a printer insists on CMYK and cannot convert. For press, ask them to convert the RGB file to their profile (FOGRA39 / FOGRA51 / GRACoL). |
| `proof-overview-*.jpg` | All 21 spreads at a glance. |
| `proof-report.json` | Machine proof: measured ppi of every placed image and text distance from trim. |

**Editable source:** `portfolio-book/book/`. See `book/README.md` for editing and rebuilding.

---

## 2 · Page-by-page content

| Pages | Content | Template | Images |
|---|---|---|---|
| 01 | Front cover — "Aperture" | Cover (light) | arched-retreat-07 (vertical window crop) |
| 02 | Introduction — positioning statement, contact | Light | — |
| 03 | Contents (generated) | Light | — |
| 04–05 | Profile — first-person profile, 15+, six fact cells | Approved profile spread | portrait.png |
| 06 | Expertise — seven disciplines | Concept A table | — |
| 07 | Process — Envision · Develop · Deliver | Light | selection-12 |
| 08 | Selected works — index of seven projects | **Dark divider** | — |
| 09–14 | **01 An arched retreat** — Hospitality / Design study | Light opener A · overview · 3 image pages | arched-retreat-01 · 02 · 04, 03 · 05 · 06 · 07 |
| 15–18 | **02 The skyline suite** — Residential / Bedroom | **Dark opener** · overview · image · material palette | skyline-suite-01 · 02 · 04, 05 · 06 |
| 19–22 | **03 The walnut suite** — Residential / Bedroom | Light opener B · overview · image · detail | walnut-suite-01 · 02 · 03, 04 · 05 |
| 23–26 | **04 The illuminated villa** — Architecture / Exterior | **Dark opener** · overview · 2 image pages | illuminated-villa-02 · 01 · 05, 03 · 04 |
| 27–29 | **05 Living by the garden** — Residential / Living | Light opener A · overview · image | garden-lounge-01 · 02 · 03, 05 |
| 30–31 | **06 The burgundy salon** — Residential / Living | Compact opener (verso) · image | burgundy-salon-01 · 02, 03 |
| 32–33 | **07 An earthy welcome** — Residential / Majlis | Compact opener B (verso) · image | earth-toned-majlis-01 · 02, 03 |
| 34–35 | Selected interiors (unattributed gallery) | Light | fireside-lounge · selection-06 · selection-10 |
| 36 | Technical capability — process chain, fit-out works, coordination | Concept A | — |
| 37 | Drawing register — 7 reserved sheets | Concept A | — (empty by design) |
| 38 | Experience — role, career record (placeholders), responsibilities | Concept A | — |
| 39 | Contact | Light | — |
| 40 | Back cover | **Dark** | — |

- **Rhythm:**
  - Dark pages: 4 of 40 (10%) — pages 8, 15, 23 and 40. There are never two dark spreads in a row.
  - Dark openers: 2 across 7 projects, within the limit of one per two projects.
  - Each spread has one dominant image and at most two supporting images.
- **Held in reserve** (not placed, to avoid clutter): garden-lounge-04 · skyline-suite-03 · earth-toned-majlis-05.
- **Excluded:** earth-toned-majlis-04 is too compressed. Gallery selection-01, -02, -03, -04, -05, -07, -08, -09 and -11 are unused because their attribution is unknown.

---

## 3 · Missing information (needed from you)

**For each of the 7 projects** (these fields currently read "To confirm" on pages 9–33):
1. Location (city, country)
2. Year or year range
3. Status: completed / under construction / design stage / concept or design study
4. Your role
5. Scope: concept, design development, technical drawings, BOQ, supervision, handover…
6. Design intent: two or three sentences in your own words
7. The real project name, if you want it instead of the website title
8. Whether the visuals are your own work, and which tools produced them (3ds Max / V-Ray / Chaos Vantage / Blender / AI-assisted). This decides caption wording.
9. Whether *The walnut suite*, *The skyline suite* and *The burgundy salon* are separate projects or rooms of one residence.

**Selected interiors (pages 34–35):**
- Which project each gallery image belongs to.
- A caption for selection-08 (bathroom vanity), if you want it used.

**Experience (page 38):**
- Employers or studios, positions, locations and years for each role. Three placeholder rows are reserved.
- Whether the Riyadh role is current (it is not labelled "current" because the CV doesn't say).
- What "TS studies" stands for, so it can be written out in full.
- Any notable clients or projects you are allowed to name.

**Wording to approve** (written for the book, not taken from your sources):
- "Drawn to be built." — headline on page 36.
- "Leisure" — page 12. Drawn from the website phrase "quiet leisure areas".
- The "Spaces shown" summaries on the overview pages (10, 16, 20, 24, 28), assembled from the website image captions.
- "Walnut panelling, burgundy velvet, marble and concealed linear light." — page 21, assembled from captions.
- The seven-step concept-to-execution chain on page 36, condensed from the CV.

**Proofreading notes on the source material** (left as written, pending your decision):
- **Spelling mix:** the source uses both US spelling ("visualization", "modeling") and UK spelling ("colours", "specialised"). Choose one standard and I'll apply it throughout.
- **"Boucle":** the website caption says "Boucle lounge chair". The correct form is probably "Bouclé".
- **Material board typo:** the image `skyline-suite-06` contains a typo baked into the picture — "REFEENCE: LUXURY BEDROOM LAYOUT". It can only be fixed by re-exporting the board.

---

## 4 · High-resolution assets needed

Every placement currently prints at **≥ 232 ppi**. The minimum measured is 232 (walnut-suite-05) and nothing is enlarged. For true 300 ppi, and for any A3 edition, please supply originals of at least the sizes below. Larger is better; PNG, TIFF or maximum-quality JPG, with the same file names.

| File | Current px | Page(s) | Printed (visible, mm) | Current ppi | Needed for 300 ppi (px) |
|---|---|---|---|---|---|
| `walnut-suite-05.webp` | 1800×1005 | 22 | 110×110 (square crop) | 232 | 2328 × 1300 |
| `fireside-lounge-1600.webp` | 1600×1195 | 34 | 170×127 | 239 | 2008 × 1500 |
| `arched-retreat-05.webp` | 1800×1005 | 12 | 190×106 | 241 | 2241 × 1251 |
| `illuminated-villa-01.webp` | 1800×1005 | 24 | 190×106 | 241 | 2241 × 1251 |
| `garden-lounge-02.webp` | 1800×1005 | 28 | 190×106 | 241 | 2241 × 1251 |
| `burgundy-salon-01.webp` | 1800×1005 | 30 | 190×106 | 241 | 2241 × 1251 |
| `earth-toned-majlis-01.webp` | 1800×1005 | 32 | 190×106 | 241 | 2241 × 1251 |
| `arched-retreat-04.webp` | 1800×1005 | 11 | 189×106 | 242 | 2231 × 1246 |
| `skyline-suite-01.webp` | 1800×1005 | 15 | 189×106 | 242 | 2231 × 1246 |
| `skyline-suite-04.webp` | 1800×1005 | 17 | 189×106 | 242 | 2231 × 1246 |
| `walnut-suite-03.webp` | 1800×1005 | 21 | 189×106 | 242 | 2231 × 1246 |
| `illuminated-villa-02.webp` | 1800×1005 | 23 | 189×106 | 242 | 2231 × 1246 |
| `arched-retreat-07.webp` | 1800×1005 | 1 (cover crop), 14 | 47×104 on cover · 172×96 on p14 | 245 | 2204 × 1231 |
| `skyline-suite-06.webp` | 1800×1005 | 18 | 172×96 | 266 | 2030 × 1133 |
| `illuminated-villa-04.webp` | 1800×1005 | 26 | 172×96 | 266 | 2030 × 1133 |
| `arched-retreat-01.webp` | 1800×1005 | 9 | 160×89 | 286 | 1888 × 1054 |
| `walnut-suite-01.webp` | 1800×1005 | 19 | 160×89 | 286 | 1888 × 1054 |
| `garden-lounge-01.webp` | 1800×1005 | 27 | 160×89 | 286 | 1888 × 1054 |
| `portrait.png` | 1254×1254 | 4 | 109×109 | 292 | 1288 × 1288 |

The other 18 placed images already print at ≥ 300 ppi (311–836 ppi); the full list is in `output/proof-report.json`.

- **Priority:** the cover image (`arched-retreat-07`), then the seven dominant bands at about 241 ppi.
- **A3 landscape edition:** dominant images would need about 4500 px width.
- **Portrait:** a higher-resolution portrait (≥ 2000 px) would also allow a larger crop.

---

## 5 · Technical material requested (drawing register, page 37)

The seven sheets are empty by design. Please supply real documents; anonymised or blurred versions are fine.

| Sheet | Needed | Preferred format |
|---|---|---|
| T-01 Plans | Furniture / layout plan and a reflected ceiling plan from one or two of the featured projects | PDF export from AutoCAD (vector), A3 |
| T-02 Elevations | Feature-wall, TV-wall or entrance elevations and sections | Vector PDF |
| T-03 Joinery details | Custom furniture or joinery detail sheets (e.g. the walnut media unit, wardrobes) | Vector PDF |
| T-04 Shop drawings | Coordinated shop drawings: carpentry, steel, stone or glass | Vector PDF |
| T-05 BOQ excerpt | One or two pages of a BOQ / quantity take-off (prices may be removed) | PDF or XLSX |
| T-06 Material schedule | Finish / material schedule or sample-board photographs | PDF or photos |
| T-07 Site coordination | Site progress photographs, inspection records or handover photos | JPG ≥ 3000 px |

For each sheet, please also give the project name (or "confidential") and the drawing scale, so the title-block strip can be completed. If some items can't be shared, that sheet becomes a text description of the capability — it will still never contain a drawn placeholder.

---

## 6 · Preflight and proofreading — what was checked

| Check | Result |
|---|---|
| Page count / binding | 40 pages (multiple of 4) ✓ |
| Page numbers | Generated from page order, so contents, project index and folios agree ✓ (checked in the extracted PDF text) |
| Left/right placement | Every page designed for its actual side: 0 mismatches ✓ |
| Bleed | All bleeding images and sand blocks extend into the 3 mm bleed; checked by rendering the print PDF ✓ |
| Trim / Bleed boxes | Print: TrimBox 210 × 297, BleedBox 216 × 303 · Crop-marks file: TrimBox 210 × 297 at 13 mm, BleedBox at 10 mm ✓ |
| Text near trim | No text within 8 mm of trim on any page — measured line by line ✓ |
| Image resolution | Minimum 232 ppi at printed size, measured in the print PDF; none upscaled; all aspect ratios native except 2 declared crops ✓ |
| Fonts | Instrument Serif (regular, italic) and Inter (static Regular / Medium instances cut from the website's variable font), all embedded as TrueType subsets; every character used exists in the fonts ✓ |
| Minimum type size | 6 pt (labels, title blocks); body 8.5 pt ✓ |
| Contact details | info@alaamasri.com · +966 57 053 3358 (phone and WhatsApp) · alaamasri.com · Riyadh, Saudi Arabia — identical on pages 2, 39 and 40 and matching the website; links verified in the screen PDF ✓ |
| Captions | Every figure number matches its source file number; caption text is the website's image description ✓ |
| Text | Full extracted text read through. Profile, expertise, process and responsibilities checked against the website, profile and CV. Notes in section 3 ✓ |
| Placeholders | Project facts, design intent, career record and drawing sheets all read "To confirm" or "Reserved"; nothing invented ✓ |

- **Paper:** 150–170 g/m² silk or uncoated for inner pages, with a 300–350 g/m² cover and soft-touch matt laminate.
- **Dark pages:** these carry heavy ink coverage, so ask the printer for a hard proof of pages 8, 15 and 23 before the full run.
