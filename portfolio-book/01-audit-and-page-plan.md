# Alaa Masri — Portfolio Book
## Phase 1 (Content & Asset Audit) + Phase 2 (Page Architecture)

Status: **for review — no final layout or PDF has been produced yet.**
Next step after your answers: Phase 3 (three visual directions for Cover, Project Opener, Image Spread).

---

# PHASE 1 — AUDIT

## 1.1 Sources found in the repository

| Source | What it contains | Usable for the book |
|---|---|---|
| `Alaa-Masri-Profile.txt` | Full professional profile: summary, 21 core expertise items, responsibilities, international experience, specialised project types, fit-out works, software, education, strengths, languages, career objective | Profile, Expertise, Technical Capability, Experience pages |
| `Alaa-Masri-CV-2026-2027.pdf` (2 pp.) | Same content as the profile, edited/condensed; adds "Hospitality interiors" and "Custom joinery packages" under Commercial. Text is outlined (not extractable) — read visually | Cross-check of wording |
| `index.html` (website) | Positioning lines, profile narrative (first person), 7 expertise disciplines with sub-items, 3-step process, 7 project titles/categories/descriptions, 13 gallery captions, contact details | Introduction, Profile, Expertise, Process, Projects, Contact |
| `projects.js` | Project order, category, one-line description, and an alt-text caption for each of the 36 project images | Project captions |
| `projects/` | 36 full images + 7 covers + 6 small variants (7 projects) | Project case studies |
| `gallery/` | 13 unattributed "selection" images (1600 px + 800 px versions) | "Selected Interiors" section |
| `portrait.png` | 1254 × 1254 px, transparent background cut-out | Profile page |
| `fonts/` | Instrument Serif (regular + italic), Inter (variable 300–600) | Typography (open-licence, embeddable in PDF) |
| `style.css` | Website colour tokens | Colour palette base |

No other assets exist in the git history (only one small duplicate image and an old stylesheet were ever deleted). **There are no drawings, plans, shop drawings, BOQ samples, site photographs, or original high-resolution renders in the repository.**

## 1.2 Verified facts (usable as-is)

- **Name:** Alaa Masri
- **Titles:** Senior Interior Designer · Interior Architect · Project Coordinator
- **Based in:** Riyadh, Saudi Arabia (GMT+3) — Lebanese nationality
- **Experience:** 15+ years — interior design, interior architecture, fit-out, project coordination
- **Countries of practice:** Saudi Arabia, Qatar, United Arab Emirates, Lebanon
- **Sectors:** residential (luxury villas, apartments), commercial, hospitality, retail, custom interiors
- **Email:** info@alaamasri.com
- **Phone / WhatsApp:** +966 57 053 3358
- **Website:** alaamasri.com
- **Education:** BT — Interior Decoration / Interior Design, Lebanon; TS studies — Interior Design
- **Languages:** Arabic (native), English (professional working proficiency)
- **Software:** AutoCAD, 3ds Max, V-Ray, Chaos Vantage, Blender, Photoshop, Illustrator, Figma
- **Digital:** AI-assisted design & visualisation, AI image generation for concepts, design presentation & web pages, HTML/CSS/JS basics
- **Website positioning lines:** "Design. Technical development. Execution." / "Interior design and interior architecture — from the first concept to the final handover." / "Imagination. With the knowledge to make it real." / "Every space. Every detail." / "Let's create spaces that last."
- **Process (website):** 01 Envision · 02 Develop · 03 Deliver (with copy)
- **Expertise (website, 7 disciplines):** Interior design · Interior architecture · Technical & shop drawings · BOQ & cost estimation · Fit-out & coordination · Site supervision · 3D visualization

## 1.3 Project inventory

All seven projects are presented on the website with a poetic title, a category and a one-sentence description. **No project has a location, year, client/type, area, status (built / design / concept), role, scope or team listed.**

| # | Website title | Category | Images | Resolution | Strength for print |
|---|---|---|---|---|---|
| A | An arched retreat | Hospitality / Design study | 7 | all 1800 × 1005 | ★★★ Largest set, widest range of spaces (reception, suite, dining, banquet, pool, rooftop, bedroom) |
| B | The skyline suite | Residential / Bedroom | 6 | all 1800 × 1005 | ★★★ Includes the only **material palette board** in the repo — supports the technical story |
| C | The walnut suite | Residential / Bedroom | 5 | 4 × 1800, 1 × 1344 | ★★★ Strongest **joinery / detail** story (media wall, lit shelving, reveals) |
| D | The illuminated villa | Architecture / Exterior | 5 | all 1800 × 1005 | ★★★ Only exterior/architecture work; day-to-dusk sequence |
| E | Living by the garden | Residential / Living | 5 | all 1800 × 1005 | ★★☆ Strong opener; two images are styling close-ups |
| F | The burgundy salon | Residential / Living | 3 | all 1800 × 1005 | ★★☆ Striking double-height hero, but only 3 views |
| G | An earthy welcome | Residential / Majlis | 5 | 2 × 1800, 3 × 1344 | ★★☆ Good hero; 3 images are lower-res close-ups (majlis-04 is heavily compressed — 28 KB) |

Gallery (unattributed to any project): fireside lounge, selection-01 … selection-12 (selection-08 exists but is not used on the website). Themes: living/majlis, staircases & entrances, bedrooms, dining, dressing room, bathroom vanity, material detail.

## 1.4 Image quality — the critical print finding

All images are **web-exported WebP files** (lossy compression). Largest width is 1800 px. For printing at A4:

| Placement on A4 portrait | Printed width | Effective resolution | Verdict |
|---|---|---|---|
| Full-bleed width band (216 mm incl. bleed) | 216 mm | ~212 ppi | Acceptable for renders, not true 300 ppi |
| Text-block width (≈ 170 mm) | 170 mm | ~270 ppi | Good |
| Half page / two-up (≈ 105 mm) | 105 mm | ~435 ppi | Excellent |
| Full-bleed **portrait** crop from a landscape image | 303 mm tall | ~84 ppi | **Not usable** — will look soft |
| A3 landscape full width (420 mm) | 420 mm | ~109 ppi | **Not usable** without originals |

Consequences for the design (already built into the page plan below):
1. Images are 16:9 landscape. On A4 portrait, the strongest honest layout is a **full-width landscape band** (with a dark or ivory field above/below for type), not a full-bleed vertical crop.
2. No image will be enlarged beyond ~216 mm wide or stretched; aspect ratios are preserved.
3. **To reach true 300 ppi and to allow A3 landscape later, I need the original render files** (ideally ≥ 3500 px wide, PNG/TIFF/max-quality JPG). The book can be built now with current files and re-linked later — the layout will not change.

## 1.5 Gaps (nothing below will be invented)

- No project metadata (location, year, client type, status, area, role, scope).
- No drawings of any kind (plans, elevations, sections, shop drawings, joinery details, ceiling plans).
- No BOQ / specification / schedule samples.
- No site or completed-project photography (everything is visualisation).
- No career timeline: the CV and profile describe **one consolidated role** with no employer names, dates or project list per position. A timeline cannot be drawn without this.
- Gallery images are not linked to projects.
- The portrait exists only at 1254 px (fine up to ~105 mm wide at 300 ppi).

---

# PHASE 2 — PAGE ARCHITECTURE

## 2.1 Format & grid

- **Trim:** A4 portrait, 210 × 297 mm · **Bleed:** 3 mm (document 216 × 303 mm) · crop marks on print PDF.
- **Margins:** inner 20 mm · outer 16 mm · top 18 mm · bottom 22 mm (running footer sits 10 mm above trim; no text within 8 mm of trim).
- **Grid:** 12 columns, 4 mm gutter; 6 mm baseline grid.
- **Length:** **40 pages** (a multiple of 4, so it can be saddle-stitched or perfect-bound without blanks).
- **A3 landscape readiness:** each layout is built from grid modules (image band, text column, caption rail), so an A3 landscape version = two A4 modules side by side. This needs original high-res images (see 1.4).
- **Folio / running footer:** `ALAA MASRI — PORTFOLIO 2026` left · section name centre · page number right (hidden on cover, back cover and full-image pages).

## 2.2 Typography (from the website identity)

| Level | Face | Print size |
|---|---|---|
| Cover name | Instrument Serif | 72–96 pt, tight tracking |
| Section titles | Instrument Serif | 44–56 pt |
| Project titles | Instrument Serif (italic accent word) | 40–54 pt |
| Statements / pull quotes | Instrument Serif | 20–26 pt |
| Subtitles | Inter 400 | 11–12 pt |
| Body | Inter 300/400 | 9.25 pt / 14 pt leading |
| Metadata labels | Inter 500, caps, +14% tracking | 7 pt |
| Captions | Inter 400 | 7.5 pt |
| Page numbers | Inter 500 tabular | 7 pt |

Nothing smaller than 7 pt; no hairlines thinner than 0.25 pt.

## 2.3 Colour (website tokens translated to CMYK-safe values)

| Role | Screen (website) | Print intent |
|---|---|---|
| Deep charcoal / olive-black | `#131411` | Rich black built on 60/40/40/100 — not registration black |
| Olive surface | `#1E201B` / CV olive `#3E4A2E` | Kept within CMYK gamut |
| Warm ivory paper | `#F0EDE6` | ~3/4/8/0 (or uncoated ivory stock) |
| Warm grey text | `#9D9F94` | 0/0/0/45 + warm tint |
| Bronze accent | `#C4A784` | ~20/32/50/5 — used only for rules, numerals, small labels |

No saturated colour anywhere; images carry the colour.

## 2.4 Page-by-page plan

Legend — **L**: layout · **I**: images · **T**: text source · ⚠ = needs your input

### Opening

| Page | Title | Content |
|---|---|---|
| **01** | **Cover** | L: charcoal field, "ALAA MASRI" oversized serif, titles in small caps sans, one landscape band image. I: `skyline-suite-01` (website hero) — alternatives `burgundy-salon-01`, `arched-retreat-01`. T: name, titles, "Portfolio 2026". |
| **02** | **Introduction** | L: ivory, large statement, small contact block at foot. T: "Interior design and interior architecture — from the first concept to the final handover." + "Design. Technical development. Execution." + Riyadh, Saudi Arabia · email · phone · alaamasri.com. |
| **03** | **Contents** | L: numbered section list, bronze numerals; small thumbnail strip. T: section names. |
| **04** | **Profile** | L: portrait (cut-out on ivory) left, text right. I: `portrait.png`. T: website first-person profile (3 paragraphs) — or third person, ⚠ your choice. |
| **05** | **At a glance** | L: data page — "15+ years", four countries, sectors, education, languages, software. T: profile/CV. |
| **06** | **Expertise** | L: 7 disciplines as a numbered index with sub-items (website copy). T: website expertise section. |
| **07** | **Selected Works — index** | L: section divider; seven numbered projects with thumbnail, title, category. |

### Selected Works — Major Project 01: *An Arched Retreat* (Hospitality / Design study) — 5 pp.

| Page | Role | Images / content |
|---|---|---|
| **08** | Opener | Full-width band `arched-retreat-01` (reception) · oversized title · category · ⚠ location / year / status |
| **09** | Overview | Description (website) · ⚠ role · ⚠ scope · ⚠ design intent · metadata column · image `arched-retreat-02` (suite) |
| **10** | Visual — public spaces | `arched-retreat-03` (dining) + `arched-retreat-04` (banquet) stacked |
| **11** | Visual — leisure | `arched-retreat-05` (pool) full-width + `arched-retreat-06` (rooftop) |
| **12** | Visual — guest room | `arched-retreat-07` large + short caption; space reserved for plan ⚠ if supplied |

### Major Project 02: *The Skyline Suite* (Residential / Bedroom) — 5 pp.

| Page | Role | Images / content |
|---|---|---|
| **13** | Opener | `skyline-suite-01` (bedroom, skyline at night) |
| **14** | Overview | Description · ⚠ metadata · `skyline-suite-02` (towards wardrobes) |
| **15** | Joinery | `skyline-suite-04` (illuminated wardrobe) full-width + caption on glass/walnut frames |
| **16** | Details | `skyline-suite-03` (bed) + `skyline-suite-05` (pendant) two-up |
| **17** | Materials | `skyline-suite-06` material palette board at text width + material list read from the board (walnut panelling, taupe velvet headboard, beige linen, gold-beige drapery, dark oak flooring, cream shag rug, brown leather) — technical bridge page |

### Major Project 03: *The Walnut Suite* (Residential / Bedroom) — 4 pp.

| Page | Role | Images / content |
|---|---|---|
| **18** | Opener | `walnut-suite-01` (symmetrical headboard wall) |
| **19** | Overview | Description · ⚠ metadata · `walnut-suite-02` (media wall) |
| **20** | Joinery detail | `walnut-suite-03` (lit shelving) full-width |
| **21** | Material detail | `walnut-suite-05` (velvet/walnut/reveal) + `walnut-suite-04` (bedside) two-up; space reserved for joinery section/elevation ⚠ if supplied |

### Project 04: *The Illuminated Villa* (Architecture / Exterior) — 3 pp.

| Page | Role | Images / content |
|---|---|---|
| **22** | Opener | `illuminated-villa-02` (facade at dusk) |
| **23** | Overview + context | Description · ⚠ metadata · `illuminated-villa-01` (aerial) + `illuminated-villa-05` (daylight) |
| **24** | Details | `illuminated-villa-03` (entrance) + `illuminated-villa-04` (screen & lighting detail) |

### Project 05: *Living by the Garden* (Residential / Living) — 3 pp.

| Page | Role | Images / content |
|---|---|---|
| **25** | Opener | `garden-lounge-01` (open-plan living) |
| **26** | Overview + dining | Description · ⚠ metadata · `garden-lounge-02` (dining) |
| **27** | Details | `garden-lounge-03` (fireplace wall) + `garden-lounge-05` (lounge chair) — `garden-lounge-04` kept as reserve |

### Project 06: *The Burgundy Salon* (Residential / Living) — 2 pp.

| Page | Role | Images / content |
|---|---|---|
| **28** | Opener + overview | `burgundy-salon-01` (double-height salon) + description · ⚠ metadata |
| **29** | Visual | `burgundy-salon-02` (lower angle) + `burgundy-salon-03` (velvet detail) |

### Project 07: *An Earthy Welcome* (Residential / Majlis) — 2 pp.

| Page | Role | Images / content |
|---|---|---|
| **30** | Opener + overview | `earth-toned-majlis-01` (majlis) + description · ⚠ metadata |
| **31** | Visual | `earth-toned-majlis-03` (lit shelving) + `earth-toned-majlis-02` (seating detail, printed small — 1344 px). `-04` excluded (too compressed), `-05` reserve |

### Selected Interiors (gallery) — 3 pp.

| Page | Images (website captions) |
|---|---|
| **32** | Divider + `fireside-lounge` ("The fireside lounge") + `selection-06` ("The grand arrival") |
| **33** | `selection-05` ("The contemporary majlis") · `selection-02` ("A sculptural ascent") · `selection-04` ("Gathered around light") |
| **34** | `selection-03` ("An intimate retreat") · `selection-10` ("Tailored in timber", portrait) · `selection-08` (vanity, portrait — ⚠ caption needed) |

Reserve: `selection-01`, `-07`, `-09`, `-11`, `-12` (`-12` is used on p. 35).

### Closing sections

| Page | Title | Content |
|---|---|---|
| **35** | **Technical Capability** | L: text-led, two columns. Statement + the concept-to-execution chain: technical drawings & shop-drawing coordination · BOQ, take-off & cost estimation · material & finish selection / sample review · supplier & factory coordination (carpentry, steel, stone, glass) · contractor coordination · site inspections & quality control · handover. List of fit-out works (ceilings, joinery, cladding, panels, stone & marble, steel, glass, lighting, custom furniture). I: `selection-12` (material detail). T: profile/CV only. |
| **36** | **Technical Work — drawings** | ⚠ **Reserved page.** Needs real drawings (plan, ceiling plan, joinery elevation/section, shop drawing, BOQ extract). If none can be supplied, this page becomes a second text page on coordination & execution — no placeholder drawings will be drawn. |
| **37** | **Process** | 01 Envision · 02 Develop · 03 Deliver (website copy) on charcoal, `garden-lounge-03` as band. |
| **38** | **Experience** | Current consolidated role (title, Riyadh, 13 responsibilities condensed into 4 groups) · international experience · specialised project experience (residential / commercial / fit-out) · professional strengths. ⚠ Timeline requires employers and dates. |
| **39** | **Contact** | "Let's create spaces that last." · audience line (private clients, developers, contractors, consultants, design studios) · email · phone/WhatsApp · website · Riyadh. |
| **40** | **Back cover** | Charcoal, small "AM." monogram (from the website logo), website URL. |

## 2.5 Images selected — summary per project

| Project | Selected (in order) | Reserve / excluded |
|---|---|---|
| An Arched Retreat | 01, 02, 03, 04, 05, 06, 07 | — |
| The Skyline Suite | 01, 02, 04, 03, 05, 06 | — |
| The Walnut Suite | 01, 02, 03, 05, 04 | — |
| The Illuminated Villa | 02, 01, 05, 03, 04 | — |
| Living by the Garden | 01, 02, 03, 05 | 04 (reserve) |
| The Burgundy Salon | 01, 02, 03 | — |
| An Earthy Welcome | 01, 03, 02 | 05 (reserve), 04 (excluded — compression) |
| Selected Interiors | fireside-lounge, 06, 05, 02, 04, 03, 10, 08 | 01, 07, 09, 11 (reserve) |
| Technical / Process | selection-12, garden-lounge-03 | — |
| Cover | skyline-suite-01 | alt: burgundy-salon-01, arched-retreat-01 |
| Profile | portrait.png | — |

`*-cover.webp` and `*-sm.webp` files are low-resolution website thumbnails and will not be used.

## 2.6 Deliverables & tooling plan (Phases 5–7)

- **Editable source:** HTML/CSS page templates + a build script in `portfolio-book/` (every text, image and colour is a token, so you or a designer can change content and re-export). A4 ⇄ A3 landscape is a page-size switch plus module re-flow.
- **Print PDF:** A4 + 3 mm bleed, crop marks, fonts embedded, images at native resolution (no upsampling). Chromium produces RGB PDFs; I will attempt a CMYK / PDF/X conversion with Ghostscript in Phase 7 and report whether that succeeded. If it cannot be done here, the palette is already chosen to be CMYK-safe and your printer can convert on their RIP.
- **Screen PDF:** trim size, no marks, images compressed for email (target < 20 MB), clickable email/phone/website links.
- `portfolio-book/` will be excluded from the website deployment so none of this becomes public.

---

# QUESTIONS FOR YOU (needed before/while building)

### A. For every project (A–G)
Please give whatever you can — anything left blank will simply be omitted, not invented:
1. **Real project name** (or keep the website's poetic titles?)
2. **Location** (city, country)
3. **Year** (or year range)
4. **Status:** completed / under construction / design stage / concept or design study
5. **Client type:** private villa, developer, hotel, etc. (no names needed if confidential)
6. **Your role:** e.g. lead designer, interior architect, project coordinator
7. **Scope:** concept, design development, technical drawings, BOQ, supervision, handover…
8. **Area** (m²) — optional
9. **Design intent:** one or two sentences in your words
10. **Were the visuals produced by you?** Which tools (3ds Max/V-Ray, Chaos Vantage, Blender, AI-assisted)? This decides caption wording such as "Design visualisation" — important for credibility with firms.

Also: are *The Walnut Suite*, *The Skyline Suite* and *The Burgundy Salon* separate projects, or rooms of the same residence?

### B. Gallery
- Do any of the 13 gallery images belong to a project (or to one of the seven above)?
- Caption for `selection-08` (bathroom / vanity)?

### C. Technical material (most important for the senior positioning)
- Any **plans, ceiling plans, elevations, sections, joinery details, shop drawings** (PDF/DWG exports) from these or other projects?
- A **BOQ or specification extract** (can be anonymised/blurred)?
- **Site or completed-project photos**?

### D. Career
- For a real timeline: **employers / studios, cities, start–end years, title** for each position. Currently only one consolidated role exists.
- Any notable clients or projects you are allowed to name?

### E. Images
- **Original high-resolution renders** (≥ 3500 px wide, PNG/TIFF/max-quality JPG) — needed for true 300 ppi and for any A3 version.

### F. Preferences
- Profile text in **first person** (as on the website) or **third person** (more usual in firm submissions)?
- Year on the cover: "Portfolio 2026" or "2026–2027" (matching the CV file name)?
- Should the phone number appear in the PDF you send to firms? (It is already public on the website.)
