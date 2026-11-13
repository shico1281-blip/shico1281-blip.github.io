# Site v1.9.10 — 10 new free printable pages + 2 SEO fixes

- **Base:** `site-v1.9.9-missing-books` (live v1.9.9 — 25 books · 2 bundles, sitemap 55 URLs)
- **Built:** 2026-11-13 ~00:42 EET
- **Status:** built and verified, **NOT deployed**
- **Build script:** `~/workspace/multi-platform-earning/build-v1.9.10.py` (re-runnable; wipes and re-copies the base)
- **Deploy zip:** `site-dist-for-drop.zip` in this folder — **35,705,462 bytes**
- **SHA256:** `f7a26671784fa0661e5df4c06e1e2124ce630edae432d44e3c0bf09d4a4e0182`
- **Zip contents:** 306 entries, no corruption (`testzip` clean), no zip-in-zip, no `.md` inside

> Deploy note: the zip is 35.7 MB — above GitHub's 25 MB web-upload limit, same as v1.9.9.
> Deploy via the release-asset + Codespace route (AGENTS.md), never the web uploader.

## 1. The 10 new free pages (all under `/free/`, A4 PDF download, frog-page template)

| # | Slug | Title | Art source (existing book art, verified visually) | Upsell book → price |
|---|------|-------|--------------------------------------------------|---------------------|
| 1 | `cute-cow-coloring-page` | Free Cute Cow Coloring Page for Kids — Printable PDF | Cow mini-pack PDF p1 (front-facing cow, barn) | Cute Cow, Gumroad `l/gbczty` — $1.04 / $1.49 |
| 2 | `fox-coloring-page` | Free Fox Coloring Page for Kids — Printable PDF | Forest Animal Friends v4 PDF p3 (sitting fox, mushrooms) | Forest Animal Friends, Gumroad `l/ntawdj` — $2.09 / $2.99 |
| 3 | `owl-coloring-page` | Free Owl Coloring Page for Kids — Printable PDF | Forest Animal Friends v4 PDF p4 (owl on branch) | Forest Animal Friends, Gumroad `l/ntawdj` — $2.09 / $2.99 |
| 4 | `butterfly-coloring-page` | Free Butterfly Coloring Page for Kids — Printable PDF | Navy Monarch Part 1 p1 (heroine in butterfly lab) + YouTube Ep1 link in upsell | Navy Monarch Part 1, Gumroad `l/isswbt` — $2.79 / $3.99 |
| 5 | `back-to-school-coloring-page` | Free Back to School Coloring Page for Kids — Printable PDF | My School Day (Boy) PDF p14 (boy at desk, ABC DEF poster, globe) | My School Day Boy, Gumroad `l/xdeex` — $2.79 / $3.99 |
| 6 | `beach-coloring-page` | Free Beach Coloring Page for Kids — Printable PDF | Summer Seaside Boy B06_P09 (family at beach, sandcastle) | Summer Seaside Boy, Gumroad `l/meavla` — $2.79 / $3.99 |
| 7 | `ice-cream-coloring-page` | Free Ice Cream Coloring Page for Kids — Printable PDF | Summer Seaside Boy B06_P18B (family with ice creams, cart, palm, sea) | Summer Seaside Boy, Gumroad `l/meavla` — $2.79 / $3.99 |
| 8 | `pyramid-coloring-page` | Free Pyramid Coloring Page for Kids — Printable PDF | Pharaonic Mandala Book 4, `02-Page-02.png` (three pyramids mandala) | Pharaonic Mandala B4, **Creem only** `prod_9KMft4eIaqPsp8IwJ6h1C` — $2.80 / $3.99 |
| 9 | `train-coloring-page` | Free Train Coloring Page for Kids — Printable PDF | Egypt Explorers Book 2 lineart `P001_line.png` (kids boarding train at station) | Egypt Explorers Book 2, Gumroad `l/kavlya` — $2.79 / $3.99 |
| 10 | `farm-animals-coloring-page` | Free Farm Animals Coloring Page for Kids — Printable PDF | Animal 10-pack PDF p1 (sheep with barn) | Farm and Friends, Gumroad `l/rfuqjm` — $1.58 / $2.25 |

All upsell buttons carry `BLACKFRIDAY30` params, copied verbatim from each book's own site page.
Each page: title, meta + og + JSON-LD descriptions, scene paragraph, fun fact, A4 PDF link,
webp preview (900 px wide), 3 related free pages, "want the full book?" upsell.
Keyword, title and 2-line description per page follow Traffic Batch 2 §2.

### Asset sizes (webp 900 px wide; PDF single-page A4, JPEG-embedded like the frog template)

| Page | webp | PDF |
|------|------|-----|
| cute-cow | 900×1272, 158 KB | 366 KB |
| fox | 900×1273, 106 KB | 873 KB |
| owl | 900×1273, 107 KB | 878 KB |
| butterfly | 900×1273, 357 KB | 828 KB |
| back-to-school | 900×1273, 140 KB | 371 KB |
| beach | 900×1273, 111 KB | 792 KB |
| ice-cream | 900×1273, 144 KB | 987 KB |
| pyramid | 900×1273, 444 KB | 1142 KB |
| train | 900×1273, 193 KB | 680 KB |
| farm-animals | 900×1272, 132 KB | 319 KB |

## 2. Index + category updates

- `/free-printables/` index: 15 → **25 pages** (meta/og/JSON-LD rewritten, 10 cards appended).
- `/free/animals/`: 10 → **15** (cow, fox, owl, butterfly, farm animals).
- `/free/easy-coloring-pages/`: 4 → **13** (all new pages except pyramid).
- `/free/egypt-coloring-pages/`: 5 → **7** (pyramid, train).
- `/free/water-animals/`, `/free/christmas-coloring-pages/`: unchanged (no new pages belong there).
- All 15 old free pages: "See all 10/15 free coloring pages" → **"See all 25 free coloring pages"**.

## 3. Sitemap

- 55 → **65 URLs** (XML parses; the 10 new URLs added with `<lastmod>2026-11-13</lastmod>`).

## 4. Videos page — VideoObject JSON-LD upgrade

- The page already had 4 minimal VideoObjects (name + embedUrl + thumbnailUrl only).
  Upgraded **in place** (same single `<script type="application/ld+json">` WebPage block,
  no duplicate entities) to the rich VideoObjects from the YouTube SEO pack §6:
  name, description, thumbnailUrl, uploadDate, duration, contentUrl, embedUrl, author.
- Videos: A Day at the Nile (Ypv478XrNA8), Navy Monarch Ep1 (AqNrMqeoHzs),
  Ep2 (JIBsNDi9X8s), Ep3 (UCWNz69HUWQ). JSON parses.
- ⚠️ **Caveat:** the pack's `uploadDate` values are marked placeholders — verify in
  YouTube Studio (Ep1 + A Day at the Nile 2026-11-11; Ep2/Ep3 2026-11-12).
  The rich names are the pack's keyword-optimized titles and will mismatch the live
  YouTube titles until the owner pastes them in Studio.

## 5. Navy Monarch Part 1 meta-description fix

- Wrong sentence ("three friends through a day at the fair: the park gates, a roller
  coaster, a pirate ship" — My Amusement Park copy) removed from **all 4 spots**:
  meta description, og:description, JSON-LD Product description, visible paragraph.
- Replacement (grounded in the Part 1 QA report + the page's own details line):
  "Coloring story book for kids — 25 coloring pages following butterfly heroine Navy
  Monarch through a visual story in pictures: her butterfly lab, a stormy flight,
  a museum heist, a high-speed chase, a rescue and a parade. Every page includes a
  color guide and swatches. A4 PDFs. Instant download."
- Title tag was already correct and is untouched. JSON-LD parses after the fix.

## 6. What was NOT touched

- Catalog still **27 entries / 25 books**; homepage still says **"25 books"** — free pages
  are NOT books, the book count does not change.
- No book pages changed except Navy Part 1 (meta fix above).
- Blog article #2 from Traffic Batch 2 §3 is **NOT included** — it is a DRAFT that needs
  owner approval before use.

## 7. Verification (build script self-checks — FAILURES: 0)

- All 10 pages: HTML exists, webp + PDF assets exist, PDF is 1 page A4, page contains
  its title, description, correct buy link, correct book-page link, PDF link, and all
  3 related links.
- Sitemap parses with 65 URLs; catalog 27 entries; homepage "25 books".
- Videos JSON-LD parses (4 VideoObjects); Navy JSON-LD parses after fix.
- `diff` vs base shows only intended changes: 10 new page dirs + 20 new assets,
  Navy Part 1 page, animals/easy/egypt categories, free-printables index, sitemap,
  videos page, and the see-all line on the 15 old free pages.
- All 10 webps visually checked on a contact sheet: correct art per page, no clipping.
  Fox + pyramid PDFs rendered and visually checked (clean, guide inset intact on fox,
  complete mandala circle on pyramid).
- PDF fix during this build: the first build embedded raw PNGs (FlateDecode) making
  1.6–5.7 MB PDFs and a 59.9 MB zip. Rebuilt embedding JPEG q88 (DCTDecode, like the
  frog template) — PDFs now 319 KB–1.2 MB, zip 35.7 MB. Same art, same pages.

## 8. Flags for the owner / parent agent

1. **Color-guide insets:** 9 of the 10 new pages use the book's actual page, which
   includes the book's color-guide inset (small colored picture + swatch circles) —
   cow, fox, owl, butterfly, back-to-school, beach, ice-cream, train, farm-animals.
   Only pyramid is clean (mandala books have no guide). The inset is baked into the
   page image, not a separable layer, so it cannot be removed without regenerating
   art. It is a feature of the product line (a color guide for the child), but if the
   owner wants clean line art on the free pages, that needs new image generation.
2. **VideoObject uploadDates** are pack placeholders (see §4) — verify in YouTube Studio.
3. **GSC indexing:** the 10 new free URLs + the fixed Navy Part 1 URL join the pending
   indexing batch (still blocked on the owner's Google Yes tap from earlier).
4. Zip is 35.7 MB — deploy via the release-asset route, not the GitHub web uploader.
