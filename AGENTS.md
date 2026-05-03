## Testing Standards

- `go test ./...` must pass before any commit.
- Every schema change needs a corresponding test fixture (valid and invalid examples).
- Cache and checkpoint tests must verify crash recovery.
- **Never modify a test to make it pass.** If a test fails, fix the root cause in the production code first. Only update the test itself if the test is genuinely wrong (wrong expectation, stale contract). When in doubt, ask.

## Communication Rules

- **NEVER use emojis** — not in code, comments, docs, commit messages, CLI output, or agent responses.

## File Creation Policy

**This is enforced for all agents working on this project:**

- Create or modify **one file at a time**.
- Ask for explicit user confirmation before each file.
- Wait for the user to approve before proceeding to the next file.
- Exception: trivial single-line fixes in a known file may be done directly, but announce them.
