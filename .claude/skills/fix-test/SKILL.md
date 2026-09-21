---
name: fix-test
description: Diagnoses and fixes a failing or erroring Playwright test, distinguishing a test/Page Object bug from a real app regression, then re-verifies the fix per this project's pre-push flakiness check. Use when the user asks to fix a broken/failing test, investigate a red spec, or debug a test error.
---

# Fix Test

Fixes a failing or erroring test in compliance with this repository's [CLAUDE.md](../../../CLAUDE.md) rules. Reports the diagnosis before editing anything.

## Steps

1. **Reproduce**: identify the failing spec file. If the user didn't paste failure output, run it (e.g. `npx playwright test tests/ui/cart.spec.ts`) and capture the actual error — assertion diff, timeout, or thrown exception. Don't guess at the cause from the file alone.
2. **Diagnose root cause** before touching code. Classify the failure as one of:
   - **Test/Page Object bug**: stale or wrong locator, wrong assertion, race condition (missing web-first assertion / awaiting the wrong thing), wrong test data, or a fixture misuse (e.g. bypassing `authenticatedPage`).
   - **Real app regression**: the app's actual behavior changed and the test correctly caught it — the fix belongs in the app, not the test. If this is the case, stop and tell the user rather than editing the test to match broken behavior.
   - **Environment/flake**: e.g. the concurrency contention pattern already documented in CLAUDE.md's "Authentication" section (shared account state mutated across workers). If the failure looks like this, check whether the test already uses the worker-scoped `authenticatedPage` fixture rather than a shared/fixed account.
3. **Fix**, scoped to the actual cause:
   - Locator/UI fixes go in the relevant Page Object under `pages/`, following the locator priority order (`getByRole` > `getByLabel`/`getByPlaceholder` > `getByText` > `getByTestId`), never absolute XPath.
   - Spec files keep calling Page Object methods only — do not "fix" a test by inlining a raw `page.locator`/`page.getByX` call into the spec.
   - Preserve existing TypeScript types/interfaces; don't loosen typing (e.g. `any`) to make an error disappear.
   - Never fix a flaky assertion by adding an arbitrary `page.waitForTimeout(...)` — use a web-first assertion or wait for the specific state that was actually racing.
   - Do not weaken or delete an assertion just to make the test pass — that hides a real bug rather than fixing one.
4. **Re-verify** per CLAUDE.md's "Before Pushing" rule: run only the fixed spec file at least 3× (e.g. `npx playwright test <file> --repeat-each=3`) and confirm every run is green. If any run fails or is inconsistent, treat it as a real defect and keep root-causing — do not retry until it happens to pass.
5. **Report**: the original failure, the root cause identified, the exact change made (file + what changed), and confirmation of the 3× green re-run. If the root cause turned out to be an app regression rather than a test bug, say so explicitly and stop instead of forcing a code change.
