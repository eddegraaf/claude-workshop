---
name: api-contract-testing
description: Validates API responses against a schema (OpenAPI or JSON Schema) using Playwright's request context, alongside UI tests. Use when the user asks to add API tests, contract tests, or schema validation.
---

# API Contract Testing

Adds schema-validated API tests using Playwright's built-in `request` fixture, following this repository's TypeScript rules from [CLAUDE.md](../../../CLAUDE.md).

## Steps

1. Check whether a JSON Schema validation library is present (e.g. `ajv`). If missing, tell the user it needs to be installed (`npm install -D ajv`) — do not silently fall back to unchecked assertions.
2. Define TypeScript interfaces/types for each request and response DTO under a shared location (e.g. `types/api/<resource>.ts`), per the project's strict-typing rule.
3. Create schema files (or generate them from the TypeScript types) under `tests/api/schemas/<resource>.schema.json`.
4. Write specs under `tests/api/<resource>.spec.ts` using Playwright's `request` fixture (not `page`):
   - Call the endpoint via `request.get/post/...`.
   - Assert HTTP status first.
   - Validate the JSON body against the schema with `ajv`, asserting `validate(body) === true` and surfacing `validate.errors` on failure.
   - Assert key business fields explicitly in addition to schema shape (schema validation alone does not catch wrong values).
5. Keep API specs separate from UI specs (`tests/api/` vs `tests/`) so they can be run independently in CI; do not route API calls through Page Objects, since POM is for UI interactions only.
