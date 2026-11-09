# Session notes

## Current state
- Live site serves 410 for the 11 removed politics escritos and a sitemap with lastmod per escrito.
- GitHub master is ahead of the server: the comunicado type, two cartas, two comunicados and the rebuilt `_site` are pushed but not deployed.

## Open flags
- Search Console: resubmit https://fcarvajalbrown.com/sitemap.xml and Validate fix on the "Not found (404)" row (Felipe).
- Deploy master to Hostinger when Felipe confirms the four new pieces should go live.
- Drop stash `wip-comunicado-before-sitemap-fix`; its content is committed.
- Build with `pnpm run build` (npm is blocked); delete any generated `pnpm-lock.yaml`.
