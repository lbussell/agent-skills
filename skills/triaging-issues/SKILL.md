---
name: triaging-issues
description: >-
  Triage issues labeled 'untriaged' in a repository. Investigates each issue, correlates with recent
  activity, and categorizes into: customer issue, ready for work, needs investigation, or already
  addressed. Informational only — does not modify issues.
user-invocable: true
disable-model-invocation: true
---

**Important: This skill is informational only. Do not modify issues, apply labels, assign users, post comments, or close issues.**

## Workflow

### Step 1: List untriaged issues

```shell
gh issue list --label untriaged
```

### Step 2: Investigate each issue

For each untriaged issue, gather its full context:

- **Issue details:** `gh issue view <number>`
- **Comments:** `gh issue view <number> --comments`
- **Related PRs:** Check if any open or recently merged PRs reference the issue.

### Step 3: Correlate with recent activity

- Check recent pull requests: `gh pr list --state all`
- Check recent issues: `gh issue list --state all`

Look for:

- Is there an open or recently merged PR that fixes this issue?
- Is this a duplicate of an existing issue?
- Is this related to a known pipeline or infrastructure failure?

### Step 4: Categorize and present results

Place each issue into **one** of these categories (in this priority order):

1. 🔷 **Customer Issue** — A product issue affecting users or customers, not an infrastructure or pipeline problem. These follow a separate triage process.
2. 🟢 **Ready for Work** — Well-defined problem with a known or straightforward root cause. Can be picked up and worked on immediately.
3. 🔍 **Needs Investigation** — Looks valid but needs reproduction, root-cause analysis, more information from the reporter, or further research before work can begin.
4. ✅ **Already Addressed** — Likely fixed by a recent PR or commit, is a duplicate of another issue, or is no longer relevant. Can probably be closed.

Use your judgment when things are ambiguous. For example:

- An issue describing unexpected behavior in a published image from an end-user's perspective is a **Customer Issue**, even if the root cause turns out to be infrastructure.
- An auto-generated publish-result issue from pipeline infrastructure is **not** a customer issue — categorize based on its actionability.
- An issue that has a linked merged PR but hasn't been closed yet is likely **Already Addressed**.
- An issue with a clear error message and obvious fix is **Ready for Work**, even if no one has reproduced it yet.

For each issue, include:

- Issue number and title
- Category with emoji
- A brief summary of what the issue is about
- Why you chose that category
- Suggested next step (e.g., "investigate root cause", "verify fix in PR #123", "needs repro steps from reporter")

End with a recommended prioritization of which issues to tackle first.
