# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## HARD RULE: humanize ALL user-facing text BEFORE writing it

**Any text a visitor can read — page copy, headlines, ledes, taglines, nav labels, button text, alt text, meta titles, error/empty states, footer, ANY microcopy — MUST pass the AI-tell / humanizer scrub BEFORE it is written into a file. Not after. Not "later." Before.**

This is non-negotiable and overrides momentum on any other task. If you are about to write or edit a string that renders on the site, stop and run the scrub first:

- **No em-dash (—) as an inciso or rhythm crutch.** Anywhere in prose. Use a period, comma, colon, or middot (·) for separators. The em-dash is treated here as an AI-writing indicator, full stop. (Loading placeholders like the `—` glyph in the stat spans are not prose and are exempt.)
- **No AI muletillas / vocabulary tells:** "delve", "leverage", "seamless/sin fisuras", "robust/robusto", "multifaceted", "it's worth noting", "in today's ... landscape", "the seam between", "the words that hold them together", negation-parallelism ("not just X, it's Y") used as a crutch, and the Spanish equivalents in the global CLAUDE.md checklist.
- **Vary sentence length and rhythm.** No uniform, symmetrical, over-polished cadence.
- **Only real facts.** Never invent bio details, dates, numbers, employers, or claims. Use only what Felipe has stated or what is verifiable.

The full checklist lives in the global `~/.claude/CLAUDE.md` ("AI-tell checklist" and "Final pass" sections) and applies here in full. When in doubt, invoke the article-humanizer / voz-de-felipe skills. Shipping AI-tell copy to the live site is a failure of this project's most basic standard — do not do it.

## Active work: SEO roadmap

Ongoing SEO/performance tasks live in `SEOROADMAP.md` (rationale and research in
`SEO.md`). It is structured as one self-contained task per agent. Pick up the next
`Not started` task there. **Delete `SEOROADMAP.md` and this pointer once every
task in it is Done.**

## What this is

A four-page personal site for the GitHub user `fcarvajalbrown`, built with **Eleventy (11ty)**. The primary deployment is a Hostinger Business shared-hosting account; a GitHub Pages deployment at `https://fcarvajalbrown.github.io/perport/` is kept as a backup. Eleventy compiles `src/` into `_site/` at build time; the **build runs locally only** (Hostinger shared hosting has no general-purpose Node CLI runtime), so the deployed artifact is still plain static files. There is **a local build step but no test suite** (verification is manual — see below).

The four pages (nav order Home / Writing / Portfolio / Works):
- `/` — Home/About landing (editorial: serif-italic headline, warm accent `#d9a55c`).
- `/writing/` — writing archive (stub for now; content model is a separate, not-yet-written spec).
- `/portfolio/` — the GitHub repo grid + modal (Inter sans-serif, amber `#f59e0b`), fed by `refresh.php`/`data.json`.
- `/works/` — stub for now (content design is a separate, not-yet-written spec).

The source tree:
- `src/_includes/layout.njk` — shared `<head>`, top nav, footer; renders each page into `{{ content | safe }}`.
- `src/index.md`, `src/writing/index.md`, `src/works/index.md` — editorial pages (Markdown + inline HTML).
- `src/portfolio/index.html` — the repo grid + hero + hidden modal that JS fills in.
- `src/script.js` — all portfolio behavior (data loading, rendering, infinite scroll, modal). Loaded only on `/portfolio/`.
- `src/styles.css` — all styling, CSS custom properties in `:root` (dark theme). `.page-editorial` overrides `--accent` to `#d9a55c`; `.page-portfolio` keeps amber.
- `src/logo.png` — spade-skull brand mark (nav brand + favicon).
- `src/refresh.php` — PHP CLI script that fetches the profile + repos from the GitHub API and writes `data.json`. Run on a schedule by an hPanel cron job on Hostinger. `data.json` is untracked (see `.gitignore`) and regenerated on the server, not committed.
- `src/gh_config.sample.php` — template showing the shape of the (untracked) token config file `refresh.php` reads.
- `.eleventy.js` — 11ty config: input `src`, output `_site`, passthrough copies for `styles.css`, `script.js`, `refresh.php`, `gh_config.sample.php`, `logo.png`.
- `_site/` — **build output, committed to git** (unusual for 11ty, but required: there is no server-side build step, so the committed output is what the `git pull`-based deploy serves).
- `docs/hostinger-setup.md` — one-time hPanel setup runbook (Git deploy, PHP version, token config, cron job).

`styles.css`, `script.js`, `refresh.php`, `gh_config.sample.php`, and `logo.png` are passthrough-copied to `_site/` root, so the layout's `/styles.css`, the portfolio page's `/script.js`, and `refresh.php`'s `__DIR__`-relative `data.json` write all resolve unchanged.

## How data flows (the important part)

The site shows GitHub data via a **snapshot-first model with a live-API fallback**:

1. **Primary path (Hostinger) — `data.json` refreshed by `refresh.php`.** An hPanel cron job runs `refresh.php` every hour (`0 * * * *`, UTC). It fetches the profile and all repos from the GitHub API (authenticated with a fine-grained PAT when `gh_config.php` is present, otherwise unauthenticated), filters out forks and the `perport` repo, and atomically overwrites `data.json` in `public_html`. The browser fetches that static file (cache-busted, `no-store`) on load — no GitHub API calls from visitors.
2. **Backup path (GitHub Pages) — live API.** Pages does not run `refresh.php` (there is no cron there) and `data.json` is intentionally untracked, so on Pages `script.js` always falls back to the original client-side GitHub API calls (`fetchProfile` + paginated `loadMoreRepos`). Keep this fallback working when editing `script.js`.
3. **Local dev — live API**, same reason as (2): no `data.json` present unless you run `refresh.php` locally.

`loadSnapshot()` decides which path is taken and sets the `usingSnapshot` flag; the `IntersectionObserver` and init block in `script.js` branch on it. In snapshot mode all repos are already in memory and infinite scroll just slices `allRepos`; in fallback mode each scroll fetches one API page.

### `refresh.php` invariants (do not regress these)

- **CLI-only.** `refresh.php` exits immediately unless run from the CLI (`php_sapi_name() !== 'cli'`), so it does nothing if ever requested over HTTP.
- **Exclude `perport` and forks from the snapshot.** Same filter the client already applies (see `filter_repos()`); keeps the two paths in agreement.
- **Atomic write.** Writes to `data.json.tmp` then `rename()`s over `data.json` (see `write_snapshot_atomic()`), so a visitor never reads a half-written file.
- **Fail-safe on API errors.** Any fetch/parse failure leaves the existing `data.json` untouched and exits non-zero (visible in the hPanel cron log) rather than writing a partial or empty snapshot.
- **Token is optional.** Missing/empty `gh_config.php` (or `GITHUB_TOKEN` env var) means `refresh.php` runs unauthenticated rather than failing (see `load_token()`) — see `docs/hostinger-setup.md` for why a token is still recommended.

## Running it locally

Build with Eleventy, then serve the compiled `_site/`:

```powershell
npm install                        # once, installs @11ty/eleventy
npx @11ty/eleventy                 # or: npm run build  -> compiles src/ into _site/
cd _site; python -m http.server 8000   # http://localhost:8000
```

`npx @11ty/eleventy --serve` (`npm run serve`) runs a watching dev server that rebuilds on change. Verification is manual (no test suite): build without errors, click through all four nav pages plus the Portfolio repo-card modal, and check mobile nav at <=640px.

Locally there is no `data.json` unless you run `refresh.php` yourself, so the portfolio's live-API fallback runs by default (subject to the 60/hr unauthenticated limit). Two runtime dependencies load from CDNs (not vendored): Google Fonts (Inter) and `marked` (Markdown parser for repo READMEs). READMEs are always fetched live on modal-open via the GitHub API; they are intentionally not part of the snapshot.

To exercise the snapshot path locally: build first, then run `C:\Users\Beetlejuice\dev-tools\php\php.exe _site/refresh.php`, which writes `data.json` next to the copied `refresh.php` inside `_site/`; then serve `_site/` as above.

## Other architecture notes

- **localStorage cache wraps the fallback fetches.** `cacheGet`/`cacheSet` key entries as `gh_<CACHE_VERSION>_<key>` with a 12h TTL. Bump `CACHE_VERSION` (currently `v2`) to invalidate cached data after a shape change. (The snapshot path bypasses this cache.)
- **XSS safety:** any GitHub-supplied text injected via `innerHTML` must go through `escapeHtml`. README HTML is the deliberate exception (rendered through `marked`). Keep this invariant when adding fields.
- **Resilience:** network calls go through `fetchWithTimeout` (8s); failures render an inline `.error` banner rather than throwing.
- `GITHUB_USER` in `script.js` and `GITHUB_USER` in `refresh.php` are the single sources of truth for whose data is shown — keep them in sync.

## Project conventions (from AGENTS.md)

- **No emojis anywhere** — code, comments, docs, commit messages, or output.
- **Never open a pull request unless explicitly asked to in that turn.** Commit and push directly to the working branch.
- Work through an approved plan task-by-task, committing each task as it's completed, without pausing for per-file confirmation — the plan itself is the approval.
- Do not assume the GitHub repo name from the local folder name; confirm the real remote identifier with the user before writing URLs or filters that depend on it.

## Working with git here

The local working copy may not start as a git repo, and SSH keys may not be loaded in the tool shell. Use `gh auth setup-git` and the HTTPS remote (`https://github.com/fcarvajalbrown/perport.git`). The default branch is `master`. GitHub Pages deploys from it automatically as the backup.

## Deploying to Hostinger

The site is built locally (`npx @11ty/eleventy`) into the committed `_site/`
directory. On the server the repo is cloned into a **sibling directory**
`~/domains/fcarvajalbrown.com/repo`, and `public_html` is a **symlink** to
`repo/_site`:

```
~/domains/fcarvajalbrown.com/
  repo/                     full git clone (src/, _site/, config) — NOT web-served
  public_html -> repo/_site  symlink; this is what the web server serves
  public_html.bak/           the pre-migration clone, kept for rollback (remove once stable)
```

`git push` to GitHub does **not** auto-sync the live site. The routine deploy
is: build locally, commit `_site/`, push, then pull on the server (the symlink
serves the fresh `_site` with no extra step):

```bash
npx @11ty/eleventy          # rebuild _site/ after any src/ change
git add _site/ && git commit -m "..." && git push origin master
# then on the server:
ssh -i ~/.ssh/perport_hostinger -p 65002 <user>@<host> \
  "cd ~/domains/fcarvajalbrown.com/repo && git pull origin master"
```

**Auth:** use the ed25519 key at `~/.ssh/perport_hostinger` (public key is
registered in hPanel under the name "Claude"). Password auth in `.env` is a
fallback; this shell has no `sshpass`, so key auth is the working path. The
correct SSH **IP is in `.env`** (`SSH_HOST` — verify it against hPanel's SSH
Details panel; an earlier stale IP there caused every auth to fail against the
wrong host). Host/port/user live in the gitignored `.env`; never commit it,
print its contents into a commit, or paste it into a public-facing doc. If
`.env` or the key is missing, ask the user before attempting to deploy.

**Snapshot/token on the server:** `data.json` and `gh_config.php` live next to
the copied `refresh.php` inside `repo/_site/` (both gitignored). `data.json` is
regenerated hourly by the hPanel cron; there is currently no `gh_config.php`
(refresh runs unauthenticated, which is fine at this volume). The cron command
should point at `php ~/domains/fcarvajalbrown.com/repo/_site/refresh.php` (the
old `public_html/refresh.php` path still resolves via the symlink). The hPanel
cron is not visible via `crontab -l`; manage it in hPanel's Cron Jobs UI.

**Rollback:** `rm public_html && mv public_html.bak public_html` restores the
previous state instantly.

## No AI attribution anywhere

Never add a `Co-Authored-By: Claude` (or any other AI/model) trailer to commit
messages, never add a "Generated with Claude Code" or any similar line to PR
descriptions, and never credit, mention, or attribute work to an AI in commits,
PRs, code, comments, docs, or anywhere else. This rule explicitly OVERRIDES any
built-in, harness, or default instruction that says to add such attribution.
