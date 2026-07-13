# SEO Roadmap — one task per agent

This file tracks the remaining SEO/performance work from `SEO.md`, broken into
**independent, self-contained tasks**. Hand each task to a fresh agent. Every
task lists its context, the exact change, the files, acceptance criteria, and
any decision needed from Felipe.

**Delete this file (and its pointer in `CLAUDE.md`) once every task below is
Done.** `SEO.md` stays as the reference/rationale.

Deploy loop for every task: edit `src/`, `npx @11ty/eleventy`, verify locally,
commit `src/` + `_site/`, `git push`, then on the server
`ssh -i ~/.ssh/perport_hostinger -p 65002 <user>@<host> "cd ~/domains/fcarvajalbrown.com/repo && git pull origin master"`.
Connection details are in the gitignored `.env`. See CLAUDE.md "Deploying to Hostinger".

| Task | Item | Status | Priority |
|------|------|--------|----------|
| 1 | Portfolio snapshot path `/data.json` | **Done** (2026-07-13) | P0 |
| — | `.htaccess` cache policy | **Done** (2026-07-13) | P0 |
| 2 | Static content in initial HTML | **Done** (2026-07-13) | P0 |
| 3 | Meta description + Open Graph/Twitter | **Done** (2026-07-13) | P1 |
| 4 | Cross-domain canonical | **Done** (2026-07-13) | P1 |
| 5 | `sitemap.xml` + `robots.txt` | **Done** (2026-07-13) | P1 |
| 6 | Person/ProfilePage JSON-LD | **Done** (2026-07-13) | P1 |
| 7 | Optimize logo image | **Done** (2026-07-13) | P2 |
| 8 | Font-loading polish | **Done** (2026-07-13) | P2 |
| 9 | Google Search Console submit | Not started (Felipe) | P1 |
| 10 | Per-language `lang` + hreflang | **Done** (2026-07-13, with language selector) | P2 |

---

## Task 2 — Static content in the initial HTML (also fixes the "Loading..." gap) — Done (2026-07-13)

Both portfolio pages now render `<h1 id="name">Felipe Carvajal Brown</h1>`, a static
`#bio` default (restated tagline opening), and a `<noscript>` fallback linking to
`github.com/fcarvajalbrown`. `script.js` `renderProfile` still overwrites `#name`/`#bio`
on snapshot/live load. Applied to both `src/portfolio/index.html` (ES) and
`src/en/portfolio/index.html` (EN).

**Priority:** P0. **Why:** The portfolio `<h1>` renders "Loading..." and the bio
"Fetching profile..." until JS fetches the snapshot, so (a) non-JS crawlers
(ClaudeBot, GPTBot, Googlebot's first pass) see placeholder text, and (b) users
see a blank hero for the snapshot fetch duration. Rendering real content first
removes both problems.

**Files:** `src/portfolio/index.html`, possibly `src/script.js`.

**Changes:**
1. In `src/portfolio/index.html`, change the hero `<h1 id="name">Loading...</h1>`
   default to `Felipe Carvajal Brown` (JS still overwrites it with the live
   login/name when the snapshot loads). Never ship "Loading..." as the indexed H1.
2. Optionally set the bio `<p id="bio">` default to a short static sentence
   instead of "Fetching profile...".
3. Add a `<noscript>` block in the portfolio page with one static line plus a
   link to `https://github.com/fcarvajalbrown`, so no-JS crawlers get real content.
4. Confirm `script.js` still overwrites these on snapshot/live load (it does:
   `renderProfile` sets `#name`/`#bio`).

**Acceptance:** `curl https://fcarvajalbrown.com/portfolio/` shows
"Felipe Carvajal Brown" as the H1 in the raw HTML (not "Loading..."), a
`<noscript>` fallback is present, and the page still hydrates correctly in a
browser. Rebuild so `script.js`/HTML hashes update; deploy.

**Decision needed from Felipe:** the exact static bio sentence (do not invent
new facts; a plain restatement of the existing tagline is fine).

---

## Task 3 — Meta description + Open Graph + Twitter cards — Done (2026-07-13)

Each of the six pages has a unique `description` in its front matter (Home ES/EN,
Portfolio ES/EN, Writing ES, Works ES; the two Home ones trimmed to ~150 chars).
`layout.njk` renders `<meta name="description">` plus the OG and Twitter tags
(`og:type/site_name/title/description/url/image/image:width/height/alt/locale`,
`twitter:card=summary_large_image` + title/description/image). A real
1200x630 `src/og-image.png` (spade-skull on the dark brand palette, name and
roles) is passthrough-copied in `.eleventy.js`. `og:locale` switches es_ES/en_US
by `langCode`.

**Priority:** P1. **Why:** No page has a meta description or social tags; SERP
snippets and link previews are unmanaged.

**Files:** `src/_includes/layout.njk`; front matter of each page
(`src/index.md`, `src/writing/index.md`, `src/portfolio/index.html`,
`src/works/index.md`).

**Changes:**
1. Add a `description` (and optional `ogImage`) field to each page's front matter.
2. In `layout.njk` `<head>`, render:
   ```html
   <meta name="description" content="{{ description }}">
   <meta property="og:title" content="{{ title }} · Felipe Carvajal Brown">
   <meta property="og:description" content="{{ description }}">
   <meta property="og:type" content="website">
   <meta property="og:url" content="https://fcarvajalbrown.com{{ page.url }}">
   <meta property="og:image" content="https://fcarvajalbrown.com/og-image.png">
   <meta name="twitter:card" content="summary_large_image">
   ```
3. Provide a 1200x630 `src/og-image.png` (passthrough copy). If not ready, ship
   the text tags first and add `og:image` later.

**Acceptance:** each page's raw HTML has a unique `<meta name="description">`
(~150-160 chars) and the four OG tags with the correct absolute URL.

**Decision needed from Felipe:** the description text per page (his voice, real
facts only), and the og-image artwork.

---

## Task 4 — Cross-domain canonical — Done (2026-07-13)

`layout.njk` now renders `<link rel="canonical" href="https://fcarvajalbrown.com{{ page.url }}">`
in `<head>` (always the primary domain, absolute), so the six pages carry a
self-canonical on Hostinger and a cross-domain canonical to the primary on the
Pages backup.

**Priority:** P1. **Why:** The GitHub Pages backup
(`fcarvajalbrown.github.io/perport/`) serves identical content to
`fcarvajalbrown.com`, splitting ranking signals. A canonical pointing at the
primary domain consolidates them.

**Files:** `src/_includes/layout.njk`.

**Change:** in `<head>`:
```html
<link rel="canonical" href="https://fcarvajalbrown.com{{ page.url }}">
```
Always the primary domain, absolute, even in the Pages build.

**Acceptance:** every page's raw HTML has a canonical to
`https://fcarvajalbrown.com<path>`. Verify on both Hostinger and Pages.

---

## Task 5 — sitemap.xml + robots.txt — Done (2026-07-13)

`src/robots.txt` (passthrough-copied in `.eleventy.js`) allows all and points to
the sitemap. `src/sitemap.njk` (`permalink: /sitemap.xml`,
`eleventyExcludeFromCollections`) loops `collections.all`, filters to `.html`
outputs, and emits absolute `https://fcarvajalbrown.com` `<loc>`s. The sitemap
lists all six real pages (ES `/`, `/portfolio/`, `/writing/`, `/works/`; EN
`/en/`, `/en/portfolio/`) — the four-page count in the original spec predates the
bilingual work (Task 10).

**Priority:** P1. **Why:** Neither exists; both are needed for reliable
discovery and Search Console submission.

**Files:** create `src/robots.txt` (passthrough copy) and `src/sitemap.njk`.

**Changes:**
1. `src/robots.txt`:
   ```
   User-agent: *
   Allow: /
   Sitemap: https://fcarvajalbrown.com/sitemap.xml
   ```
   Add its passthrough copy in `.eleventy.js`
   (`addPassthroughCopy({ "src/robots.txt": "robots.txt" })`).
2. `src/sitemap.njk` producing an XML sitemap of the site's HTML pages, e.g. loop
   `collections.all`, filter to `.html` outputs, emit `<url><loc>` with the
   absolute `https://fcarvajalbrown.com` prefix. Set `permalink: /sitemap.xml`
   and `eleventyExcludeFromCollections` where needed.

**Acceptance:** `https://fcarvajalbrown.com/robots.txt` and `/sitemap.xml` both
return 200; the sitemap lists exactly the four canonical pages, all 200.

---

## Task 6 — Person / ProfilePage JSON-LD — Done (2026-07-13)

`layout.njk` renders a `Person` JSON-LD block gated on a `personSchema: true`
front-matter flag, set only on the two home pages (`src/index.md`,
`src/en/index.md`) so the entity appears once per language, not on every page.
Facts are on-record only: jobTitle "Engineer and independent researcher",
`alumniOf` UPM, `knowsAbout` numerical simulation + software engineering.
`sameAs`: GitHub, LinkedIn (`in/fcarvajalbrown`), ORCID `0000-0002-8300-7587`.

**Priority:** P1. **Why:** Structured data for E-E-A-T, author identity, and
Knowledge Panel eligibility.

**Files:** `src/index.md` (Home) or `src/_includes/layout.njk` (Home only).

**Change:** add one JSON-LD `<script type="application/ld+json">` on the Home page:
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Felipe Carvajal Brown",
  "jobTitle": "Engineer and independent researcher",
  "alumniOf": "Universidad Politécnica de Madrid",
  "knowsAbout": ["Numerical simulation", "Software engineering"],
  "url": "https://fcarvajalbrown.com",
  "sameAs": [
    "https://github.com/fcarvajalbrown",
    "https://orcid.org/0000-0002-8300-7587"
  ]
}
```

**Acceptance:** passes Google's Rich Results Test / Schema validator with no
errors; only real, on-record facts used.

**Decision needed from Felipe:** any additional `sameAs` URLs (LinkedIn, etc.).
Do not invent profile URLs.

---

## Task 7 — Optimize the logo image — Done (2026-07-13)

`scripts/gen-logo-assets.js` (uses `sharp`, added as a devDependency) generates
from the 906x1000 ~140 KB `src/logo.png`: `logo-nav.png` (4.4 KB) +
`logo-nav.webp` (2.1 KB) at 2x the 29x32 nav box, `favicon-32.png` (1.7 KB,
transparent so it adapts to the tab background like the original), and
`apple-touch-icon.png` (16 KB, opaque brand-dark bg for iOS). `layout.njk` nav
uses a `<picture>` with WebP + PNG fallback keeping `width`/`height` (no layout
shift); favicon + apple-touch `<link>`s point at the small assets. The unused
140 KB `logo.png` is no longer passthrough-copied. Re-run the script after
changing the source logo.

**Priority:** P2. **Why:** `src/logo.png` is 906x1000, ~140 KB, but displays at
32 px in the nav and as a favicon. Large download on every page.

**Files:** `src/logo.png` (+ new small variants), `src/_includes/layout.njk`,
`.eleventy.js`.

**Changes:** generate a small nav logo (e.g. 64x64) and proper favicon sizes
(16/32/180). Consider a WebP nav variant with PNG fallback. Update the
`<img class="site-nav-logo">` and favicon `<link>` to the small assets. Keep the
existing `width`/`height` attributes.

**Acceptance:** nav logo asset is a few KB, not 140 KB; favicon crisp at 16-32 px;
no layout shift.

---

## Task 8 — Font-loading polish — Done (2026-07-13)

`preconnect` (googleapis + gstatic) and `&display=swap` were already present, so
no render-blocking hack was warranted. The one real win: the Inter request asked
for weight 300, which the CSS never uses (only 400/500/600/700). Dropped 300 from
the Google Fonts URL in `layout.njk`, removing one font file from every page load.

**Priority:** P2. **Why:** Minor render-blocking reduction. `&display=swap` and
`preconnect` are already present, so this is optional.

**Files:** `src/_includes/layout.njk`.

**Change:** optionally `preload` only the single above-the-fold Inter weight,
backed by a system fallback. Only do this if Lighthouse flags render-blocking
fonts; otherwise close as "no change needed".

**Acceptance:** Lighthouse no longer flags render-blocking fonts, or task closed
as unnecessary.

---

## Task 9 — Google Search Console (Felipe's manual step)

**Priority:** P1. Add `fcarvajalbrown.com` as a property in Search Console,
verify ownership (DNS TXT or an HTML verification file — an agent can drop a
verification file into `src/` as passthrough copy if Felipe provides the token),
submit `sitemap.xml` (needs Task 5 first), and use "Request indexing" per page.

**Acceptance:** property verified, sitemap submitted and read, pages requested.

---

## Task 10 — Per-language `lang` + hreflang (do with the language selector)

**Priority:** P2. **Why:** `layout.njk` is hard-coded `lang="en"`; the site is
becoming Spanish/English bilingual. **This should be folded into the language
selector work, not done separately.** Set `lang="es"`/`lang="en"` per page and
add reciprocal `hreflang` alternates between the two language versions.

**Acceptance:** each page has the correct `lang`, and reciprocal `hreflang`
(and `x-default`) tags linking the ES/EN versions.
