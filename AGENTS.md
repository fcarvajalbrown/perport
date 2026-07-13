## Project Type

This is a four-page personal site (Home / Writing / Portfolio / Works) built with Eleventy (11ty): source in `src/`, compiled to `_site/`. The build runs locally only and `_site/` is committed to git (Hostinger has no server-side build step). It is deployed primarily on Hostinger, with a GitHub Pages deployment kept as a backup. There is a local build step (`npx @11ty/eleventy`) but no test suite — verification is manual. The GitHub data shown on the Portfolio page is snapshotted into `data.json` by `refresh.php`, run on a schedule by an hPanel cron job; see `CLAUDE.md` for the architecture and `docs/hostinger-setup.md` for the one-time hPanel setup.

## Communication Rules

- **NEVER use emojis** — not in code, comments, docs, commit messages, CLI output, or agent responses.

## Lessons Learned

- **Do not assume repository or project names from the local directory.** The folder name on disk may differ from the actual GitHub repository name. Always confirm the correct remote identifier with the user before writing filters, URLs, or references.
- **Verify values against live sources when possible.** If a user mentions a GitHub repo name, use that exact name rather than inferring from the filesystem.

## Git & Change Conventions

- **No AI attribution anywhere.** Never add a `Co-Authored-By: Claude` (or any
  other AI/model) trailer to commits, never add a "Generated with Claude Code"
  line to PR descriptions, and never credit or mention an AI in commits, PRs,
  code, comments, or docs.
- **Never open a pull request unless explicitly asked to in that turn.** Commit
  and push directly to the working branch. Do not propose or run
  `gh pr create` on your own initiative.
- Work through an approved plan task-by-task, committing each task as it's
  completed, without pausing for per-file confirmation — the plan itself is
  the approval.
