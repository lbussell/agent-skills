---
name: formatting-pull-request
description: Pull request formatting guide. Use when submitting a pull request.
---

# Formatting pull requests

Read the the full diff and any linked/related issues before writing.

## Title

- Use an imperative verb in sentence case: `Add`, `Fix`, `Update`, `Use`, `Preserve`, or another precise action.
- Name the concrete outcome, not the files changed or the work performed.

## Description

Match the length to the change.
Routine updates may only need one sentence.
A complex behavior change should explain enough for a reviewer to understand the problem, the chosen fix, and any important tradeoffs.

Write in this order:

1. State the context or problem in one or two direct sentences.
2. Explain what changed and why it solves the problem.
3. Use bullets for multiple concrete changes, versions, or links. Use present tense.
4. Add an issue relationship with `Fixes #123`, `Part of #123`, or `Related:` when one exists.

Never include details about what tests you ran or what commands you ran for validation.
Checks/tests run as part of PR validation.
If you ran a pipeline for validation, link to that.

Only use headings for exceptionally long descriptions or large features.
If you use headings, use only one level and start with H3.

## Flexible template

```markdown
<Context or problem>

This PR <present tense description of what changed and why>

- <Concrete detail>
- <Concrete detail>

<Fixes #123 or Related links>
```

Delete unused parts of the template.
