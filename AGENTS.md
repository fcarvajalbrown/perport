## Project Type

This is a static, dependency-free portfolio site (`index.html`, `styles.css`, `script.js`) deployed via GitHub Pages. There is no build step and no test suite. The GitHub data shown on the site is snapshotted into `data.json` by the `.github/workflows/refresh.yml` workflow; see `CLAUDE.md` for the architecture.

## Communication Rules

- **NEVER use emojis** — not in code, comments, docs, commit messages, CLI output, or agent responses.

## Lessons Learned

- **Do not assume repository or project names from the local directory.** The folder name on disk may differ from the actual GitHub repository name. Always confirm the correct remote identifier with the user before writing filters, URLs, or references.
- **Verify values against live sources when possible.** If a user mentions a GitHub repo name, use that exact name rather than inferring from the filesystem.

## File Creation Policy

**This is enforced for all agents working on this project:**

- Create or modify **one file at a time**.
- Ask for explicit user confirmation before each file.
- Wait for the user to approve before proceeding to the next file.
- Exception: trivial single-line fixes in a known file may be done directly, but announce them.
