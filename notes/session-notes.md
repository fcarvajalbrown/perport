# Session notes

## Current state
- Live site is on master: 410 for the 11 removed politics escritos, sitemap with lastmod per escrito (91 URLs), the comunicado type, two new cartas and two noindex comunicados.
- Google rechecks a submitted sitemap on its own schedule; resubmit only after big changes or a fetch error. Accurate lastmod is what Google uses.

## Open flags
- Search Console: one-time resubmit of https://fcarvajalbrown.com/sitemap.xml and Validate fix on the "Not found (404)" row (Felipe).
- Drop stash `wip-comunicado-before-sitemap-fix`; its content is committed.
- Build with `pnpm run build` (npm is blocked); delete any generated `pnpm-lock.yaml`.
