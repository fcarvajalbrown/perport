# Chat 1: Search Console sitemap fix

## Done
- GSC showed 17 pages not indexed: 3 "Not found (404)" and 14 "Discovered - currently not indexed".
- The 404s are the 11 party-politics escritos removed in 718f677. `src/.htaccess` now answers 410 Gone for those slugs (805c103). Verified live: 410.
- `src/sitemap.njk` writes `<lastmod>` (publication date) for every escrito (04e6dff). Live sitemap: 89 URLs, 83 with lastmod.
- Deployed to Hostinger via `git pull` on the server.
- Committed the pending comunicado interno work (06bb79f, 5d9950b, ce54a96) and the project seo skill (310960a). Pushed.

## Flags
- Open: in Search Console, resubmit the sitemap and click Validate fix on the 404 row. Felipe does this by hand.
- Open: commits 06bb79f to 310960a are pushed to GitHub but not deployed to Hostinger. Deploying publishes two cartas and two noindex comunicados.
- Open: `git stash list` still holds `wip-comunicado-before-sitemap-fix`; its content is now committed, so it can be dropped.
- Note: build with `pnpm run build`; npm is blocked on this machine. Delete any `pnpm-lock.yaml` it creates, the repo tracks `package-lock.json`.
