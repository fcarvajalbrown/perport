# Design: migrate the GitHub-data refresh from GitHub Actions to a Hostinger PHP cron

Date: 2026-07-12
Status: Approved (pending written-spec review)

## Problem

The portfolio at `https://fcarvajalbrown.github.io/perport/` refreshes its GitHub
data via a scheduled GitHub Actions workflow (`.github/workflows/refresh.yml`,
every 6h) that fetches the profile and repos, writes `data.json`, and commits it
back to the repo so GitHub Pages redeploys with a fresh snapshot.

We are adding a Hostinger Business shared-hosting deployment as the new primary
host and want the refresh to run there **without GitHub Actions**. The github.io
Pages site is kept as a "just in case" backup.

## Research summary (Hostinger Business plan)

Confirmed available on the Business tier (sources in the setup runbook):

- hPanel **cron jobs** (unlimited on Business, minute-level granularity, run in **UTC**).
- **PHP CLI** with **cURL enabled** and `allow_url_fopen` on by default.
- **Outbound HTTPS** (port 443 open) to `api.github.com`; no block observed.
- Static serving of HTML/CSS/JS from `public_html`.
- hPanel **Git deploy** (Advanced > Git): pull a GitHub repo into `public_html`.
- **SSH** available on Business (jailed to home dir, port 65002) — for placing the
  token config file above the web root.

Not usable for this: **Node.js** on shared Business is a managed app-deploy
feature, not a cron-callable runtime. So the refresh is written in **PHP**.

## Chosen architecture

- **Code source of truth:** the GitHub repo, unchanged. Hostinger's hPanel Git
  deploy pulls it into `public_html`.
- **Hostinger (primary):** serves the static site from `public_html`; a new
  `refresh.php` runs on an hPanel cron every 6h (UTC) and writes `data.json` in
  place. This is the only refresher. No GitHub Actions.
- **github.io (backup):** still deploys from the repo, but with `data.json` now
  untracked it uses the existing client-side live-API fallback already in
  `script.js`. No change to the site's JS is needed.

### Data refresh decisions (as agreed)

- **Authenticated GitHub API, minimal requests.** The refresh uses a fine-grained
  read-only Personal Access Token so it does not depend on Hostinger's shared,
  per-IP unauthenticated 60/hr budget (which a noisy co-tenant could exhaust).
  The point is reliability, not throughput — the run itself is deliberately
  lean: one profile call plus the repo list paginated at `per_page=100` (1-2
  pages), and nothing else. READMEs stay a client-side, on-demand fetch and are
  not part of the refresh.
- **Graceful without the token.** If the token config is missing, `refresh.php`
  still runs unauthenticated rather than hard-failing, so a first deploy before
  the config is placed does not error out.
- **Untrack `data.json`.** It is removed from git tracking and added to
  `.gitignore`, so hPanel pulls never clobber the cron-written file and github.io
  falls back to the live API instead of serving a stale committed snapshot.
- **Delete GitHub Actions.** `.github/workflows/refresh.yml` is removed.

## Components

### `refresh.php` (new; repo root, deploys to `public_html/refresh.php`)

Single-purpose PHP CLI script. Responsibilities:

1. **CLI-only guard.** `if (php_sapi_name() !== 'cli') { exit; }` at the top, so
   hitting `.../refresh.php` in a browser does nothing; only the cron (CLI) runs
   it. On github.io it is an inert, non-executed text file.
2. **Load token (optional).** Read a fine-grained PAT from a config file
   **outside** `public_html` (default `__DIR__ . '/../gh_config.php'`, i.e. the
   domain dir above the web root — never web-served), overridable via a constant
   at the top and via a `GITHUB_TOKEN` env var. Empty/missing ⇒ run
   unauthenticated.
3. **Fetch profile.** cURL GET `https://api.github.com/users/fcarvajalbrown` with
   headers `User-Agent: perport-refresh`, `Accept: application/vnd.github+json`,
   and `Authorization: Bearer <token>` when a token is present.
4. **Fetch repos (paginated, minimal).** cURL GET
   `https://api.github.com/users/fcarvajalbrown/repos?sort=updated&per_page=100&page=N`
   looping only until a page returns fewer than 100 items. Same headers.
5. **Filter.** Keep repos where `fork === false` and `name` (case-insensitive)
   `!== 'perport'` — identical to the old workflow and the client filter, so the
   snapshot matches today's output.
6. **Assemble** `{ generated_at, profile, repos }` with
   `generated_at = gmdate('Y-m-d\TH:i:s\Z')` — identical shape to the current
   `data.json`.
7. **Atomic write.** Write to `data.json.tmp` in the script's own directory, then
   `rename()` to `data.json`, so a visitor never reads a half-written file.
8. **Fail-safe.** On any HTTP/transport error (non-200, cURL failure, unparseable
   JSON), do **not** touch the existing `data.json` (serve stale rather than
   blank), print a diagnostic to STDERR, and `exit(1)`.

Configuration constants at the top: the GitHub username, the output path
(`__DIR__ . '/data.json'`), and the token config path.

### `gh_config.sample.php` (new; tracked)

A template showing the shape of the real config:

```php
<?php return ['token' => 'github_pat_xxx']; // read-only, public-repo scope
```

The operator copies it to `gh_config.php` **outside `public_html`** (e.g. the
domain dir) and fills in the token. The real file is never committed.

### Repo changes

- `git rm --cached data.json` (untrack; the local/server copy is regenerated by
  the cron).
- New `.gitignore` containing `data.json`, `data.json.tmp`, and `gh_config.php`.
- Delete `.github/workflows/refresh.yml` (and the now-empty workflow dir).
- `script.js`, `index.html`, `styles.css`: **unchanged.** The snapshot-first /
  live-API-fallback logic in `script.js` already handles an absent `data.json`.

### Docs

- Rewrite the "How data flows" / workflow-invariant sections of `CLAUDE.md` and
  the equivalent sections of `AGENTS.md` to describe the PHP-cron + Pages-fallback
  model (remove the GitHub Actions invariants, which no longer apply).
- New `docs/hostinger-setup.md`: one-time hPanel runbook — connect Git deploy,
  select PHP 8.2/8.3, place `gh_config.php` above the web root (via SSH/SFTP or
  File Manager), create the `0 */6 * * *` PHP cron job (note: hPanel schedules are
  UTC), and verify `data.json` is written.

## Data flow (after change)

```
GitHub repo (code) --push--> hPanel Git deploy --> public_html (Hostinger)
                                                      |
              refresh.php (cron, every 6h UTC, authenticated PAT, minimal calls)
                                                      |
                                       writes data.json atomically in place
                                                      |
                          visitor browser fetches data.json (snapshot mode)

github.io (backup): repo deploy, no data.json committed
                  -> script.js loadSnapshot() 404s -> live-API fallback
```

## Error handling

- Network/API failure in `refresh.php`: existing `data.json` left intact; exit 1
  (visible in hPanel cron logs). Next run recovers.
- Missing token config: runs unauthenticated (graceful), still produces
  `data.json`.
- Browser side: unchanged. `script.js` renders an inline `.error` banner on
  fetch failure and uses `escapeHtml` for all GitHub-supplied text.

## Testing / verification

No automated test suite in this repo (by design). Verification is manual:

1. **Local PHP run:** `php refresh.php` in the repo root produces a `data.json`
   whose shape matches the committed one (keys `generated_at`, `profile`,
   `repos`; forks and `perport` excluded). Diff against the current `data.json`
   (ignoring `generated_at`) to confirm parity.
2. **CLI guard:** requesting `refresh.php` over HTTP returns empty / does nothing.
3. **On Hostinger:** after wiring the cron, trigger it once from hPanel and
   confirm `data.json` timestamp updates and the live site renders in snapshot
   mode.
4. **Backup path:** confirm github.io still loads (via live-API fallback) with no
   committed `data.json`.

## Out of scope

- Any change to the site's look, JS behavior, or README-on-modal live fetch.
- Keeping GitHub Actions in any form.
