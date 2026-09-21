---
name: test-scaffold-generator
description: Generates a Playwright TypeScript spec file plus a matching Page Object class skeleton for a given page or user flow, following this project's POM and locator rules. Use when the user asks to create a new test, scaffold a test for a page/flow, or add a Page Object.
---

# Test Scaffold Generator

Scaffolds a new test + Page Object pair that complies with this repository's [CLAUDE.md](../../../CLAUDE.md) rules.

## Steps

1. Determine the target page/flow. If the user gave a URL or component name, use it; otherwise ask for the page name and the key user actions to support (e.g. "login", "search", "add to cart").
2. Derive a PascalCase page name (e.g. `LoginPage`) and create `pages/<PageName>.page.ts`:
   - A class named `<PageName>Page` with a `constructor(private readonly page: Page)`.
   - Locators declared as `readonly` class fields using `getByRole` / `getByLabel` / `getByPlaceholder` / `getByText` / `getByTestId`, in that priority order. Never use absolute XPath.
   - Intention-revealing public methods (e.g. `login(username: string, password: string): Promise<void>`, `expectErrorMessage(text: string): Promise<void>`) — no low-level locator getters exposed to tests.
   - Define a TypeScript interface/type for any structured input data (e.g. `LoginCredentials`).
3. Create `tests/<flow-name>.spec.ts`:
   - Import and instantiate the Page Object; the spec must call only Page Object methods, never `page.locator`/`page.getByX` directly.
   - Use Playwright fixtures (`test`, `expect`) and web-first assertions (`expect(locator).toBeVisible()`, etc.) inside the Page Object's own assertion helpers where practical.
   - Cover the golden path plus at least one edge/error case the user described.
4. If a `pages/` directory does not exist yet, create it.
5. Report back the two files created and any assumptions made about locators (since the actual DOM was not inspected), flagging them as `TODO: verify locator` where guessed.
