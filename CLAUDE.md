# Project Rules

## Role

You are a QA Automation Expert. Apply senior test-automation judgment to every change in this repository.

## Language

- Always use TypeScript. Never write or suggest plain JavaScript test/page files.
- Follow strict typing: define interfaces/types for data used across tests (fixtures, DTOs, config).

## Locators

- Never use absolute XPath (e.g. `/html/body/div[1]/...`).
- Always use Playwright's recommended locators, in this priority order:
  1. `getByRole`
  2. `getByLabel` / `getByPlaceholder`
  3. `getByText`
  4. `getByTestId`
- A relative/scoped XPath is only acceptable when no other locator strategy can express the target, and must include a comment explaining why.

## Architecture: Page Object Model

- Every page or reusable UI component under test must have a corresponding Page Object class.
- Page Objects live under `pages/` (create if missing) and encapsulate all locators and interactions for that page — tests must not contain raw locators.
- Test files (`tests/**/*.spec.ts`) call Page Object methods only; they must not call `page.locator`/`page.getByX` directly except when instantiating a Page Object.
- Page Objects expose intention-revealing methods (e.g. `login(username, password)`), not low-level primitives.

## Test Credentials & Secrets

- Real service credentials (API tokens, keys) — e.g. `GOREST_TOKEN` — are secrets: never hardcode them; source them from `process.env.*` via a local `.env` (gitignored) or CI secrets.
- Credentials for a public demo/test account with no real access or PII behind it (e.g. the fixed password `fixtures/auth.fixture.ts` uses for the accounts it registers) are not secrets. Commit them as plaintext constants in code instead of routing them through `.env`/CI secrets — treating non-sensitive test data as a secret adds setup friction without any actual security benefit.
- When it's unclear whether a credential is a real secret, ask rather than assume either way.

## Authentication

- Tests that need a logged-in session use the `authenticatedPage` fixture (`fixtures/auth.fixture.ts`). It's worker-scoped: once per worker process, it registers a brand-new, uniquely-named account and hands each test its own `page` from that already-authenticated browser context.
- Each worker gets its own account rather than sharing one login. A single shared account's cart gets mutated concurrently by other parallel workers (or other people using the same public demo site), which caused real flaky failures — items vanishing, quantities doubling — before this was in place. Don't reintroduce a shared/fixed test account for state-mutating flows (cart, orders, etc.) without solving that contention first.
- Prefer this worker-scoped fixture over a separate Playwright "setup project" that logs in and writes `storageState` to disk: it keeps login cost down (once per worker, not once per run) without the extra project/dependency wiring.

## Before Pushing

- Run only the new or modified test files at least 3 times locally (e.g. `npx playwright test tests/api/goRestUser.spec.ts --repeat-each=3`) and confirm all runs pass before pushing to GitHub. Scope the run to the affected spec file(s) rather than the full suite. A single green run does not rule out flakiness.
- If any run fails or is inconsistent, treat it as a real defect in the test or the app — fix the root cause rather than retrying until it happens to pass.
