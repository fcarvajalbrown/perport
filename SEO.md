# SEO and Google Indexing: findings and recommendations

Research date: 2026-07-13. Scope: `fcarvajalbrown.com` (Eleventy static build,
GitHub-fed portfolio, Spanish/English bilingual planned). Goal: faster load and
reliable Google indexing.

Each item below has a priority, the reasoning, sources, and the exact change
for **this** repo. Nothing here is deployed yet; this is for review. Deploy the
P0/P1 items first, then decide on the rest.

## Priority summary

| # | Item | Priority | Effort | Why it matters here |
|---|------|----------|--------|---------------------|
| 1 | Fix portfolio snapshot path (`/data.json`) | P0 | 1 line | Portfolio currently falls back to the slow live GitHub API on every visit; kills LCP and delays indexing |
| 2 | Static content in initial HTML (name/bio, noscript) | P0 | small | The portfolio's name/bio/repos are JS-injected; crawlers (esp. AI bots) see "Loading..." |
| 3 | Per-page meta description + Open Graph/Twitter | P1 | small | No meta description or social tags exist today; hurts SERP snippets and shares |
| 4 | Cross-domain canonical to primary domain | P1 | small | GitHub Pages backup serves identical content = duplicate-content dilution |
| 5 | `sitemap.xml` + `robots.txt` | P1 | small | Neither exists; needed for reliable discovery and Search Console |
| 6 | Person/ProfilePage JSON-LD structured data | P1 | small | E-E-A-T, author identity, Knowledge Panel eligibility |
| 7 | Optimize the logo image (140 KB -> small) | P2 | small | `logo.png` is 906x1000, ~140 KB, shown at 32 px, loaded on every page |
| 8 | Font loading polish (`display=swap`, preload) | P2 | tiny | Reduce render-blocking; `display=swap` already present, verify/extend |
| 9 | Google Search Console: submit + request indexing | P1 | manual | Fastest path to getting indexed; your action in the GSC UI |
| 10 | `lang` per language once bilingual ships | P2 | small | Set `lang="es"`/`lang="en"` correctly with the language selector |

---

## P0 — Critical

### 1. Portfolio snapshot path is broken (the slow-load cause)

**Problem.** `script.js` (`loadSnapshot()`, line ~452) fetches the snapshot with
a **relative** path: `fetch('data.json?t=...')`. When the page lived at `/`
that resolved to `/data.json`. Now the page is `/portfolio/`, so it requests
`/portfolio/data.json`, which is a **404**. The code then falls back to the live
GitHub API (`fetchProfile` + paginated `loadMoreRepos`), which is why the page
sits on "Loading... / Fetching profile..." for seconds. Verified live:
`/portfolio/data.json` -> 404, `/data.json` -> 200.

**Impact.** Slow Largest Contentful Paint, extra network round-trips, dependence
on the shared-IP unauthenticated GitHub rate limit, and a worse first
impression for Googlebot's render pass.

**Fix (1 char).** In `src/script.js`, make the snapshot path absolute:

```js
// before
const res = await fetchWithTimeout(`data.json?t=${Date.now()}`, { cache: 'no-store' });
// after
const res = await fetchWithTimeout(`/data.json?t=${Date.now()}`, { cache: 'no-store' });
```

`/data.json` is correct for the Hostinger primary (site at domain root). On the
GitHub Pages backup the snapshot is absent anyway (it is gitignored), so that
path keeps falling back to the live API exactly as it does today. Rebuild so the
hashed `script.js?v=...` updates, then deploy.

### 2. Put real content in the initial HTML

**Why.** Google renders JavaScript in a second, deferred pass (minutes to days),
and most AI crawlers (ClaudeBot, GPTBot, PerplexityBot) do **not** execute JS at
all. Today the portfolio's `<h1>` says "Loading...", the bio says "Fetching
profile...", and the repo grid is empty until JS runs. To a non-rendering
crawler the page looks empty.
Sources: [Google JS SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics),
[Vercel: how Google handles JS](https://vercel.com/blog/how-google-handles-javascript-throughout-the-indexing-process),
[SPA SEO / AI crawlers](https://dreasays.substack.com/p/the-lovable-seo-problem).

**Fixes for this site (low effort, no architecture change):**
- Default the `<h1>` to `Felipe Carvajal Brown` (JS still overwrites it with the
  live name). Never ship "Loading..." as the indexed H1.
- The Home page already has strong static text (good). Keep the primary
  identity/keywords there, since Home is the most indexable page.
- Optionally add a `<noscript>` block on the portfolio page with a one-line
  static description and a link to the GitHub profile, so no-JS crawlers get
  something meaningful.
- Bigger, optional: have `refresh.php`/Eleventy also emit a static list of repo
  names into the HTML at build/refresh time (prerender). Larger change; only if
  we want the repo list itself indexed. Recommend deferring.

---

## P1 — High value, low effort

### 3. Meta description + Open Graph + Twitter cards

No page has a `<meta name="description">`, and there are no social-share tags.
Add per-page values via front matter, rendered in `layout.njk`. Meta
descriptions should be unique per page and ~150-160 chars.
Sources: [Meta tags cheat sheet 2026](https://validatehtml.com/blog/meta-tags-seo-cheat-sheet),
[Open Graph protocol](https://ogp.me/).

Plan: add `description` (and optional `ogImage`) to each page's front matter;
in the layout `<head>` output:

```html
<meta name="description" content="{{ description }}">
<meta property="og:title" content="{{ title }} · Felipe Carvajal Brown">
<meta property="og:description" content="{{ description }}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://fcarvajalbrown.com{{ page.url }}">
<meta property="og:image" content="https://fcarvajalbrown.com/og-image.png">
<meta name="twitter:card" content="summary_large_image">
```

Needs one 1200x630 `og:image` (can be produced later; not blocking the text tags).

### 4. Cross-domain canonical (duplicate content)

The GitHub Pages backup at `fcarvajalbrown.github.io/perport/` serves the same
pages as `fcarvajalbrown.com`. Google will not penalize this, but it can dilute
ranking signals across two URLs. Fix by self-referencing a canonical to the
primary domain on every page, so Pages defers to Hostinger.
Sources: [Google: consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
[Google: cross-domain duplication](https://developers.google.com/search/blog/2009/12/handling-legitimate-cross-domain).

In `layout.njk` `<head>`:

```html
<link rel="canonical" href="https://fcarvajalbrown.com{{ page.url }}">
```

(Absolute, always the primary domain, even in the Pages build.)

### 5. `sitemap.xml` and `robots.txt`

Neither exists. Both are cheap and expected. Put the sitemap URL inside
`robots.txt` and also submit it in Search Console.
Sources: [Google: build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap),
[Sitemap + robots best practices](https://searchengineland.com/guide/sitemap).

- `src/robots.txt` (passthrough-copied):
  ```
  User-agent: *
  Allow: /
  Sitemap: https://fcarvajalbrown.com/sitemap.xml
  ```
- `src/sitemap.njk` generating an XML sitemap of the four pages (Eleventy can
  loop `collections.all`, filtering to HTML pages). Every URL must be a 200,
  canonical, non-noindex page.

### 6. Person / ProfilePage JSON-LD

Add structured data so Google can attribute the site to you (E-E-A-T,
author identity, Knowledge Panel eligibility). Use only real, on-record facts.
Sources: [Person schema JSON-LD](https://jsonld.com/person/),
[JSON-LD for personal sites](https://hawksley.dev/blog/json-ld-explained-for-personal-websites/).

On the Home page (or in the layout head), one JSON-LD block:

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

(Add LinkedIn/other `sameAs` URLs if you want them included. I will not invent
profile URLs.)

### 9. Google Search Console (your manual step)

Fastest route to being indexed: add `fcarvajalbrown.com` as a property, verify
it, submit `sitemap.xml`, and use "Request indexing" for each page.
Source: [Submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
This is a UI task on your side; I can prep the sitemap and verification file.

---

## P2 — Worth doing, not urgent

### 7. Optimize the logo image

`src/logo.png` is 906x1000 and ~140 KB but renders at 32 px in the nav and as a
favicon. That is a large download on every page for a tiny display. Generate a
small nav version (e.g. 64x64) and proper favicon sizes; consider WebP with PNG
fallback. Keeps LCP/CLS clean and saves bandwidth.
Sources: [Optimize images 2026](https://requestmetrics.com/web-performance/high-performance-images/),
[Favicon sizes/formats](https://favicon.im/blog/favicon-formats-sizes-best-practices).

### 8. Font loading

The Google Fonts (Inter) link already uses `&display=swap` (good, avoids
invisible-text FOIT) and `preconnect` is present. Optional: `preload` only the
single weight used above the fold, and back it with a system fallback. Low
impact; do it only if Lighthouse flags render-blocking.
Sources: [font-display: swap + CWV](https://andrewbaker.ninja/2026/02/26/fix-foit-with-font-display-swap-to-boost-core-web-vitals/),
[web.dev font best practices](https://web.dev/articles/font-best-practices).

### 10. Correct `lang` per language

`layout.njk` is hard-coded `lang="en"`. Once the Spanish/English selector ships,
set `lang="es"` on Spanish pages and `lang="en"` on English pages, and add
`hreflang` alternates between the two language versions. Fold this into the
language-selector work rather than doing it separately.
Source: [Google JS SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

---

## Core Web Vitals targets (how we will judge "fast")

All measured at the 75th percentile (Chrome UX Report):
- **LCP** < 2.5 s (item 1 is the main lever here)
- **CLS** < 0.1 (the logo `width`/`height` fix already deployed helps this)
- **INP** < 200 ms

Sources: [Google: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals),
[Core Web Vitals 2026 thresholds](https://www.corewebvitals.io/core-web-vitals).

## Suggested deploy order

1. Item 1 (snapshot path) — immediate, fixes the slow load. Deploy on its own so
   we can confirm the portfolio goes instant.
2. Items 2-6 together (initial-HTML content, meta/OG, canonical, sitemap/robots,
   JSON-LD) — one coherent "SEO tags" pass.
3. Item 9 (Search Console) — after the sitemap is live.
4. Items 7, 8, 10 — polish, and 10 rides along with the language selector.

## Full source list

- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://vercel.com/blog/how-google-handles-javascript-throughout-the-indexing-process
- https://dreasays.substack.com/p/the-lovable-seo-problem
- https://developers.google.com/search/docs/appearance/core-web-vitals
- https://www.corewebvitals.io/core-web-vitals
- https://validatehtml.com/blog/meta-tags-seo-cheat-sheet
- https://ogp.me/
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/blog/2009/12/handling-legitimate-cross-domain
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://searchengineland.com/guide/sitemap
- https://jsonld.com/person/
- https://hawksley.dev/blog/json-ld-explained-for-personal-websites/
- https://requestmetrics.com/web-performance/high-performance-images/
- https://favicon.im/blog/favicon-formats-sizes-best-practices
- https://andrewbaker.ninja/2026/02/26/fix-foit-with-font-display-swap-to-boost-core-web-vitals/
- https://web.dev/articles/font-best-practices
