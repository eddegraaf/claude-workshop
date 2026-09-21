---
name: no-secrets-in-code
description: Scans changed or specified files for hardcoded secrets, credentials, tokens, or API keys and ensures they are sourced from environment variables instead. Use when the user asks to check for secrets, review before a commit/push, or add secret-handling rules.
---

# No Secrets In Code

Ensures no credentials, tokens, API keys, or other secrets are committed to the repository, per this project's security expectations alongside [CLAUDE.md](../../../CLAUDE.md).

## Steps

1. Get the scope: `git diff` / `git diff --staged` for local changes, or the specific files the user names.
2. Scan for common secret patterns in the changed files:
   - Hardcoded values assigned to variables/keys named like `password`, `token`, `apiKey`, `secret`, `authorization`, `pat`, `clientSecret`, etc.
   - Recognizable credential formats (e.g. `ghp_...`, `sk-...`, AWS-style `AKIA...`, JWTs, base64-looking blobs next to an auth-related key name).
   - Bearer tokens or basic-auth strings embedded directly in URLs or headers instead of `process.env.*`.
   - `.env` or similar files staged for commit that are not already covered by [.gitignore](../../../.gitignore).
3. For any hit, report file + line, the pattern matched, and require it be replaced with an environment variable reference (e.g. `process.env.API_TOKEN`) read via `.env` (never committed) or CI secrets — do not print the discovered secret value back in full; redact all but a few characters.
4. Confirm `.env`, `.env.*`, and any credential files are present in [.gitignore](../../../.gitignore); if not, flag it as a required fix.
5. If nothing is found, say so explicitly rather than staying silent.
6. Never fix a finding by committing the secret elsewhere (e.g. into `.mcp.json` or a config file) — the only acceptable fix is removing the literal value and replacing it with an environment-variable reference.
