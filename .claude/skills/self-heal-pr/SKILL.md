---
name: self-heal-pr
description: Diagnoses and fixes failing Playwright checks on a pull request by reusing this project's fix-test workflow, then asks for approval before pushing the fix back to the PR branch. Limited to one attempt per PR and same-repo (non-fork) branches only. Use when the user asks to self-heal a PR, fix a red PR, or auto-fix failing CI checks on a pull request.
---

# Self-Heal PR

Manually-triggered helper that takes a PR with failing "Playwright Tests" CI checks, diagnoses each failure the same way [fix-test](../fix-test/SKILL.md) does, and — only for genuine test/Page Object bugs — proposes and (with the user's approval) pushes a fix back to the PR branch. This is not automatic background behavior: it is invoked explicitly per PR, and it always stops for the user's go-ahead before committing or pushing, per this repo's standing "confirm before commit/push" rule.

## Guardrails (do not bypass)

- **Same-repo branches only.** Before doing anything else, confirm the PR's head branch is in this repository (`gh pr view <n> --json isCrossRepository` is `false`). Refuse and stop for a fork/cross-repo PR — running fixer logic against externally-controlled branches with access to CI secrets (`GOREST_TOKEN`) is a secret-exfiltration risk.
- **One attempt per PR.** Check `git log` on the PR branch for a prior commit whose message starts with `self-heal:`. If one already exists and the Playwright Tests check is still failing, stop — do not attempt a second auto-fix. Report this to the user and leave it to a human.
- **Always confirm before push.** Never run `git commit` / `git push` on a PR branch without showing the user the diff and getting explicit approval first, even after a successful 3x re-verify.
- **Test-side fixes only.** Never edit application/product code to make a test pass. If diagnosis points to a real app regression, do not modify anything — report it instead (see Steps).

## Steps

1. **Resolve the PR**: take the PR number from the skill argument; if none given, infer it from the current branch via `gh pr view --json number,headRefName,isCrossRepository,headRepositoryOwner`.
2. **Guardrail checks**: run the same-repo check and the one-attempt check above. Stop immediately (no code changes) if either fails, and tell the user why.
3. **Identify the failure**: find the failing Playwright Tests run for the PR's head commit (`gh pr checks <n>`, then `gh run view <run-id> --log-failed`) and extract which spec file(s) failed and the actual error (assertion diff, timeout, thrown exception) — don't guess from the file alone.
4. **Fetch and check out** the PR branch locally (`gh pr checkout <n>`).
5. **Diagnose and fix each failing spec** using the exact process in [fix-test](../fix-test/SKILL.md#steps) (steps 2-4): classify as test/Page Object bug, real app regression, or environment/flake; fix only test-side bugs, following this repo's locator/POM/typing rules; re-verify each fixed spec at least 3x (`--repeat-each=3`) and confirm every run is green.
6. **If everything failing was a test-side bug and all fixes are verified green**: show the user the diff and a summary (original failure → root cause → fix), and ask for explicit approval to commit and push. Only after approval, commit with a message prefixed `self-heal:` (e.g. `self-heal: fix stale locator in cart.spec.ts`), including the standard Claude attribution trailer, and push to the PR branch.
7. **If any failure is a real app regression** (or diagnosis is inconclusive): do not edit code. Instead, with the user's approval, post a PR comment (`gh pr comment <n>`) explaining which spec(s) look like a genuine app regression and why, so a human investigates.
8. **Report** to the user regardless of outcome: what was diagnosed, what was fixed vs. flagged, and whether anything was pushed or commented.
