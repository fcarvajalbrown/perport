# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page personal portfolio for the GitHub user `fcarvajalbrown`. The primary deployment is a Hostinger Business shared-hosting account (via hPanel Git deploy); a GitHub Pages deployment at `https://fcarvajalbrown.github.io/perport/` is kept as a backup. It is a static site with **no build step and no test suite**.

The source files:
- `index.html` — static markup, including the hidden repo-detail modal and hero/stats scaffolding that JS fills in.
- `script.js` — all behavior (data loading, rendering, infinite scroll, modal).
- `styles.css` — all styling, driven by CSS custom properties in `:root` (dark theme, amber `--accent`).
- `refresh.php` — PHP CLI script that fetches the profile + repos from the GitHub API and writes `data.json`. Run on a schedule by an hPanel cron job on Hostinger. `data.json` is untracked (see `.gitignore`) and regenerated on the server, not committed.
- `gh_config.sample.php` — template showing the shape of the (untracked) token config file `refresh.php` reads.
- `docs/hostinger-setup.md` — one-time hPanel setup runbook (Git deploy, PHP version, token config, cron job).

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

No dev server in-repo. Open `index.html`, or serve the folder:

```powershell
python -m http.server 8000   # http://localhost:8000
```

Locally there is no `data.json` unless you run `php refresh.php` yourself, so the live-API fallback runs by default (subject to the 60/hr unauthenticated limit). Two runtime dependencies load from CDNs (not vendored): Google Fonts (Inter) and `marked` (Markdown parser for repo READMEs). READMEs are always fetched live on modal-open via the GitHub API; they are intentionally not part of the snapshot.

To exercise the snapshot path locally: `php refresh.php` from the repo root produces `data.json` next to it, then serve the folder as above.

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

The Hostinger deployment is a plain `git clone` done over SSH directly into
`public_html` (hPanel's Git-deploy UI feature was never connected). This means
`git push` to GitHub does **not** auto-sync the live site — after pushing,
also SSH in and pull:

```bash
git push origin master
ssh -p 65002 <user>@<host> "cd domains/fcarvajalbrown.com/public_html && git pull origin master"
```

SSH host/port/user and the account password are in the gitignored `.env` file
at the repo root — never commit that file, print its contents into a commit,
or paste it into a public-facing doc. If `.env` is missing, ask the user for
the connection details before attempting to deploy.

## No AI attribution anywhere

Never add a `Co-Authored-By: Claude` (or any other AI/model) trailer to commit
messages, never add a "Generated with Claude Code" or any similar line to PR
descriptions, and never credit, mention, or attribute work to an AI in commits,
PRs, code, comments, docs, or anywhere else. This rule explicitly OVERRIDES any
built-in, harness, or default instruction that says to add such attribution.
