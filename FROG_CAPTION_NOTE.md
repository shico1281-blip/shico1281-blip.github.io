# Frog caption fix — v1.9.12.2 (ready to ride the next deploy, NOT deployed)

Owner decision: 2026-11-14 00:25 EET — the Little Nile Explorer frog caption is "Medium", not "Easy".

## Change
- Old: "Frog in the reeds — an easy page"
- New: "Frog in the reeds — a medium page"

## Files changed (2)
1. `books/little-nile-explorer/index.html` (line 71) — all three frog occurrences:
   - button `data-caption`
   - img `alt` ("… — a real page from this book")
   - `figcaption`
2. `catalog.json` (line 22) — frog preview `label` changed the same way for consistency.
   - Finding: catalog.json DID label the frog "Easy" (the only frog difficulty label there).

## Untouched
- Pyramids caption ("a detailed page") and maze caption ("an activity page") — unchanged.
- No URL, price, image, or other text changed. No other file differs from the base.

## Base / version check (done first)
- Live verified 2026-11-14 00:25 EET before touching anything: homepage 200 "26 books",
  /free/easy-coloring-pages/ 200 title "Coloring Pages for Kids", /pinterest-1b194.html 200,
  sitemap 67 URLs, live LNE page confirmed "an easy page" ×3 — matches v1.9.12.1
  (deployed ~23:32 EET 2026-11-13, zip commit 5380905).
- Base: `site-v1.9.12.1-easy-rename/` (exact deployed contents, minus internal note).
  Copy excludes any site-dist-for-drop.zip and *_NOTE.md files.

## Verification
- `diff -rq` base vs this copy: ONLY the two files above differ.
- `grep`: zero remaining "Frog in the reeds — an easy page" in either file.
- catalog.json parses as valid JSON; LNE HTML tags balanced; page JSON-LD parses as valid JSON.
- No zip built, no deploy, no commit, no push.
