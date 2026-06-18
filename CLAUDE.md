# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page personal portfolio for the GitHub user `fcarvajalbrown`, deployed via GitHub Pages at `https://fcarvajalbrown.github.io/perport/`. It is a static site with **no build step and no test suite**.

The source files:
- `index.html` — static markup, including the hidden repo-detail modal and hero/stats scaffolding that JS fills in.
- `script.js` — all behavior (data loading, rendering, infinite scroll, modal).
- `styles.css` — all styling, driven by CSS custom properties in `:root` (dark theme, amber `--accent`).
- `data.json` — generated snapshot of the profile + repos (committed by the workflow, not by hand).
- `.github/workflows/refresh.yml` — the scheduled job that produces `data.json`.

## How data flows (the important part)

The site shows GitHub data via a **snapshot-first model with a live-API fallback**:

1. **Primary path — `data.json`.** On a schedule (every 6h, cron `0 */6 * * *`) and via manual `workflow_dispatch`, `refresh.yml` runs on Actions, fetches the profile and all repos with the authenticated `GITHUB_TOKEN` (5,000 req/hr), filters out forks and the `perport` repo itself, and writes `{generated_at, profile, repos}` to `data.json`. The browser fetches that static file (cache-busted, `no-store`) on load — no GitHub API calls from visitors, so the 60/hr unauthenticated rate limit no longer applies to the live site.
2. **Fallback path — live API.** If `data.json` is absent or unparseable (e.g. local dev before the first workflow run), `script.js` falls back to the original client-side GitHub API calls (`fetchProfile` + paginated `loadMoreRepos`). Keep this fallback working when editing `script.js`.

`loadSnapshot()` decides which path is taken and sets the `usingSnapshot` flag; the `IntersectionObserver` and init block in `script.js` branch on it. In snapshot mode all repos are already in memory and infinite scroll just slices `allRepos`; in fallback mode each scroll fetches one API page.

### Workflow invariants (do not regress these)

`refresh.yml` was hardened to stay green and quiet; preserve all three:
- **Commit only on real change.** It diffs the new `data.json` against the committed one *with `generated_at` stripped*, so the per-run timestamp alone never produces a commit.
- **Exclude `perport` and forks from the snapshot.** The workflow pushes to `perport`, which bumps `perport`'s own `updated_at`; if `perport` were in the snapshot, every run would see a self-inflicted change and commit forever. Filtering happens server-side in the workflow (the client also hides them).
- **Rebase-and-retry the push.** The push is retried after `git pull --rebase` so an outside commit landing mid-run does not fail the job with a non-fast-forward.

Net effect: on a quiet day the scheduled run commits nothing and triggers no Pages redeploy. A snapshot commit auto-triggers the built-in `pages-build-deployment`.

## Running it locally

No dev server in-repo. Open `index.html`, or serve the folder:

```powershell
python -m http.server 8000   # http://localhost:8000
```

Locally there is usually no `data.json`, so the live-API fallback runs (subject to the 60/hr unauthenticated limit). Two runtime dependencies load from CDNs (not vendored): Google Fonts (Inter) and `marked` (Markdown parser for repo READMEs). READMEs are always fetched live on modal-open via the GitHub API; they are intentionally not part of the snapshot.

## Other architecture notes

- **localStorage cache wraps the fallback fetches.** `cacheGet`/`cacheSet` key entries as `gh_<CACHE_VERSION>_<key>` with a 12h TTL. Bump `CACHE_VERSION` (currently `v2`) to invalidate cached data after a shape change. (The snapshot path bypasses this cache.)
- **XSS safety:** any GitHub-supplied text injected via `innerHTML` must go through `escapeHtml`. README HTML is the deliberate exception (rendered through `marked`). Keep this invariant when adding fields.
- **Resilience:** network calls go through `fetchWithTimeout` (8s); failures render an inline `.error` banner rather than throwing.
- `GITHUB_USER` in `script.js` and `GH_USER` in `refresh.yml` are the single sources of truth for whose data is shown — keep them in sync.

## Project conventions (from AGENTS.md)

- **No emojis anywhere** — code, comments, docs, commit messages, or output.
- **One file at a time.** Create or modify a single file, then wait for explicit user confirmation before the next. Exception: trivial single-line fixes in a known file may be done directly, but announce them.
- Do not assume the GitHub repo name from the local folder name; confirm the real remote identifier with the user before writing URLs or filters that depend on it.

## Working with git here

The local working copy may not start as a git repo, and SSH keys may not be loaded in the tool shell. Use `gh auth setup-git` and the HTTPS remote (`https://github.com/fcarvajalbrown/perport.git`). The default branch is `master`, and Pages deploys from it.
