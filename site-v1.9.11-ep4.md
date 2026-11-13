# Site v1.9.11 — Navy Monarch Episode 4 on /videos/

Built 2026-11-13 ~03:03 EET from live v1.9.10 (copy of `site-v1.9.10-free-pages/`).
Source of the task: parent agent — Episode 4 live on YouTube; /videos/ still listed 4 long videos / 19 total.

## Why this build exists (race note)
An earlier v1.9.9-ep4 build (commit 148939c, ~02:45 EET) already added Ep 4 to /videos/,
but it was built from v1.9.8-part4. The v1.9.10 build was based on the *other* v1.9.9
(missing-books), so the Ep 4 videos change was lost. This build re-applies it onto v1.9.10.
The Ep 4 card copy below is reused verbatim from that verified v1.9.9-ep4 build.

## Verified before building
- Episode 4: "Navy Monarch - Episode 4 - The Last Glow", channel Nile Coloring Books,
  https://www.youtube.com/watch?v=mhwV75vgWX4, 10:00, Public.
  Verified by the v1.9.9-ep4 build via YouTube oEmbed (02:45 EET) and by the parent task.
  My own fetch of the watch page on 2026-11-13 returned HTTP 429 (YouTube rate limit),
  so I did NOT re-fetch it — title/duration come from those two verified sources.
- Part 4 book page exists in this build: /books/navy-monarch-coloring-story-part-4/
  (buy links verified in-folder: gumroad.com/l/xdzuiu?offer_code=BLACKFRIDAY30,
  creem.io/product/prod_3mPtJzbySElkbbVp1qCKxq?discount_code=BLACKFRIDAY30).

## Changes (only 2 files differ vs v1.9.10)
- `videos/index.html`:
  - Ep 4 card added to Featured long videos (lite facade, data-video mhwV75vgWX4, 10:00).
    Copy: "The final chapter! A giant egg hatches in the museum and a tiny moth creature
    joins the adventure — from the observatory to Big Ben and a sunrise finale.
    A 10-minute coloring story from the Navy Monarch book, Part 4."
    Links follow the Ep 1 pattern: "Get the Part 4 book →" → /books/navy-monarch-coloring-story-part-4/
    (that page carries both store links with BLACKFRIDAY30) + Watch on YouTube.
  - Hero count: "19 videos: 4 long videos + 15 Shorts." → "20 videos: 5 long videos + 15 Shorts."
  - Meta description + og:description: "follow Navy Monarch's first episode" →
    "follow all four Navy Monarch episodes" (both spots).
  - JSON-LD: WebPage description "4 long videos" → "5 long videos"; 5th VideoObject added
    for Ep 4 in the RICH format matching the other four (name, description, thumbnailUrl,
    uploadDate, duration, contentUrl, embedUrl, author).
  - Homepage index.html needed NO change: it carries no video count (checked by grep).
- `sitemap.xml`: lastmod for /videos/ only: 2026-11-12 → 2026-11-13. No new URLs; still 65.

## ⚠️ TO-VERIFY: Ep 4 VideoObject uploadDate
`uploadDate` is set to "2026-11-13" but is NOT directly verified — YouTube returned 429
to my fetch, and the earlier build log records no upload date. Inference: the video went
live between the 02:03 EET SEO pack (4 long videos) and the 02:45 EET Ep 4 build, both on
Nov 13. Duration "PT10M0S" IS verified (oEmbed + parent task). Confirm the date in
YouTube Studio when the titles/descriptions from the YouTube SEO pack are pasted, and
correct the JSON-LD then if it differs.

## Verification (all pass)
- JSON-LD parses: 5 VideoObjects; Ep 4 contentUrl + duration correct.
- 5 long-video cards; `watch?v=` occurrences 12 → 15; `data-video=` count 20 (5 long + 15 Shorts).
- "19 videos" / "first episode": 0 remaining on the page.
- `diff -rq` vs v1.9.10: ONLY videos/index.html + sitemap.xml differ.
- Zip re-verified from inside: videos/index.html + sitemap.xml present, testzip OK,
  no .md files in zip, zip does not contain itself.

## Deploy (NOT done by this build — parent deploys separately)
- Zip: `site-dist-for-drop.zip` (SHA256 219e46e4b481d1089de485871878dc83d6b417035d28063c5cddfbbcf120ae6e,
  35,705,680 bytes, 216 entries).
- NOTE: 35.7 MB is over GitHub's 25 MB web-upload limit — deploy via the temp-release +
  Codespace `gh release download` route (SHA-verified), as with v1.9.9/v1.9.10. Never
  shrink the site to fit the uploader.
- Verify live: /videos/ 200 with 5 long cards + "20 videos: 5 long videos + 15 Shorts";
  homepage still "25 books · 2 bundles"; sitemap still 65 URLs.
- After deploy, request GSC indexing for /videos/ (lastmod changed). GSC daily quota is
  7 requests/day and 7 were already used on 2026-11-13 — so this request belongs to the
  next day's batch, not today's.
