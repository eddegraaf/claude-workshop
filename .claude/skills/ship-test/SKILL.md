---
name: ship-test
description: End-to-end pipeline that scaffolds a new Playwright test, reviews and fixes it against this project's rules, opens a PR, and runs self-heal-pr against it if CI comes back red. Use when the user asks to add a test and ship it, create a PR for a new test, or fully automate adding+reviewing+PR'ing a test.
---

# Ship Test

Chains four existing skills into one pipeline for taking a page/flow from "no test" to "PR with green CI":
[add-test](../add-test/SKILL.md) → [pr-review](../pr-review/SKILL.md) (with fixes applied) → PR creation → [self-heal-pr](../self-heal-pr/SKILL.md).

**This skill is a declared, scoped exception to the repo's standing "always confirm before commit/push" rule.** Once invoked, it runs end-to-end with no approval gate: it pushes the initial commit and opens the PR on its own, and — if CI comes back red — it also runs self-heal-pr's fix-and-push without stopping for self-heal-pr's own approval gate. self-heal-pr's other guardrails (same-repo check, one-attempt-per-PR limit) are safety limits, not approval gates, and still apply in full. Outside of ship-test, self-heal-pr run on its own still asks for approval as documented in its own skill — this exception only holds inside this pipeline.

## Steps

1. **Scaffold**: follow [add-test](../add-test/SKILL.md#steps) exactly to create the spec file and Page Object for the target page/flow (from the skill argument, or ask the user for the page/flow if not given).

2. **Review**: apply the [pr-review](../pr-review/SKILL.md#steps) checklist (steps 2-9), scoped only to the files just created/modified in step 1 — not the whole repo.

3. **Fix**: unlike a standalone pr-review run, apply fixes directly for every finding that's actually fixable (locator priority, typing, POM violations, over-engineering, missing edge case, etc.) rather than just reporting them. If a finding needs a product decision only the user can make (e.g. the target page doesn't actually have a stable locator for something essential), stop and ask instead of guessing.

4. **Pre-push verification**: per CLAUDE.md's "Before Pushing" rule, run the new spec file at least 3x (`--repeat-each=3`) and confirm every run is green. Treat any failure or inconsistency as a real defect to fix, not something to retry past — this gates the rest of the pipeline.

5. **Push and open the PR**: create a branch (if not already on a dedicated one), commit, and push — no approval gate here (see the exception noted above). Check for a PR template (`pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE/`) and use it if present. Open the PR against `main` with `gh pr create`, including the standard Claude attribution trailer in the body.

6. **Wait for checks**: poll the PR's checks (`gh pr checks <n>`) until the "Playwright Tests" workflow finishes (it has a 60-minute timeout — poll at a reasonable interval, not tightly).

7. **If checks pass**: report success — the PR is green and ready for human review. Stop here.

8. **If checks fail**: run [self-heal-pr](../self-heal-pr/SKILL.md#steps) against this PR in full, including its guardrails (same-repo check, one-attempt limit) — but skip its approval-gate step (step 6 there) per the exception noted above, and push directly once its 3x re-verify is green.

9. **Report**: a summary of every phase — what was scaffolded, what the review found and fixed, the PR link, the CI outcome, and (if triggered) self-heal-pr's outcome.
