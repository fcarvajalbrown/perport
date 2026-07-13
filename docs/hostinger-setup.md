# Hostinger setup runbook

## Current deployment architecture (as built)

The site is an Eleventy build: source in `src/`, compiled to the committed
`_site/`. Because Hostinger shared hosting has no general-purpose Node runtime,
the build runs locally and `_site/` is committed. On the server:

```
~/domains/fcarvajalbrown.com/
  repo/                     full git clone — NOT web-served
  public_html -> repo/_site  symlink; the web root the server actually serves
  public_html.bak/           pre-migration clone, kept for rollback
```

Deploy loop: build locally, commit `_site/`, `git push`, then on the server
`cd ~/domains/fcarvajalbrown.com/repo && git pull origin master`. The symlink
serves the fresh `_site` with no extra step. Auth uses the ed25519 key at
`~/.ssh/perport_hostinger` (registered in hPanel SSH Access as "Claude"); the
correct SSH IP/port/user are in the gitignored `.env`. See the "Deploying to
Hostinger" section of `CLAUDE.md` for the full deploy + rollback commands.

Note: hPanel's Git-deploy UI was never connected — the migration to the
sibling-clone + symlink layout was done manually over SSH. The sections below
are the *original* intended one-time setup, kept for reference; where they say
`public_html/...`, the live reality is `repo/_site/...` (which `public_html`
symlinks to, so the old paths still resolve).

---

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
still only makes 1-2 requests per run, run hourly).

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
3. Path: `~/domains/fcarvajalbrown.com/repo/_site/refresh.php` (the current
   live path; the old `public_html/refresh.php` still resolves via the symlink).
4. Schedule: every hour — `0 * * * *` (Minute `0`, Hour "every hour"/`*`, Day/
   Month/Weekday left at "every"). hPanel cron schedules run in **UTC**.
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
