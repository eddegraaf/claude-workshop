# claude-workshop

Playwright + TypeScript QA automation workshop project. Project rules (TypeScript-only, no absolute XPath, Page Object Model) live in [CLAUDE.md](CLAUDE.md).

## Setup

```bash
npm install
npx playwright install --with-deps
cp .env.example .env   # then set GOREST_TOKEN, required for the `api` project
```

## Scripts

| Command                | Purpose                          |
| ---------------------- | -------------------------------- |
| `npm test`             | Run the Playwright test suite    |
| `npm run lint`         | Lint with ESLint                 |
| `npm run lint:fix`     | Lint and auto-fix                |
| `npm run format`       | Format with Prettier             |
| `npm run format:check` | Check formatting without writing |
| `npm run typecheck`    | Type-check with `tsc --noEmit`   |

A pre-commit hook (Husky + lint-staged) runs lint, format, and typecheck automatically before each commit.
