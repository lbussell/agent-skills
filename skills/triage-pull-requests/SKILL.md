---
name: triage-pull-requests
description: >-
  Triage open pull requests in a repository into actionable categories: ready to merge, needs review, needs action, stale, waiting. Use for daily PR triage to quickly identify what needs attention.
user-invocable: true
disable-model-invocation: true
---

## Workflow

### Step 1: List open pull requests

```shell
gh pr list
```

### Step 2: Investigate each PR

For each open PR, gather its full context:

- **Review & merge status:** `gh pr view <number>`
- **CI status:** Use the `investigating-pull-request` skill to check pipeline status.

For PRs with CI failures, use the `investigating-pipeline` skill to read task logs and identify root causes.

### Step 3: Correlate failures with recent pull requests and issues

- Check recent issues: `gh issue list --state all`
- Check recent pull requests: `gh pr list --state merged`

### Step 3: Categorize and present results

Using everything you've learned, place each PR into **one** of these categories (in this priority order):

1. **Ready to Merge** — Approved, CI passing, no merge conflicts
2. **Needs Your Review** — `lbussell` is a requested reviewer
3. **Needs Author Action** — Changes requested, CI failing, or merge conflicts
4. **Stale** — No updates in 7+ days and not ready to merge
5. **Waiting** — CI in progress, awaiting reviews from others, recently updated drafts, etc.

Use your judgment when things are ambiguous. For example:
- A PR with only flaky-test failures might still be ready to merge
- A draft PR from the user that hasn't been touched in weeks is stale even if CI is green

For "Needs Author Action" PRs with CI failures, include the root cause diagnosis.

End with a recommended next action.
