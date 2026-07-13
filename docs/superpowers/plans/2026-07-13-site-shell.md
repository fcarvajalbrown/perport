# Site Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-page portfolio into a four-page Eleventy-built static site (Home / Writing / Portfolio / Works) with a shared dark shell, moving today's GitHub grid verbatim into `/portfolio/` and adding new/stub pages for the rest.

**Architecture:** Eleventy compiles `src/` (Nunjucks layout + Markdown/HTML pages + passthrough-copied static assets) into `_site/`, which is committed to git and served as-is. A shared `layout.njk` supplies the `<head>`, top nav, and footer to every page. `refresh.php`, its cron, and `data.json` are unchanged — the file just lives at `_site/refresh.php` now (still writing `data.json` next to itself). Build runs locally only; the deployed artifact stays plain static files.

**Tech Stack:** Eleventy (`@11ty/eleventy` v3, Nunjucks + Liquid), plain CSS (existing `styles.css` + additions), existing vanilla `script.js`, PHP CLI (`refresh.php`, untouched).

## Global Constraints

- **No emojis anywhere** — code, comments, docs, commit messages, output.
- **No AI attribution anywhere** — no `Co-Authored-By`, no "Generated with" lines, no crediting an AI in commits/docs/code.
- **Never open a pull request** — commit and push directly to `master`.
- **No per-file pause** — this plan is the approval; work task-by-task, committing each completed task.
- **Nav order is exactly:** Home / Writing / Portfolio / Works. Do not reorder.
- **`_site/` is committed, NOT gitignored** — it is the deploy artifact (no server-side build step).
- **`node_modules/`, `data.json`, `data.json.tmp`, `gh_config.php`, `.env` stay gitignored.**
- **Home & Writing visual language:** dark shell, serif-italic headlines, warm accent `#d9a55c`.
- **Portfolio visual language:** unchanged — Inter sans-serif, amber `#f59e0b`, existing card grid + modal.
- **`GITHUB_USER` = `fcarvajalbrown`** in both `script.js` and `refresh.php` — keep in sync, do not change.
- **No automated test suite exists (by design).** Every "test" step below is a concrete build/serve/grep verification with expected output — treat those as the test cycle.

---

## File Structure (target)

```
package.json                 npm scripts + @11ty/eleventy devDependency
.eleventy.js                 input "src", output "_site", passthrough copies + layout alias
.gitignore                   adds node_modules/ ; _site/ stays TRACKED
src/
  _includes/
    layout.njk               shared <head>, top nav, footer; {{ content }} slot
  index.md                   Home/About (new editorial content)
  writing/index.md           Writing archive (stub)
  works/index.md             Works (stub)
  portfolio/index.html       today's hero + repo grid + modal, wrapped in layout
  styles.css                 moved from repo root (global stylesheet + new nav/editorial rules)
  script.js                  moved from repo root, unchanged
  refresh.php                moved from repo root, unchanged
  gh_config.sample.php       moved from repo root, unchanged
_site/                       BUILD OUTPUT — committed. public_html symlinks here on the server.
```

`refresh.php` still writes `data.json` next to itself via its `__DIR__`-relative path — after passthrough copy that resolves to `_site/data.json`. `gh_config.php` (untracked) must be placed next to `_site/refresh.php` on the server, same as today.

---

## Task 1: Scaffold Eleventy build

**Files:**
- Create: `package.json`
- Create: `.eleventy.js`
- Create: `src/index.md` (temporary one-line placeholder, replaced in Task 5)
- Modify: `.gitignore`

**Interfaces:**
- Produces: an `npx @11ty/eleventy` build that reads `src/` and writes `_site/`. Later tasks add pages/assets under `src/` and rely on this config's passthrough copies and `layout` layout alias.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "perport",
  "version": "1.0.0",
  "private": true,
  "description": "Personal site for fcarvajalbrown, built with Eleventy",
  "scripts": {
    "build": "eleventy",
    "serve": "eleventy --serve"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `.eleventy.js`**

```js
module.exports = function (eleventyConfig) {
  // Static assets copied verbatim into _site/ (no template processing).
  eleventyConfig.addPassthroughCopy({ "src/styles.css": "styles.css" });
  eleventyConfig.addPassthroughCopy({ "src/script.js": "script.js" });
  eleventyConfig.addPassthroughCopy({ "src/refresh.php": "refresh.php" });
  eleventyConfig.addPassthroughCopy({ "src/gh_config.sample.php": "gh_config.sample.php" });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    // Markdown and HTML pages may use Nunjucks/Liquid features (layouts, etc.).
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "liquid",
    templateFormats: ["md", "njk", "html", "liquid"],
  };
};
```

- [ ] **Step 3: Create a temporary `src/index.md` so the build has input**

```markdown
---
title: Home
---

Placeholder home page. Replaced in Task 5.
```

- [ ] **Step 4: Add `node_modules/` to `.gitignore` (leave `_site/` tracked)**

Append this line to `.gitignore` (do NOT add `_site/`):

```
node_modules/
```

- [ ] **Step 5: Install Eleventy**

Run: `npm install`
Expected: creates `node_modules/` and `package-lock.json`, exit code 0, `@11ty/eleventy` resolved to a 3.x version.

- [ ] **Step 6: Build and verify output exists**

Run: `npx @11ty/eleventy`
Expected: console reports at least 1 file written; `_site/index.html` exists and contains the text "Placeholder home page".

Verify: `ls _site/index.html` succeeds.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .eleventy.js .gitignore src/index.md _site/
git commit -m "build: scaffold Eleventy static site generator"
```

---

## Task 2: Shared layout (head, nav, footer)

**Files:**
- Create: `src/_includes/layout.njk`

**Interfaces:**
- Consumes: each page sets `layout: layout.njk` and a `title` in its front matter; page body renders into `{{ content }}`.
- Produces: every page gets `<head>` (charset, viewport, `<title>`, `styles.css` link), a top nav with the four links, and a footer. The nav marks the current page via `page.url` matching. Body carries a `data-page` attribute equal to the page's front-matter `bodyClass` (used by Task 5 to scope editorial styles).

- [ ] **Step 1: Create `src/_includes/layout.njk`**

```njk
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }} — Felipe Carvajal Brown</title>
    <link rel="stylesheet" href="/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="{{ bodyClass }}">
    <nav class="site-nav">
        <div class="site-nav-inner">
            <a class="site-nav-brand" href="/">FCB</a>
            <button class="site-nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
                <span></span><span></span><span></span>
            </button>
            <ul class="site-nav-links">
                <li><a href="/"{% if page.url == "/" %} class="active" aria-current="page"{% endif %}>Home</a></li>
                <li><a href="/writing/"{% if "/writing/" in page.url %} class="active" aria-current="page"{% endif %}>Writing</a></li>
                <li><a href="/portfolio/"{% if "/portfolio/" in page.url %} class="active" aria-current="page"{% endif %}>Portfolio</a></li>
                <li><a href="/works/"{% if "/works/" in page.url %} class="active" aria-current="page"{% endif %}>Works</a></li>
            </ul>
        </div>
    </nav>

    {{ content }}

    <footer class="site-footer">
        <p>Felipe Carvajal Brown &middot; Santiago, Chile</p>
    </footer>
</body>
</html>
```

- [ ] **Step 2: Point the placeholder home page at the layout**

Replace `src/index.md` front matter so it uses the layout:

```markdown
---
layout: layout.njk
title: Home
bodyClass: page-editorial
---

Placeholder home page. Replaced in Task 5.
```

- [ ] **Step 3: Build and verify the layout renders**

Run: `npx @11ty/eleventy`
Expected: exit code 0.

Verify `_site/index.html` now contains: `<nav class="site-nav">`, all four link hrefs (`/`, `/writing/`, `/portfolio/`, `/works/`), and `<footer class="site-footer">`. The Home link carries `class="active"`.

- [ ] **Step 4: Commit**

```bash
git add src/_includes/layout.njk src/index.md _site/
git commit -m "feat: shared layout with top nav and footer"
```

---

## Task 3: Move static assets into `src/`

**Files:**
- Move: `styles.css` -> `src/styles.css`
- Move: `script.js` -> `src/script.js`
- Move: `refresh.php` -> `src/refresh.php`
- Move: `gh_config.sample.php` -> `src/gh_config.sample.php`

**Interfaces:**
- Consumes: the passthrough-copy config from Task 1 (already references these `src/` paths).
- Produces: `_site/styles.css`, `_site/script.js`, `_site/refresh.php`, `_site/gh_config.sample.php` after build. The layout's `/styles.css` link and the portfolio page's `/script.js` reference (Task 4) resolve against these.

- [ ] **Step 1: Move the four files into `src/` (preserve git history)**

```bash
git mv styles.css src/styles.css
git mv script.js src/script.js
git mv refresh.php src/refresh.php
git mv gh_config.sample.php src/gh_config.sample.php
```

- [ ] **Step 2: Build and verify assets are copied to `_site/`**

Run: `npx @11ty/eleventy`
Expected: exit code 0; console reports copied files.

Verify all four exist: `ls _site/styles.css _site/script.js _site/refresh.php _site/gh_config.sample.php` succeeds.

- [ ] **Step 3: Verify `refresh.php`'s CLI guard and `__DIR__` write path are intact**

Verify `_site/refresh.php` still contains `php_sapi_name()` (CLI-only guard) and writes `data.json` via a `__DIR__`-relative path — i.e. the moved copy is byte-identical to the original. `git mv` guarantees this; confirm with `git status` showing renames, not modifications.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move static assets and refresh.php into src/"
```

---

## Task 4: Portfolio page (today's grid, moved verbatim)

**Files:**
- Create: `src/portfolio/index.html`
- Delete: `index.html` (repo root — its content moves here)

**Interfaces:**
- Consumes: `layout.njk` (Task 2), `/styles.css` and `/script.js` (Task 3).
- Produces: `_site/portfolio/index.html` — the full hero + repo grid + modal, behaving exactly as today's homepage. `script.js`'s DOM targets (`#repos-grid`, `#name`, `#bio`, `#avatar-img`, stat spans, `#repo-modal`, `#sentinel`) all live on this page.

- [ ] **Step 1: Create `src/portfolio/index.html` with front matter + today's body**

Front matter selects the layout; the body is today's `index.html` content from `<div class="container">` through the modal and scripts (everything that was inside `<body>`), verbatim. Note: this body contains no `{{ }}` or `{% %}` sequences, so the Liquid HTML engine passes it through unchanged.

```html
---
layout: layout.njk
title: Portfolio
bodyClass: page-portfolio
---
<div class="container">
    <header class="hero">
        <div class="avatar">
            <img id="avatar-img" src="" alt="Profile picture" />
        </div>
        <h1 id="name">Loading...</h1>
        <p class="tagline">Professional in Numerical Simulations and Computer Science. Specialist in interdisciplinary relationships between technical and commercial departments. Knowledgeable in research projects and translation techniques. Proactive, rigorous, and meticulous; capable of performing diverse functions efficiently. Excellent communication skills with clients, colleagues, and superiors. Team-oriented with a high level of attention to detail.</p>
        <p id="bio" class="bio">Fetching profile...</p>
        <div class="stats" id="profile-stats">
            <div class="stat">
                <span class="stat-value" id="stat-repos">—</span>
                <span class="stat-label">Repos</span>
            </div>
            <div class="stat">
                <span class="stat-value" id="stat-followers">—</span>
                <span class="stat-label">Followers</span>
            </div>
            <div class="stat">
                <span class="stat-value" id="stat-following">—</span>
                <span class="stat-label">Following</span>
            </div>
        </div>
        <a href="https://github.com/fcarvajalbrown" target="_blank" rel="noopener" class="github-link">
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            github.com/fcarvajalbrown
        </a>
    </header>

    <main>
        <section class="repos-section">
            <div class="section-header">
                <h2>Latest Repositories</h2>
                <p class="section-desc">Auto-updated from GitHub &middot; Scroll to load more</p>
            </div>
            <div id="repos-grid" class="repos-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading repositories...</p>
                </div>
            </div>
            <div id="sentinel" class="sentinel"></div>
        </section>
    </main>
</div>

<!-- Modal -->
<div id="repo-modal" class="modal">
    <div class="modal-backdrop"></div>
    <div class="modal-content">
        <button class="modal-close" aria-label="Close">&times;</button>
        <div class="modal-body">
            <div class="modal-header">
                <h3 id="modal-title" class="modal-title"></h3>
                <span id="modal-visibility" class="repo-visibility"></span>
            </div>
            <p id="modal-desc" class="modal-desc"></p>
            <div id="modal-topics" class="topics"></div>
            <div class="modal-stats">
                <div class="modal-stat">
                    <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
                    <span id="modal-stars"></span>
                </div>
                <div class="modal-stat">
                    <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM10 3.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z"/></svg>
                    <span id="modal-forks"></span>
                </div>
                <div class="modal-stat">
                    <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zm.5 4.75a.75.75 0 00-1.5 0v3.5a.75.75 0 00.471.696l2.5 1a.75.75 0 00.557-1.392L8.5 7.742V4.75z"/></svg>
                    <span id="modal-updated"></span>
                </div>
                <div class="modal-stat">
                    <span id="modal-lang-dot" class="lang-dot"></span>
                    <span id="modal-lang"></span>
                </div>
            </div>
            <div class="modal-actions">
                <a id="modal-link" href="#" target="_blank" rel="noopener" class="btn-primary">
                    <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                    View on GitHub
                </a>
                <a id="modal-homepage" href="#" target="_blank" rel="noopener" class="btn-secondary hidden">
                    <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"/></svg>
                    Live Demo
                </a>
            </div>
            <div id="modal-readme" class="modal-readme hidden">
                <div class="readme-header">README</div>
                <div id="modal-readme-content" class="readme-content"></div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="/script.js"></script>
```

- [ ] **Step 2: Delete the old root `index.html`**

```bash
git rm index.html
```

- [ ] **Step 3: Build and verify the portfolio page**

Run: `npx @11ty/eleventy`
Expected: exit code 0.

Verify `_site/portfolio/index.html` exists and contains both the nav (`site-nav`) from the layout and the portfolio body (`id="repos-grid"`, `id="repo-modal"`, `src="/script.js"`).

- [ ] **Step 4: Serve and click-test the portfolio (live-API fallback)**

Run: `python -m http.server 8000 --directory _site`
Open `http://localhost:8000/portfolio/`.
Expected: hero fills in (name/bio/avatar/stats from GitHub live API since no `data.json` locally), repo cards load, clicking a card opens the modal and its README renders, scrolling loads more repos. Nav bar shows Portfolio active.

Stop the server after verifying (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: move GitHub portfolio to /portfolio/ under shared layout"
```

---

## Task 5: Home page and editorial theme

**Files:**
- Modify: `src/index.md` (replace placeholder with real Home/About content)
- Modify: `src/styles.css` (add nav, footer, and editorial-page styles)

**Interfaces:**
- Consumes: `layout.njk` (`bodyClass: page-editorial`).
- Produces: `_site/index.html` — the Home/About landing with serif-italic headline, `#d9a55c` accent, and links out to Writing / Portfolio / Works. Establishes the `.page-editorial` scoped styles and shared `.site-nav`/`.site-footer` styles that Tasks 6-8 reuse.

- [ ] **Step 1: Write the Home page content**

Replace `src/index.md` in full. Content uses only facts already on record (name, M.Sc. in Numerical Simulation in Engineering from UPM, independent researcher in Santiago, Chile, plus the existing tagline themes). Do NOT invent biographical facts, dates, or employer names.

```markdown
---
layout: layout.njk
title: Home
bodyClass: page-editorial
---
<header class="editorial-hero">
    <p class="editorial-eyebrow">Felipe Carvajal Brown</p>
    <h1 class="editorial-title">Engineer, <em>researcher</em>, and writer based in Santiago, Chile.</h1>
    <p class="editorial-lede">M.Sc. in Numerical Simulation in Engineering (Universidad Politécnica de Madrid). I work at the seam between technical and human problems — simulation, software, and the words that hold them together.</p>
</header>

<section class="editorial-cards">
    <a class="editorial-card" href="/writing/">
        <h2>Writing</h2>
        <p>Essays, columns, and notes.</p>
        <span class="editorial-card-go">Read &rarr;</span>
    </a>
    <a class="editorial-card" href="/portfolio/">
        <h2>Portfolio</h2>
        <p>Open-source code, pulled live from GitHub.</p>
        <span class="editorial-card-go">Browse &rarr;</span>
    </a>
    <a class="editorial-card" href="/works/">
        <h2>Works</h2>
        <p>Other things I have made.</p>
        <span class="editorial-card-go">Explore &rarr;</span>
    </a>
</section>
```

- [ ] **Step 2: Add nav, footer, and editorial styles to `src/styles.css`**

Append these blocks to the end of `src/styles.css`. They introduce the editorial accent `#d9a55c` and a serif stack; the existing `:root`/portfolio rules are untouched.

```css
/* ===== Site Nav (all pages) ===== */
.site-nav {
    border-bottom: 1px solid var(--border);
    background: rgba(11, 15, 25, 0.85);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 100;
}

.site-nav-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
}

.site-nav-brand {
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--text);
    text-decoration: none;
    font-size: 1rem;
}

.site-nav-links {
    display: flex;
    gap: 1.75rem;
    list-style: none;
}

.site-nav-links a {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.95rem;
    transition: color 0.2s ease;
}

.site-nav-links a:hover,
.site-nav-links a.active {
    color: var(--text);
}

.site-nav-toggle {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
}

.site-nav-toggle span {
    width: 22px;
    height: 2px;
    background: var(--text);
    transition: var(--transition);
}

/* ===== Site Footer (all pages) ===== */
.site-footer {
    max-width: 1100px;
    margin: 0 auto;
    padding: 3rem 1.5rem 2rem;
    text-align: center;
    color: var(--text-dim);
    font-size: 0.875rem;
}

/* ===== Editorial pages (Home, Writing, Works) ===== */
.page-editorial {
    --accent: #d9a55c;
    --accent-hover: #e8bd7f;
}

.page-editorial .editorial-hero,
.page-editorial .editorial-body {
    max-width: 760px;
    margin: 0 auto;
    padding: 4rem 1.5rem 0;
}

.editorial-eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.8rem;
    color: var(--accent);
    margin-bottom: 1.5rem;
}

.editorial-title {
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 400;
    font-size: 2.75rem;
    line-height: 1.2;
    letter-spacing: -0.01em;
    margin-bottom: 1.5rem;
}

.editorial-title em {
    font-style: italic;
    color: var(--accent);
}

.editorial-lede {
    font-size: 1.2rem;
    color: var(--text-muted);
    line-height: 1.7;
}

.editorial-cards {
    max-width: 760px;
    margin: 3.5rem auto 0;
    padding: 0 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
}

.editorial-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    text-decoration: none;
    color: var(--text);
    transition: var(--transition);
}

.editorial-card:hover {
    border-color: var(--accent);
    background: var(--card-hover);
}

.editorial-card h2 {
    font-family: Georgia, 'Times New Roman', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 1.4rem;
}

.editorial-card p {
    color: var(--text-muted);
    font-size: 0.95rem;
    flex-grow: 1;
}

.editorial-card-go {
    color: var(--accent);
    font-size: 0.9rem;
    font-weight: 500;
}
```

- [ ] **Step 3: Build and verify the Home page**

Run: `npx @11ty/eleventy`
Expected: exit code 0.

Verify `_site/index.html` contains `class="editorial-title"`, the three card links (`/writing/`, `/portfolio/`, `/works/`), and `body class="page-editorial"`.

- [ ] **Step 4: Serve and eyeball Home**

Run: `python -m http.server 8000 --directory _site`
Open `http://localhost:8000/`.
Expected: serif italic headline, terracotta/gold accent on eyebrow + emphasized word + card CTAs, three cards linking onward, sticky dark nav, footer. Stop server after.

- [ ] **Step 5: Commit**

```bash
git add src/index.md src/styles.css _site/
git commit -m "feat: Home/About landing page with editorial theme"
```

---

## Task 6: Writing archive stub

**Files:**
- Create: `src/writing/index.md`

**Interfaces:**
- Consumes: `layout.njk` (`bodyClass: page-editorial`) and the editorial styles from Task 5.
- Produces: `_site/writing/index.html`. Content model (post list, per-post pages) is a separate spec — this is a labeled placeholder only.

- [ ] **Step 1: Create `src/writing/index.md`**

```markdown
---
layout: layout.njk
title: Writing
bodyClass: page-editorial
---
<div class="editorial-body">
    <p class="editorial-eyebrow">Writing</p>
    <h1 class="editorial-title">Essays, columns, and <em>notes</em>.</h1>
    <p class="editorial-lede">This archive is being built. Published pieces will appear here soon.</p>
</div>
```

- [ ] **Step 2: Build and verify**

Run: `npx @11ty/eleventy`
Expected: exit code 0; `_site/writing/index.html` exists, contains `editorial-title` and the Writing nav link marked `active`.

- [ ] **Step 3: Commit**

```bash
git add src/writing/index.md _site/
git commit -m "feat: Writing archive stub page"
```

---

## Task 7: Works stub

**Files:**
- Create: `src/works/index.md`

**Interfaces:**
- Consumes: `layout.njk` (`bodyClass: page-editorial`) and Task 5 editorial styles.
- Produces: `_site/works/index.html`. Full content design is a separate spec — placeholder only.

- [ ] **Step 1: Create `src/works/index.md`**

```markdown
---
layout: layout.njk
title: Works
bodyClass: page-editorial
---
<div class="editorial-body">
    <p class="editorial-eyebrow">Works</p>
    <h1 class="editorial-title">Other things I have <em>made</em>.</h1>
    <p class="editorial-lede">A space for creative work beyond code. Coming soon.</p>
</div>
```

- [ ] **Step 2: Build and verify**

Run: `npx @11ty/eleventy`
Expected: exit code 0; `_site/works/index.html` exists, contains `editorial-title` and the Works nav link marked `active`.

- [ ] **Step 3: Commit**

```bash
git add src/works/index.md _site/
git commit -m "feat: Works stub page"
```

---

## Task 8: Responsive nav (mobile)

**Files:**
- Modify: `src/styles.css` (mobile nav rules)
- Modify: `src/_includes/layout.njk` (inline toggle script)

**Interfaces:**
- Consumes: the `.site-nav-toggle` button and `.site-nav-links` list already in the layout (Task 2).
- Produces: at <=640px the links collapse behind the hamburger toggle; tapping it toggles an `.open` class and the `aria-expanded` state.

- [ ] **Step 1: Add mobile nav CSS to `src/styles.css`**

Append to the end of `src/styles.css`:

```css
/* ===== Responsive nav ===== */
@media (max-width: 640px) {
    .site-nav-toggle {
        display: flex;
    }

    .site-nav-links {
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        flex-direction: column;
        gap: 0;
        background: var(--bg-elevated);
        border-bottom: 1px solid var(--border);
        padding: 0.5rem 1.5rem 1rem;
        display: none;
    }

    .site-nav-links.open {
        display: flex;
    }

    .site-nav-links li {
        padding: 0.6rem 0;
    }

    .editorial-title {
        font-size: 2rem;
    }
}
```

- [ ] **Step 2: Add the toggle script to `src/_includes/layout.njk`**

Insert this `<script>` immediately before the closing `</body>` tag in `layout.njk` (after the footer):

```html
    <script>
        (function () {
            var toggle = document.querySelector('.site-nav-toggle');
            var links = document.querySelector('.site-nav-links');
            if (!toggle || !links) return;
            toggle.addEventListener('click', function () {
                var open = links.classList.toggle('open');
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        })();
    </script>
```

- [ ] **Step 3: Build and verify**

Run: `npx @11ty/eleventy`
Expected: exit code 0. Verify `_site/index.html` contains the toggle script and `_site/styles.css` contains `.site-nav-links.open`.

- [ ] **Step 4: Serve and test at mobile width**

Run: `python -m http.server 8000 --directory _site`
Open `http://localhost:8000/`, narrow the browser to <=640px (or device toolbar).
Expected: links hide behind the hamburger; tapping it opens/closes the menu; nav still works on the portfolio page. Stop server after.

- [ ] **Step 5: Commit**

```bash
git add src/styles.css src/_includes/layout.njk _site/
git commit -m "feat: responsive mobile nav toggle"
```

---

## Task 9: Full-site verification and docs update

**Files:**
- Modify: `CLAUDE.md` (document the new build step and layout)
- Modify: `AGENTS.md` if it duplicates the "no build step" claim (verify first)
- Modify: `PROMPT.md` (mark shell done, point at next specs) — note this file is gitignored, edit locally only

**Interfaces:**
- Consumes: the finished `_site/` from Tasks 1-8.
- Produces: an accurate repo doc set and a clean final build.

- [ ] **Step 1: Clean rebuild from scratch**

```bash
rm -rf _site
npx @11ty/eleventy
```
Expected: exit code 0; `_site/` regenerated with `index.html`, `portfolio/index.html`, `writing/index.html`, `works/index.html`, `styles.css`, `script.js`, `refresh.php`, `gh_config.sample.php`.

- [ ] **Step 2: Serve and click through all four pages + portfolio modal**

Run: `python -m http.server 8000 --directory _site`
Verify each nav destination loads, active states are correct, the portfolio grid + modal + infinite scroll still work, and mobile nav toggles. Stop server after.

- [ ] **Step 3: Verify `refresh.php` still runs from inside `_site/`**

Run: `C:\Users\Beetlejuice\dev-tools\php\php.exe _site/refresh.php`
Expected: exit code 0; `_site/data.json` written with the expected shape (profile + repos, forks and `perport` excluded). `data.json` is gitignored — confirm `git status` does not show it as a new tracked file.

- [ ] **Step 4: Update `CLAUDE.md`**

Update the "What this is" and "Running it locally" sections to reflect: the site is now Eleventy-built (`npm run build` / `npx @11ty/eleventy`), source lives in `src/`, the deploy artifact is the committed `_site/`, and there are four pages. Remove the "no build step" wording where it is now inaccurate; keep "no test suite". Preserve every `refresh.php` invariant note unchanged.

- [ ] **Step 5: Update `AGENTS.md` / `PROMPT.md`**

Verify whether `AGENTS.md` claims "no build step"; if so, correct it. Update local-only `PROMPT.md` to record that the shell is built and the remaining work is the Writing content-model spec, then the Works spec (each needs its own brainstorming session first).

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md AGENTS.md _site/
git commit -m "docs: document Eleventy build and four-page structure"
```

---

## Task 10: Hostinger deploy reconfiguration (live infra change)

**Files:** none in-repo — this reconfigures the live server via SSH.

**Interfaces:**
- Consumes: SSH connection details from the gitignored `.env` (host, port, user, password). If `.env` is missing, STOP and ask the user before touching the server.
- Produces: `public_html` as a symlink to `repo/_site`, so `git pull` on the server updates the served site with no extra step; the hourly cron runs `repo/_site/refresh.php`.

**IMPORTANT:** This is an irreversible-feeling live change. Do it carefully, verify at each step, and keep a rollback path (a backup of the current `public_html`). Confirm with the user before starting this task even though the plan is approved — it touches production hosting, not the repo.

- [ ] **Step 1: Push the built site to GitHub first**

```bash
git push origin master
```
Expected: `master` on GitHub now contains `src/`, `_site/`, and the Eleventy config.

- [ ] **Step 2: SSH in and inspect current layout**

Using the `.env` host/port/user, connect and inspect `~/domains/fcarvajalbrown.com/`. Confirm whether `public_html` is currently a real directory containing a clone (today's state) and note the current remote/branch.

- [ ] **Step 3: Back up the current `public_html`**

On the server: rename the existing `public_html` to `public_html.bak` (preserves a working rollback). Do NOT delete anything yet.

- [ ] **Step 4: Clone the repo into a sibling directory**

On the server: `git clone https://github.com/fcarvajalbrown/perport.git ~/domains/fcarvajalbrown.com/repo` (or `git pull` if it already exists). Confirm `repo/_site/` is present after clone.

- [ ] **Step 5: Recreate `gh_config.php` and preserve `data.json` next to `repo/_site/refresh.php`**

If the old `public_html.bak` had a `gh_config.php` and/or a fresh `data.json`, copy them into `repo/_site/` so the cron and site keep their token/snapshot. (`gh_config.php` is untracked; without it `refresh.php` runs unauthenticated, which is acceptable per project notes.)

- [ ] **Step 6: Point `public_html` at the build output via symlink**

On the server: create `public_html` as a symlink to `repo/_site`:
`ln -s ~/domains/fcarvajalbrown.com/repo/_site ~/domains/fcarvajalbrown.com/public_html`
Confirm the symlink resolves (`ls -la` shows `public_html -> .../repo/_site`).

- [ ] **Step 7: Update the hPanel cron command**

Point the hourly cron at the new path: `php ~/domains/fcarvajalbrown.com/repo/_site/refresh.php`. Verify the cron entry saved.

- [ ] **Step 8: Verify the live site**

Load `https://fcarvajalbrown.com/` and each of `/writing/`, `/portfolio/`, `/works/`. Confirm the four pages render, portfolio data loads (from `data.json` once the cron has run, else live API), and nothing 404s. If broken, restore `public_html.bak` (swap the symlink back for the backup dir) and diagnose before retrying.

- [ ] **Step 9: Record the deploy in docs**

Update `docs/hostinger-setup.md` and the "Deploying to Hostinger" section of `CLAUDE.md` to describe the new sibling-clone + symlink layout and the new cron path.

```bash
git add docs/hostinger-setup.md CLAUDE.md
git commit -m "docs: update Hostinger deploy for sibling-clone + _site symlink"
git push origin master
```

- [ ] **Step 10: Remove the server backup once stable**

After confirming the live site is healthy (give it at least one cron cycle so `data.json` regenerates), delete `public_html.bak` on the server to reclaim space.

---

## Self-Review notes

- **Spec coverage:** Eleventy add (Task 1) ✓; four pages in nav order (Tasks 2,4,5,6,7) ✓; visual direction — dark shell + editorial serif/`#d9a55c` for Home/Writing/Works, portfolio unchanged (Tasks 2,4,5) ✓; build-local-only (no server build introduced) ✓; committed `_site/` (`.gitignore` leaves it tracked, every task commits it) ✓; deploy resolution — sibling clone + symlink (Task 10) ✓; repo layout matches spec's `src/` tree (Task 3 file moves) ✓; `refresh.php`/cron/`data.json` untouched and verified (Tasks 3,9,10) ✓; responsive nav (Task 8) ✓; error handling — build fails locally before commit, broken-symlink 404s, refresh fail-safe intact (covered in verification steps) ✓.
- **Out of scope, correctly deferred:** Writing content model, Works content, dark/light toggle — only stubs here.
- **Type/name consistency:** `bodyClass` front-matter key, `.page-editorial`/`.page-portfolio` classes, `.site-nav`/`.site-nav-links`/`.site-nav-toggle`, `.editorial-*` classes, and passthrough targets (`/styles.css`, `/script.js`) are used consistently across layout, pages, and CSS.
</content>
</invoke>
