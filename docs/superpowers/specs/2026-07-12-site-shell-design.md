# Design: site shell / information architecture / visual direction

Date: 2026-07-12
Status: Approved (pending written-spec review)

## Problem

The site is currently a single page: a hero (avatar, bio, stats) plus one
section, the GitHub repo grid. The user wants to grow it into a personal site
built around three destinations — a writing archive, a "works" page linking to
other creative output (art, books, etc.), and a genuine personal/human
"landing page" identity ("portfolio + THIS IS ME"), not just a GitHub-data
dashboard.

This is three separable pieces of work. This spec covers **only the first**:
the site shell — page structure, navigation, visual direction, and the
tooling change needed to support multiple pages and a blog without
duplicating markup by hand. The writing archive's content model and the works
page's content each get their own spec afterward, built inside the shell this
spec defines.

## Decisions (as agreed during brainstorming)

- **Add Eleventy (11ty) as a minimal static site generator.** The project is
  currently zero-build-step (plain HTML/CSS/JS, deployed as-is). That stops
  scaling once there's a shared nav/header/footer across four pages and a
  blog whose posts are far more naturally authored as Markdown than hand-written
  HTML. Eleventy compiles templates + Markdown into plain static HTML at build
  time — the *deployed* artifact is still just static files, so hosting story
  is unchanged in kind, only in how the files are produced.
- **Four top-level pages**, each its own URL:
  - `/` — Home/About ("this is me": personal intro, links out to the other
    three sections). Replaces today's hero-plus-repo-grid homepage.
  - `/writing/` — archive listing (design deferred to its own spec) plus
    `/writing/<slug>/` per-post pages.
  - `/portfolio/` — today's GitHub repo grid and modal, moved here verbatim.
    `refresh.php`, the hPanel cron, and `data.json` are unaffected by this
    move — same file, same behavior, new location in the nav.
  - `/works/` — stub page for now; full content design deferred to its own spec.
- **Visual direction:** dark shell throughout (continuity with the existing
  GitHub-portfolio identity). Home and Writing use serif italic headline
  typography with a warm terracotta/gold accent (`#d9a55c`) instead of pure
  amber, giving the personal/editorial pages a distinct but related feel.
  Portfolio keeps today's Inter sans-serif + amber (`#f59e0b`) card-grid style
  unchanged, since that content is code-oriented, not editorial. Nav is a
  horizontal top bar (Home / Writing / Portfolio / Works), confirmed via
  mockup during brainstorming.
- **Build runs locally, never on the server.** Confirmed earlier in this
  project: Hostinger Business shared hosting has no reliable general-purpose
  Node CLI runtime (Node there is a managed app-deploy feature, not something
  cron or SSH sessions can casually invoke for arbitrary builds). PHP CLI
  stays exclusively `refresh.php`'s job; it is unaffected by this change.
- **Committed build output**, not the typical gitignored-`_site` convention.
  Because there is no server-side build step and no CI in this project,
  the compiled output must be committed so the existing `git pull`-based
  deploy (see below) has something to serve without a build step on the
  Hostinger end.
- **Deployment resolution:** the repo is currently cloned directly into
  `public_html` (done manually over SSH; hPanel's Git-deploy UI feature was
  never connected — see `docs/hostinger-setup.md`). Once there's a `src/`
  directory (11ty input: templates, Markdown, config) alongside compiled
  output, cloning the whole repo into `public_html` would expose the raw
  source next to the served site. Resolution: keep the proven SSH-based
  `git clone`/`git pull` workflow, but clone into a sibling directory (e.g.
  `~/domains/fcarvajalbrown.com/repo`) instead of `public_html` directly, and
  make `public_html` a symlink pointing at the repo's build-output directory
  (`repo/_site`). `git pull` on the server then updates `_site` in place, and
  `public_html` (the symlink) serves the fresh output with no extra step.

## Repo layout (new)

```
src/                        11ty input
  _includes/
    layout.njk               shared <head>, nav, footer
  index.md                   Home/About
  writing/
    index.md                 archive listing (stub content for now)
  portfolio/
    index.html                today's index.html content, adapted into the layout
  works/
    index.md                  stub page (full design: separate spec)
  styles.css                 moved here, passthrough-copied as-is
  script.js                  moved here, passthrough-copied as-is
  refresh.php                moved here, passthrough-copied as-is (CLI-only guard unchanged)
  gh_config.sample.php       moved here, passthrough-copied as-is
.eleventy.js                 11ty config: input "src", output "_site", passthrough copies for
                             styles.css, script.js, refresh.php, gh_config.sample.php
_site/                       BUILD OUTPUT — committed (see "Committed build output" above).
                             This is what public_html symlinks to on the server.
```

`data.json` and `gh_config.php` stay gitignored exactly as today — `refresh.php`
still writes `data.json` next to itself (now inside `_site/`, via its existing
`__DIR__`-relative path, unchanged code).

`styles.css` is a global stylesheet, linked from every page (theme variables,
nav, shared layout). `script.js` is `<script>`-included only on `/portfolio/`
— its DOM targets (`repos-grid`, the repo modal) don't exist on the other
three pages — but is still passthrough-copied to `_site/` root so the
existing relative `<script src="script.js">` reference works unchanged.

## Data flow (after change)

```
Author edits src/ (templates, Markdown, styles/script/refresh.php)
        |
        v
   npx @11ty/eleventy   (local build; also copies static assets)
        |
        v
   _site/  (compiled static HTML + copied assets, COMMITTED to git)
        |
        v
   git push origin master
        |
        v
   SSH: cd ~/domains/fcarvajalbrown.com/repo && git pull origin master
        |
        v
   public_html (symlink to repo/_site) now serves the fresh build
        |
        v
   hPanel cron still runs repo/_site/refresh.php hourly, writing
   repo/_site/data.json in place (untouched by this change)
```

GitHub Pages backup: unaffected in kind — Pages can serve `_site/` as the
Pages root (or the repo root, if GitHub Pages settings point at `_site`),
same live-API fallback behavior when `data.json` is absent.

## Error handling

- Build failures (bad Markdown front matter, template errors) fail loudly and
  locally, before anything is committed — no partial `_site/` ever reaches
  git or the server.
- If `public_html`'s symlink is ever broken (e.g. `_site` deleted or repo
  moved), the site 404s cleanly rather than serving stale files — this is a
  known, visible failure mode to check for during the deploy-config change.
- `refresh.php`'s existing fail-safe behavior (leave `data.json` untouched on
  API error) is unchanged by relocating it into `src/`.

## Testing / verification

No automated test suite in this repo (by design, unchanged). Verification is
manual, same spirit as the Hostinger refresh work earlier in this project:

1. `npx @11ty/eleventy` builds without errors; `_site/` contains all four
   pages plus copied `styles.css`, `script.js`, `refresh.php`,
   `gh_config.sample.php`.
2. Serve `_site/` locally (`python -m http.server 8000` from inside `_site/`)
   and click through all four nav destinations plus the Portfolio repo-card
   modal, confirming nothing regressed from today's single-page behavior.
3. Confirm `refresh.php` still runs correctly from inside `_site/` (same
   verification style used for the Hostinger migration: run it, check exit
   code, check `data.json` shape).
4. Confirm responsive nav behavior at mobile widths (collapses sensibly;
   exact pattern decided during implementation, not pixel-specified here).
5. On the server: confirm the `public_html` symlink resolves and the live
   site matches the local `_site/` build after a `git pull`.

## Out of scope (separate specs)

- Writing archive content model, post authoring format, tagging/categories,
  and the actual archive/post page designs.
- Works page content and layout.
- Any dark/light mode toggle or other polish not covered by the confirmed
  mockup direction.
- Changing the Hostinger cron schedule, `refresh.php`'s internals, or the
  GitHub API fetch/filter logic — all untouched by this shell change.
