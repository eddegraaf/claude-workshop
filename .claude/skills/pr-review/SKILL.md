---
name: pr-review
description: Reviews changed or staged Playwright TypeScript files against this project's CLAUDE.md rules (TypeScript only, no absolute XPath, Page Object Model enforcement) and reports violations. Use when the user asks to review a PR, review changes, or check compliance before committing/pushing.
---

# PR / Change Review Against CLAUDE.md

Checks the current diff (or a specified PR) against this repository's [CLAUDE.md](../../../CLAUDE.md) rules and reports findings — does not auto-fix unless asked.

## Steps

1. Get the scope: `git diff` / `git diff --staged` for local changes, or fetch the PR's changed files via the GitHub MCP server (`pull_request_read` / diff tools) if a PR number/URL is given.
2. For each changed file under `tests/**` or `pages/**`, check:
   - **Language**: file extension is `.ts`, not `.js`/`.jsx`. No untyped `any` used for data shared across tests.
   - **Locators**: no absolute XPath (`/html/body/...` or any `xpath=` starting with `/` at the root). Flag any `page.locator('xpath=...')` unless it is a scoped/relative XPath with an explanatory comment justifying why no other locator strategy works.
   - **POM boundary**: spec files (`tests/**/*.spec.ts`) must not call `page.locator(...)` or `page.getByX(...)` directly, except when instantiating a Page Object. Any raw locator usage in a spec is a violation.
   - **POM structure**: new page/component interactions must live in a Page Object under `pages/`, exposing intention-revealing methods rather than raw locator getters.
3. Produce a findings list, each with: file path + line, rule violated, and a one-line suggested fix. Group by severity (blocking vs. minor).
4. If nothing violates the rules, say so explicitly rather than staying silent.
5. Only apply fixes if the user asks for them after seeing the findings.
