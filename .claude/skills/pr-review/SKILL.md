---
name: pr-review
description: Reviews changed or staged files in a PR against this project's CLAUDE.md rules (TypeScript only, locator priority, Page Object Model, API-layer conventions), scans for hardcoded secrets, flags over-engineering, and confirms the pre-push flakiness check was run. Use when the user asks to review a PR, review changes, or check compliance before committing/pushing.
---

# PR / Change Review

Checks the current diff (or a specified PR) against this repository's [CLAUDE.md](../../../CLAUDE.md) rules and the conventions the existing suite already follows (Page Object Model for UI, the `api/*.api.ts` wrapper pattern for API calls). Folds in the checklists from the other project skills so one pass covers style, architecture, and security. Reports findings — does not auto-fix unless asked.

## Steps

1. **Scope**: `git diff` / `git diff --staged` for local changes, or fetch the PR's changed files via the GitHub MCP server (`pull_request_read`) if a PR number/URL is given. Group changed files by area: `tests/ui/**`, `tests/api/**`, `pages/**`, `api/**`, `types/**`, `fixtures/**`.

2. **Language & typing** (every changed `.ts` file):
   - File extension is `.ts`, never `.js`/`.jsx`.
   - No untyped `any` for data shared across tests (fixtures, DTOs, config) — flag missing interfaces/types.
   - New request/response or fixture shapes belong in `types/**`, not inlined ad hoc.

3. **UI locators & POM** (`tests/ui/**`, `pages/**`):
   - No absolute XPath (`/html/body/...`). A scoped/relative XPath is only acceptable with a comment explaining why no other locator strategy works.
   - Locator priority: `getByRole` > `getByLabel`/`getByPlaceholder` > `getByText` > `getByTestId`.
   - Spec files (`tests/**/*.spec.ts`) must not call `page.locator(...)`/`page.getByX(...)` directly, except when instantiating a Page Object.
   - New page/component interactions live in a Page Object under `pages/`, exposing intention-revealing methods (e.g. `login(username, password)`), not raw locator getters.

4. **API layer** (`tests/api/**`, `api/**`):
   - Specs use the `request` fixture, never `page`, and never go through a Page Object.
   - Raw `request.get/post/patch/delete` calls belong inside a class under `api/` (mirroring [api/GoRestUser.api.ts](../../../api/GoRestUser.api.ts)) with intention-revealing methods (e.g. `create`, `expectNotFound`); spec files call those methods, not `request.*` directly.
   - Status-code assertions live inside the API class, not scattered across specs.
   - If an endpoint requires auth for writes, confirm both the authorized path and an explicit unauthorized/rejection path are tested.
   - If schema validation is introduced, follow the `api-contract-testing` skill's convention (types in `types/api/<resource>.ts`, schemas under `tests/api/schemas/`, status asserted before body).

5. **Fixtures & authentication** (`fixtures/**`):
   - Tests needing a logged-in session use the shared `authenticatedPage` fixture (`fixtures/auth.fixture.ts`), not a per-test/per-file reimplementation of login.
   - New shared fixtures follow the same worker-scoped pattern (once per worker, hand each test its own `page`) rather than reintroducing a separate Playwright "setup project" writing `storageState` to disk — see CLAUDE.md's "Authentication" section.
   - Flag any change that reintroduces a single shared/fixed test account for a state-mutating flow (cart, orders, etc.) instead of a fresh account per worker — that's the exact pattern that caused real flaky failures here (concurrent workers corrupting each other's cart).

6. **Secrets** — apply the [no-secrets-in-code](../no-secrets-in-code/SKILL.md) checklist: real service credentials (API tokens, keys) must never be hardcoded and must flow through `process.env.*` sourced from a gitignored `.env`; flag any `.env`-like file staged for commit. Per CLAUDE.md's "Test Credentials & Secrets" rule, credentials for a shared public demo/test account with no real access behind them (e.g. the BearStore login) are not secrets and are expected as plaintext — don't flag those. Never echo a discovered real secret value back in full.

7. **Accessibility specs**, if any changed under `tests/a11y/**`: reuse existing Page Objects to reach state (no duplicated navigation logic), per the `accessibility-audit` skill.

8. **Over-engineering**: flag additions that exceed what the change actually needs —
   - A new abstraction, helper, config option, or base class backing only one caller or one test.
   - Generic/parameterized solutions built for hypothetical future cases the PR doesn't exercise.
   - Extra error handling, fallbacks, retries, or validation for conditions that can't occur here (e.g. guarding internal test helpers against inputs no caller ever passes).
   - Unused exports, unused parameters, or scaffolding left over from an approach that was later simplified.
   - Ask "would three similar lines have been simpler than this abstraction?" — if yes, flag it.

9. **Pre-push flakiness check**: per CLAUDE.md's "Before Pushing" rule, the new or modified spec file(s) — not the full suite — must be run at least 3× (e.g. `npx playwright test tests/api/goRestUser.spec.ts --repeat-each=3`) with every run green before this change is pushed. If the user hasn't stated this was done, ask them to run it (or run it yourself, scoped to the changed spec files) rather than approving on a single green run — treat any inconsistent run as a real defect to fix, not something to retry past.

10. **Report**: findings list, each with file path + line, rule violated, and a one-line suggested fix. Group by severity (blocking vs. minor). If nothing violates the rules, say so explicitly rather than staying silent. Only apply fixes if the user asks for them after seeing the findings.
