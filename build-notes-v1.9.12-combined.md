# Site v1.9.12-combined — build notes

Built 2026-11-13 ~17:20 EET. Local build only — NOT deployed.
Base: `site-v1.9.11.2-viesearch/` (live v1.9.11.2, verified before building:
homepage "25 books · 2 bundles", sitemap 65 URLs, /videos/ hero "20 videos").
Build folder: `~/workspace/multi-platform-earning/site-v1.9.12-combined/`

## What this version combines

1. **/videos/ — Navy Monarch v2 swap + Episode 5.** All four old episode IDs
   replaced with the verified v2 IDs (Ep1 AqNrMqeoHzs, Ep2 JIBsNDi9X8s,
   Ep3 UCWNz69HUWQ, Ep4 mhwV75vgWX4); new Episode 5 card added
   (3WWz7kJJpCs, "The Garden of Light", links to the new Part 5 book page).
   Hero now "21 videos: 6 long videos + 15 Shorts". Meta/JSON-LD copy updated
   (four → five episodes; 5 → 6 long videos). The four re-uploaded episodes'
   uploadDate set to 2026-11-13. Ep4 card copy drops "The final chapter!"
   (Ep5 continues the story). Each new ID appears exactly 7× on the page
   (3× JSON-LD + facade href + data-video + thumbnail + Watch link).
2. **Innovation v1.1 I01+I02 patch** applied from
   `~/workspace/nile-organic-growth-v1/work/innovation-v1.1/patch/` (rsync):
   3 sampler PDFs, chooser page `/free/find-my-pack/`, I02 pilot on the
   Amazing Wildlife Vol. 2 page, chooser CTA on /free-printables/.
   Sampler SHA256s match PATCH_NOTES.md exactly. /videos/ and the studio
   were untouched by the patch (byte-identical to base).
3. **Navy Monarch Part 5 book page** — NEW `/books/navy-monarch-coloring-story-part-5/`
   ("Navy Monarch Coloring Story Part 5 — The Garden of Light"), modeled on
   the Part 4 page. Cover + 3 previews generated from v3 files only
   (cover PNG; pages 2, 20, 25 — garden path, giant sunflower, motorcycle
   finale; all visually checked: butterfly mask correct, "Page N" +
   "Sherif S." signature + own-scene guide inset intact). Price $3.99,
   26 pp, A4 + US Letter. Buy links with BLACKFRIDAY30: Creem
   prod_1qlUSX99nb6eKT0bWiPZDs ($2.80), Gumroad l/mtmrdl ($2.79).
   Added to catalog.json; homepage count → "26 books · 2 bundles";
   sitemap 65 → 67 URLs (+chooser page +Part 5 page).

## Final counts

- Books: **26** (28 catalog entries = 26 books + 2 bundles)
- Sitemap: **67 URLs** — every URL maps to a real file on disk
- Videos hero: **21 videos: 6 long videos + 15 Shorts**
- Viesearch footer link: on 67 of 69 HTML pages; the 2 without it are
  404.html and google6cf0008f41982c65.html (no footer markup — same as base)

## Extra fix found during QA

- `/free/butterfly-coloring-page/` linked the OLD Episode 1 video ID.
  Fixed to the new v2 ID (AqNrMqeoHzs). The whole-build grep for the old
  IDs is now 0 hits — including the two historical build notes
  (site-v1.9.10-free-pages.md, site-v1.9.11-ep4.md), whose old IDs were
  updated to the new ones so no stale ID survives in the deployed tree.

## Deliberately left out

- **Little Nile Explorer preview fix (lne-fix/) — NOT included**, per the
  build task: the owner has not decided on it. frog.webp / pyramids.webp /
  maze.webp are byte-identical to the live base (md5-verified).
- The stale overnight draft `nile-organic-growth-v1/work/site-patch-v1.9.12-draft/`
  was never used. Its PATCH_NOTES "no US Letter PDF located" claim is stale
  and was ignored (Letter PDFs are real since 2026-11-13).

## QA evidence (all run on this build folder)

- Old episode IDs: **0 hits** in the whole build (grep -r).
- New IDs: AqNrMqeoHzs 7, JIBsNDi9X8s 7, UCWNz69HUWQ 7, mhwV75vgWX4 7,
  3WWz7kJJpCs 7 on /videos/ (plus 1 more each on the butterfly page for Ep1).
- "25 books": 0 hits in HTML/JSON. Homepage: "26 books · 2 bundles".
- "20 videos" / "first four episodes" / "four Navy Monarch" / "5 long videos":
  0 hits.
- JSON-LD parses on all 6 changed pages (videos, Part 5, homepage,
  Amazing Wildlife Vol. 2, find-my-pack, free-printables).
- catalog.json diff vs base = exactly the Part 5 entry (28 entries).
- Sampler PDFs: SHA256 match PATCH_NOTES; Wildlife previews match too.
- Local HTTP serve: 16/16 key URLs return 200 (homepage, /videos/,
  Part 5 page, chooser, free-printables, sitemap, catalog.json, 3 samplers,
  cover, 3 Part 5 previews, butterfly page, Wildlife page).
- Part 5 page: no Part 4 buy links, cover, or preview filenames remain
  (only the related card links to Part 4, intentionally).

## Flags / known uncertainties (for the deployer)

1. **Video durations not verifiable from public metadata.** oEmbed and the
   embed page expose no lengthSeconds, and yt-dlp is not installed here.
   Ep1–4 kept their old displayed durations (10:01 / 10:00 / 10:00 / 10:00);
   Ep5 was set to 10:00 by series convention (badge + JSON-LD PT10M0S).
   The v2 files are the same videos with a swapped end screen, so durations
   should be within seconds — but if the real durations differ, correct the
   badges/JSON-LD before or right after deploy.
2. **Viesearch support-email draft is now stale.** Gmail draft id
   1a1d4a5e60853bc6 asks Viesearch to change the listing to "25 books".
   After this deploy the site has **26 books** (free pages stay 25).
   Do NOT send the draft as-is — update its numbers to 26 books first,
   once Sherif gives the go-ahead. (Draft was not sent or edited here.)
3. **Pins saying "25 books" go stale** once this deploys (site will have
   26 books) — fix per the standing rule after the deploy lands.
4. Creem BLACKFRIDAY30 coverage for Part 5 (28th product) still needs a
   live check — the code was last recreated covering 27 products.
5. GSC indexing after deploy: Part 5 page + chooser page (quota 7/day;
   Part 4 URL still pending too).

## Zip

- `site-dist-for-drop.zip` (exact name) — see SHA256 below.

## Addendum — LNE preview fix INCLUDED (Fri 2026-11-13 ~16:47 EET, main agent)

The builder excluded the Little Nile Explorer preview fix per the build brief
("owner has not decided", based on MEMORY.md written ~14:25 EET). That record
was stale: Sherif decided at **15:56 EET in the growth side chat
("Execute Nile Organic Growth package")** — his own words: "بدّل الصور بصفحات
حقيقية من الكتاب" (replace the images with real pages from the book). The
growth chat confirmed the fix done in the patch copy ~16:00 EET. Verified
directly from that chat's transcript before including it here.

- `assets/previews/little-nile-explorer/frog.webp` — old 23,570 B → new
  126,274 B, 900×1272, SHA256
  `ddceb14174053a58e6c69100f36b97dc6cee34e234a4823468fee922ade7e792`
  (real PDF p. 7 "Colour the Frog!").
- `assets/previews/little-nile-explorer/pyramids.webp` — old 20,274 B → new
  109,028 B, 900×1272, SHA256
  `d0be0fd721aa84010651e293dc2643a13b1a6784c8784dab6b7c88ebca03d5b7`
  (real PDF p. 19 "Colour the Pyramids!").
- `maze.webp` untouched; LNE page HTML untouched, so the claim "These are
  actual pages from the book" is now TRUE with no text change.
- Zip rebuilt after the swap; the rebuilt zip's SHA256 is recorded in the
  deploy record (verified by the deployer before upload), not in this file,
  because this file ships inside the zip.
- Residual (not fixed): frog caption still says "an easy page" while the
  real frog page is Medium — Sherif has a pending widget question about it
  in the growth chat.
