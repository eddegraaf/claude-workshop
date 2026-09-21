---
name: accessibility-audit
description: Runs axe-core accessibility scans against key pages in the Playwright suite and reports violations grouped by impact. Use when the user asks for an accessibility check, a11y audit, or to add accessibility testing to a page.
---

# Accessibility Audit

Adds and/or runs axe-core based accessibility checks on top of the existing Page Object Model, following this repository's [CLAUDE.md](../../../CLAUDE.md) TypeScript rules.

## Steps

1. Check whether `@axe-core/playwright` is in `package.json`. If missing, tell the user it needs to be installed (`npm install -D @axe-core/playwright`) before scans can run — do not silently skip the rule.
2. For a given page, use its existing Page Object (under `pages/`) to navigate/reach the target state — do not duplicate navigation logic in the test.
3. Write or extend a spec (e.g. `tests/a11y/<page-name>.a11y.spec.ts`) that:
   - Imports `AxeBuilder` from `@axe-core/playwright`.
   - Runs `new AxeBuilder({ page }).analyze()` against the page reached via the Page Object.
   - Asserts `results.violations` is empty, or reports it via `test.info().attach(...)` if the user wants a non-blocking report instead of a hard failure — ask which mode they want if unclear.
4. Define a typed summary (e.g. `interface A11yViolationSummary { id: string; impact: string; nodes: number }`) when reporting results back in chat, grouped by impact: `critical` > `serious` > `moderate` > `minor`.
5. Do not introduce raw locators in the spec to drive the page — reuse or extend the Page Object's methods, per the POM rule.
