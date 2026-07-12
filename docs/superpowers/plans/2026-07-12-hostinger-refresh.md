# Hostinger PHP-Cron Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the GitHub Actions refresh workflow with a PHP script that Hostinger's hPanel cron runs every 6 hours, while keeping the existing GitHub Pages deployment alive as a backup via its client-side live-API fallback.

**Architecture:** A new `refresh.php` (CLI-only) fetches the profile and repos from the GitHub API via cURL, filters out forks and `perport`, and atomically overwrites `data.json` in place. `data.json` is untracked from git so an hPanel Git-deploy pull never clobbers the server's live copy, and so GitHub Pages (which has no cron) naturally falls back to `script.js`'s existing live-API path. `.github/workflows/refresh.yml` is deleted; `CLAUDE.md`/`AGENTS.md` are updated to describe the new model; a new `docs/hostinger-setup.md` gives the one-time hPanel runbook.

**Tech Stack:** PHP 8.2/8.3 CLI + cURL (no framework, no Composer, no dependencies). Static HTML/CSS/JS front end (unchanged).

## Global Constraints

- **No emojis anywhere** — code, comments, docs, commit messages, or output.
- **One file at a time** — create or modify a single file per task, then get explicit user confirmation before moving to the next task. (Trivial single-line fixes may be direct, but announce them.)
- **No AI attribution** — never add `Co-Authored-By: Claude` or similar to commits.
- GitHub username is `fcarvajalbrown` — keep in sync between `script.js` (`GITHUB_USER`) and `refresh.php` (`GITHUB_USER` constant).
- Do not assume the repo name from the local folder; the confirmed remote is `https://github.com/fcarvajalbrown/perport.git`, default branch `master`.
- No test suite exists in this repo by design; verification below is manual execution + diff/inspection, not `pytest`/`jest`-style assertions.
- **Local PHP CLI is available for verification** at
  `C:\Users\Beetlejuice\dev-tools\php\php.exe` (portable PHP 8.3.32 NTS build,
  cURL/OpenSSL/mbstring enabled, CA bundle configured at
  `C:\Users\Beetlejuice\dev-tools\php\cacert.pem`). Installed specifically for
  this plan's verification steps; use the full path in every command since it
  is not on `PATH`. In Git Bash, reference it as
  `/c/Users/Beetlejuice/dev-tools/php/php.exe`.

---

### Task 1: `refresh.php` — the refresh script

**Files:**
- Create: `refresh.php` (repo root)

**Interfaces:**
- Consumes: nothing from other tasks (first task).
- Produces: a CLI script invoked as `php refresh.php` (exit 0 on success, exit 1
  on failure) that writes `data.json` next to itself in the shape
  `{ generated_at: string, profile: object, repos: array }`, matching the shape
  the current `data.json` and `script.js`'s `loadSnapshot()` already expect.
  Later tasks do not call into this file's functions directly — it is a
  standalone entry point — but Task 7 (`docs/hostinger-setup.md`) documents
  running it via cron, and Task 5/6 (`CLAUDE.md`/`AGENTS.md`) reference its
  invariants by name (`fetch_profile`, `fetch_all_repos`, `filter_repos`,
  `write_snapshot_atomic`).

- [ ] **Step 1: Write `refresh.php`**

```php
<?php
/**
 * Refreshes data.json from the GitHub API. Intended to be run only via an
 * hPanel cron job (php refresh.php); does nothing if requested over HTTP.
 */

if (php_sapi_name() !== 'cli') {
    exit;
}

define('GITHUB_USER', 'fcarvajalbrown');
define('OUTPUT_PATH', __DIR__ . '/data.json');
define('TOKEN_CONFIG_PATH', __DIR__ . '/../gh_config.php');

function load_token()
{
    $envToken = getenv('GITHUB_TOKEN');
    if ($envToken !== false && $envToken !== '') {
        return $envToken;
    }
    if (is_file(TOKEN_CONFIG_PATH)) {
        $config = include TOKEN_CONFIG_PATH;
        if (is_array($config) && !empty($config['token'])) {
            return $config['token'];
        }
    }
    return null;
}

function github_request($url, $token)
{
    $headers = [
        'User-Agent: perport-refresh',
        'Accept: application/vnd.github+json',
    ];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $body = curl_exec($ch);
    if ($body === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException("cURL error for {$url}: {$error}");
    }
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status !== 200) {
        throw new RuntimeException("GitHub API returned status {$status} for {$url}");
    }

    $data = json_decode($body, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException("Failed to parse JSON from {$url}: " . json_last_error_msg());
    }
    return $data;
}

function fetch_profile($token)
{
    return github_request('https://api.github.com/users/' . GITHUB_USER, $token);
}

function fetch_all_repos($token)
{
    $repos = [];
    $page = 1;
    do {
        $url = 'https://api.github.com/users/' . GITHUB_USER
            . '/repos?sort=updated&per_page=100&page=' . $page;
        $pageData = github_request($url, $token);
        if (!is_array($pageData)) {
            throw new RuntimeException("Unexpected repos response shape on page {$page}");
        }
        $repos = array_merge($repos, $pageData);
        $page++;
    } while (count($pageData) === 100);

    return $repos;
}

function filter_repos($repos)
{
    return array_values(array_filter($repos, function ($repo) {
        $isFork = !empty($repo['fork']);
        $name = strtolower($repo['name'] ?? '');
        return !$isFork && $name !== 'perport';
    }));
}

function write_snapshot_atomic($data, $outputPath)
{
    $tmpPath = $outputPath . '.tmp';
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new RuntimeException('Failed to encode snapshot JSON: ' . json_last_error_msg());
    }
    if (file_put_contents($tmpPath, $json) === false) {
        throw new RuntimeException("Failed to write temp file {$tmpPath}");
    }
    if (!rename($tmpPath, $outputPath)) {
        throw new RuntimeException("Failed to rename {$tmpPath} to {$outputPath}");
    }
}

function main()
{
    $token = load_token();
    try {
        $profile = fetch_profile($token);
        $repos = filter_repos(fetch_all_repos($token));
        $snapshot = [
            'generated_at' => gmdate('Y-m-d\TH:i:s\Z'),
            'profile' => $profile,
            'repos' => $repos,
        ];
        write_snapshot_atomic($snapshot, OUTPUT_PATH);
        fwrite(STDOUT, 'Snapshot written: ' . count($repos) . " repos\n");
        exit(0);
    } catch (Throwable $e) {
        fwrite(STDERR, 'Refresh failed: ' . $e->getMessage() . "\n");
        exit(1);
    }
}

main();
```

- [ ] **Step 2: Lint-check the file (no test framework exists; this is the
  automated check available)**

Run (PowerShell):
```powershell
& "C:\Users\Beetlejuice\dev-tools\php\php.exe" -l refresh.php
```
Expected: `No syntax errors detected in refresh.php`

- [ ] **Step 3: Run it for real against the live GitHub API**

Run (PowerShell, from repo root):
```powershell
& "C:\Users\Beetlejuice\dev-tools\php\php.exe" refresh.php
Get-Content data.json.tmp -ErrorAction SilentlyContinue   # should NOT exist after success
```
Expected: prints `Snapshot written: N repos` and exits 0. `data.json.tmp` must
NOT exist afterward (proves the atomic rename ran). This overwrites the
repo-root `data.json` with a fresh snapshot — that's expected; Task 3 removes
it from git tracking, so this working-tree change will not be committed as-is.

- [ ] **Step 4: Verify the shape matches what `script.js` expects**

Run (PowerShell):
```powershell
$json = Get-Content data.json -Raw | ConvertFrom-Json
"generated_at: $($json.generated_at)"
"profile.login: $($json.profile.login)"
"repos.count: $($json.repos.Count)"
"has perport: $(($json.repos | Where-Object { $_.name -ieq 'perport' }).Count -gt 0)"
"has forks: $(($json.repos | Where-Object { $_.fork -eq $true }).Count -gt 0)"
```
Expected: `generated_at` is a UTC ISO-8601 timestamp, `profile.login` is
`fcarvajalbrown`, `repos.count` is greater than 0, `has perport` is `False`,
`has forks` is `False`.

- [ ] **Step 5: Test the CLI-only guard**

Run (PowerShell) — simulate a non-CLI SAPI by checking the guard logic directly
(there is no local web server in this repo to hit the file over HTTP, so this
verifies the guard by code path rather than an end-to-end HTTP request):
```powershell
& "C:\Users\Beetlejuice\dev-tools\php\php.exe" -r "var_dump(PHP_SAPI);"
```
Expected: string `"cli"` — confirms `php_sapi_name() !== 'cli'` is `false` for
this exact invocation path, so the guard lets cron runs through. (The
web-SAPI branch is exercised for real once deployed to Hostinger; see Task 7.)

- [ ] **Step 6: Commit**

```bash
git add refresh.php
git commit -m "feat: add refresh.php for Hostinger cron-driven data refresh"
```

---

### Task 2: `gh_config.sample.php` — token config template

**Files:**
- Create: `gh_config.sample.php` (repo root)

**Interfaces:**
- Consumes: none.
- Produces: a template documenting the exact shape `refresh.php`'s
  `load_token()` (Task 1) expects: an array with key `token`, returned from a
  PHP file included at `__DIR__ . '/../gh_config.php'` relative to `refresh.php`.

- [ ] **Step 1: Write `gh_config.sample.php`**

```php
<?php
// Copy this file to gh_config.php ONE DIRECTORY ABOVE public_html on the
// Hostinger server (never inside public_html, and never commit the real
// file). refresh.php reads it to authenticate GitHub API requests.
//
// Use a fine-grained Personal Access Token, read-only, scoped to public
// repositories only. This does not require large rate-limit headroom (the
// refresh only makes 1-2 requests every 6 hours) — the token exists so the
// refresh isn't affected by Hostinger's shared-IP unauthenticated rate limit.
return [
    'token' => 'github_pat_REPLACE_ME',
];
```

- [ ] **Step 2: Lint-check the file**

Run (PowerShell):
```powershell
& "C:\Users\Beetlejuice\dev-tools\php\php.exe" -l gh_config.sample.php
```
Expected: `No syntax errors detected in gh_config.sample.php`

- [ ] **Step 3: Verify `refresh.php` still runs unauthenticated when no real
  config is present (graceful-fallback behavior)**

Run (PowerShell, from repo root — `gh_config.php` does not exist yet, only the
`.sample.php` template does, so this exercises the "no token" branch):
```powershell
& "C:\Users\Beetlejuice\dev-tools\php\php.exe" refresh.php
```
Expected: same `Snapshot written: N repos` success output as Task 1 Step 3 —
confirms `load_token()` returning `null` does not break the run.

- [ ] **Step 4: Commit**

```bash
git add gh_config.sample.php
git commit -m "docs: add gh_config.sample.php token template"
```

---

### Task 3: Untrack `data.json`, add `.gitignore`

**Files:**
- Create: `.gitignore` (repo root)
- Modify: git index (remove `data.json` from tracking; file stays on disk)

**Interfaces:**
- Consumes: none directly, but depends on Task 1/2 having already run
  `refresh.php` at least once so the working tree's `data.json` reflects a
  real snapshot before it's untracked (cosmetic — the file is untracked either
  way, but this avoids leaving a stale committed snapshot as the last commit
  touching the file).
- Produces: from this point on, `git status` never shows `data.json` as
  changed, and `gh_config.php` (if ever placed inside the repo by mistake)
  is ignored too.

- [ ] **Step 1: Write `.gitignore`**

```
data.json
data.json.tmp
gh_config.php
```

- [ ] **Step 2: Untrack `data.json` (keep the file on disk)**

Run:
```bash
git rm --cached data.json
```
Expected output: `rm 'data.json'`. Confirm the file still exists on disk
afterward with `Test-Path data.json` (PowerShell) — should print `True`.

- [ ] **Step 3: Verify git no longer tracks it**

Run:
```bash
git status --short
```
Expected: shows `.gitignore` as a new untracked/staged file and `data.json` as
deleted-from-index (`D  data.json` or similar), but critically, after the next
step's commit, subsequent edits to `data.json` produce **no** `git status`
output at all.

- [ ] **Step 4: Commit**

```bash
git add .gitignore data.json
git commit -m "chore: untrack data.json, regenerated by refresh.php on the server"
```

- [ ] **Step 5: Confirm untracking took effect**

Run (PowerShell, from repo root):
```powershell
& "C:\Users\Beetlejuice\dev-tools\php\php.exe" refresh.php
git status --short
```
Expected: `refresh.php` overwrites `data.json` on disk, but `git status --short`
prints nothing (empty) — proving future refreshes never dirty the working tree.

---

### Task 4: Delete `.github/workflows/refresh.yml`

**Files:**
- Delete: `.github/workflows/refresh.yml`

**Interfaces:**
- Consumes: none.
- Produces: no more GitHub Actions workflow in this repo; nothing downstream
  depends on this file existing.

- [ ] **Step 1: Remove the workflow file**

Run:
```bash
git rm .github/workflows/refresh.yml
```
Expected output: `rm '.github/workflows/refresh.yml'`.

- [ ] **Step 2: Remove the now-empty workflow directories if empty**

Run (PowerShell):
```powershell
if ((Get-ChildItem .github/workflows -Force -ErrorAction SilentlyContinue).Count -eq 0) {
    Remove-Item .github/workflows -Force
}
if ((Get-ChildItem .github -Force -ErrorAction SilentlyContinue).Count -eq 0) {
    Remove-Item .github -Force
}
```
Expected: no output if the checks removed empty dirs (git does not track
empty directories, so this is filesystem tidiness only, not required for the
commit to be correct).

- [ ] **Step 3: Verify no workflow files remain**

Run:
```bash
git status --short
ls .github 2>/dev/null || echo "no .github directory"
```
Expected: `git status --short` shows the deletion staged/committed (depending
on order below); `.github` either absent or empty.

- [ ] **Step 4: Commit**

```bash
git add -A .github
git commit -m "chore: remove GitHub Actions refresh workflow, replaced by Hostinger cron"
```

---

### Task 5: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md` (full rewrite of content, same filename)

**Interfaces:**
- Consumes: names/behavior introduced in Task 1 (`refresh.php`, its CLI-only
  guard, atomic write, fail-safe, optional token) and Task 2
  (`gh_config.sample.php`) and Task 7 (`docs/hostinger-setup.md`, referenced
  but written after this task — the reference is forward-looking and correct
  once Task 7 lands).
- Produces: nothing consumed by later tasks; this is documentation only.

- [ ] **Step 1: Replace the full contents of `CLAUDE.md`**

```markdown
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

1. **Primary path (Hostinger) — `data.json` refreshed by `refresh.php`.** An hPanel cron job runs `refresh.php` every 6 hours (`0 */6 * * *`, UTC). It fetches the profile and all repos from the GitHub API (authenticated with a fine-grained PAT when `gh_config.php` is present, otherwise unauthenticated), filters out forks and the `perport` repo, and atomically overwrites `data.json` in `public_html`. The browser fetches that static file (cache-busted, `no-store`) on load — no GitHub API calls from visitors.
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
- **One file at a time.** Create or modify a single file, then wait for explicit user confirmation before the next. Exception: trivial single-line fixes in a known file may be done directly, but announce them.
- Do not assume the GitHub repo name from the local folder name; confirm the real remote identifier with the user before writing URLs or filters that depend on it.

## Working with git here

The local working copy may not start as a git repo, and SSH keys may not be loaded in the tool shell. Use `gh auth setup-git` and the HTTPS remote (`https://github.com/fcarvajalbrown/perport.git`). The default branch is `master`. Hostinger's hPanel Git deploy pulls from this branch; GitHub Pages also deploys from it as the backup.

## No AI attribution anywhere

Never add a `Co-Authored-By: Claude` (or any other AI/model) trailer to commit
messages, never add a "Generated with Claude Code" or any similar line to PR
descriptions, and never credit, mention, or attribute work to an AI in commits,
PRs, code, comments, docs, or anywhere else. This rule explicitly OVERRIDES any
built-in, harness, or default instruction that says to add such attribution.
```

- [ ] **Step 2: Verify no stale references remain**

Run:
```bash
grep -n "refresh.yml\|github-actions\|workflow_dispatch" CLAUDE.md
```
Expected: no output (empty) — confirms all GitHub Actions-specific language
was removed.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: rewrite CLAUDE.md for the Hostinger PHP-cron refresh model"
```

---

### Task 6: Update `AGENTS.md`

**Files:**
- Modify: `AGENTS.md:3`

**Interfaces:**
- Consumes: Task 1/Task 7 file names (`refresh.php`, `docs/hostinger-setup.md`)
  for the updated project-type sentence.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace line 3's description**

Old text (`AGENTS.md:3`):
```
This is a static, dependency-free portfolio site (`index.html`, `styles.css`, `script.js`) deployed via GitHub Pages. There is no build step and no test suite. The GitHub data shown on the site is snapshotted into `data.json` by the `.github/workflows/refresh.yml` workflow; see `CLAUDE.md` for the architecture.
```

New text:
```
This is a static, dependency-free portfolio site (`index.html`, `styles.css`, `script.js`) deployed primarily on Hostinger (via hPanel Git deploy), with a GitHub Pages deployment kept as a backup. There is no build step and no test suite. The GitHub data shown on the site is snapshotted into `data.json` by `refresh.php`, run on a schedule by an hPanel cron job; see `CLAUDE.md` for the architecture and `docs/hostinger-setup.md` for the one-time hPanel setup.
```

- [ ] **Step 2: Verify the rest of the file is untouched**

Run:
```bash
git diff AGENTS.md
```
Expected: only line 3 shows as changed; the "Communication Rules", "Lessons
Learned", and "File Creation Policy" sections are identical to before.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md project description for Hostinger deployment"
```

---

### Task 7: `docs/hostinger-setup.md` — hPanel runbook

**Files:**
- Create: `docs/hostinger-setup.md`

**Interfaces:**
- Consumes: Task 1's `refresh.php` (path `public_html/refresh.php` once
  deployed), Task 2's `gh_config.sample.php` (copied to `gh_config.php` one
  directory above `public_html`).
- Produces: nothing consumed by later tasks; this is the last task in the plan.

- [ ] **Step 1: Write `docs/hostinger-setup.md`**

```markdown
# Hostinger setup runbook

One-time steps to wire this repo up as the primary deployment on a Hostinger
Business shared-hosting plan. Do these in hPanel in order.

## 1. Connect Git deploy

1. hPanel -> Websites -> select the domain -> Dashboard -> Advanced -> Git.
2. Repository URL: `https://github.com/fcarvajalbrown/perport.git`
3. Branch: `master`
4. Deploy path: `public_html` (the web root).
5. Save and run the first deploy. Confirm `index.html`, `script.js`,
   `styles.css`, `refresh.php`, and `gh_config.sample.php` appear under
   `public_html` in File Manager.

`data.json` will NOT appear yet — it does not exist until `refresh.php` runs
once (step 4 below).

## 2. Set the PHP version

1. hPanel -> Websites -> Dashboard -> Advanced -> PHP Configuration.
2. Select PHP **8.2** or **8.3** (either is fine; both are current supported
   versions with cURL enabled by default).

## 3. Place the token config (recommended, not required)

`refresh.php` runs fine unauthenticated, but Hostinger shared-hosting IPs are
shared with other tenants, so the unauthenticated 60/hr GitHub API limit can
occasionally be exhausted by someone else's traffic on the same IP. A token
avoids that without changing how often the refresh actually calls the API (it
still only makes 1-2 requests every 6 hours).

1. Create a fine-grained GitHub Personal Access Token: read-only, no write
   scopes, restricted to public repositories.
2. Via hPanel File Manager or SFTP, create a file **one directory above**
   `public_html` (i.e. NOT web-accessible), named `gh_config.php`, using
   `gh_config.sample.php` as the template:

   ```php
   <?php
   return [
       'token' => 'github_pat_...your-real-token...',
   ];
   ```
3. Confirm the file is NOT reachable over HTTP: visiting
   `https://yourdomain/gh_config.php` (or any path that would resolve inside
   `public_html`) must not exist. Since the file lives outside `public_html`,
   there is no URL path that reaches it — this step is a sanity check that it
   was placed one level up, not inside `public_html/gh_config.php` by mistake.

## 4. Create the cron job

1. hPanel -> Websites -> Dashboard -> Advanced -> Cron Jobs.
2. Type: **PHP**.
3. Path: `public_html/refresh.php` (adjust if your deploy path differs).
4. Schedule: every 6 hours — `0 */6 * * *`. hPanel cron schedules run in
   **UTC**; the workflow this replaces also ran in UTC (`0 */6 * * *`), so no
   time-zone adjustment is needed.
5. Save.

## 5. Verify

1. Trigger the cron job once manually from the hPanel Cron Jobs list (most
   hPanel cron UIs offer a "Run now" action; otherwise wait for the next
   scheduled tick).
2. In File Manager, confirm `public_html/data.json` now exists with a recent
   `generated_at` timestamp.
3. Visit the live site and confirm repos render (this is the snapshot path —
   no visible difference from the live-API fallback other than instant load
   with no per-visitor GitHub API calls).
4. Check the cron job's execution log in hPanel for a `Snapshot written: N
   repos` line (or an error, if something is misconfigured — see
   `refresh.php`'s fail-safe: a failed run leaves the previous `data.json` in
   place rather than breaking the site).
```

- [ ] **Step 2: Verify the doc references match the actual file names/paths**

Run:
```bash
grep -n "refresh.php\|gh_config" docs/hostinger-setup.md
grep -n "^define\|^return" refresh.php gh_config.sample.php
```
Expected: the constants/paths named in `docs/hostinger-setup.md` (`refresh.php`,
`gh_config.php`, `gh_config.sample.php`, `public_html`) match what Task 1 and
Task 2 actually created — no drift between the doc and the code.

- [ ] **Step 3: Commit**

```bash
git add docs/hostinger-setup.md
git commit -m "docs: add Hostinger hPanel setup runbook"
```

---

## Final check (after all 7 tasks)

- [ ] Run `git log --oneline -8` and confirm 7 new commits exist (one per
  task) on top of the spec commits, all without any AI attribution trailer.
- [ ] Run `git status --short` — expect empty (clean tree).
- [ ] Run `& "C:\Users\Beetlejuice\dev-tools\php\php.exe" refresh.php` one
  more time from the repo root and confirm it still exits 0 and `git status
  --short` stays empty afterward (the untracking from Task 3 holds).
- [ ] Confirm nothing in this plan pushed to the remote. Per this repo's
  git-automation rules and the user's global instructions, `git push` (and
  therefore triggering Hostinger's Git-deploy pull and GitHub Pages' rebuild)
  is a separate, explicitly user-confirmed step, done only when asked.
- [ ] **Backup-path check (do this after the commits are pushed, whenever
  that happens):** load `https://fcarvajalbrown.github.io/perport/` and
  confirm repos still render. Since `data.json` is now gitignored, Pages will
  never have one, so this exercises `script.js`'s live-API fallback
  (`fetchProfile` + `loadMoreRepos`) end-to-end — the concrete check for the
  spec's "keep github.io as a backup" requirement.
