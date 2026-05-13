---
name: creating-issues
description: >-
  Open an issue on GitHub. Use when the user asks to file/open/draft/create an
  issue. Useful for bug reports, pipeline failures, feature requests, etc.
---

## Workflow

1. Gather the target repository, issue type, and relevant evidence.
2. Draft a title and body using the style guide below.
3. Confirm the draft contents with the user.
4. Create the issue with `gh issue create --repo <owner/repo> --title "<title>" --body "<body>"`.

## Style guide

Write issues in a direct, actionable style:

- Use a concise title naming the affected component and desired outcome or failure, e.g. `Validate signatures before publishing images`.
- Start the body with the current state, failure, or motivation. Prefer concrete openers like `Currently, ...`, `The <workflow> is failing ...`, or `I like <tool>, and it would be easier if ...`.
- Include evidence immediately after the opener: exact links to runs, PRs, code lines, screenshots, commands, or error text.
- If the cause is known, explain it briefly with `This means ...`, `That does not satisfy ...`, or `The <label/setting> is only added when ...`.
- End with the requested behavior using `We should ...`, `Instead, ...`, or `This would ...`.
- Keep paragraphs short. Use bullets for examples, alternatives, or affected items. Do not use checklists unless the user explicitly asks for one.
- Use backticks for code identifiers, labels, commands, config keys, file names, branch names, and literal issue text.
- Avoid filler, speculation, and long background. If the root cause is unknown, say what needs investigation instead of guessing.

## Bug or failure report style

Use this style for broken behavior, CI failures, regressions, automation bugs, and usability failures.

````markdown
<Current behavior or symptom in one sentence.>

<Evidence link, screenshot, code link, or failing run.>

```text
<Exact error text, if available.>
```

<Brief root cause or why this is actionable, if known.>

<Expected behavior or requested fix.>
````

Notes:

- Lead with the failure, not the proposed fix, unless the fix is obvious.
- Include the smallest useful evidence: exact workflow run, job, PR, source line, screenshot, or failing command.
- For auto-generated or recurring failures, explain whether the issue should stay open, deduplicate, notify differently, or update metadata.
- If multiple items are affected, list them as bullets after the evidence.

## Feature request style

Use this style for enhancements, workflow improvements, distribution requests, validation hardening, and policy changes.

````markdown
<Motivation or current limitation in one short paragraph.>

<Proposed change using "We should ..." or "Instead, ...".>

<Concrete examples, commands, configuration, or implementation direction.>

<Constraints, tradeoffs, or rollout notes, if relevant.>
````

Notes:

- Make the benefit explicit: easier installation, fewer duplicate issues, safer publishing, better readability, stronger validation.
- Prefer a concrete proposal over an abstract wish. Include commands or sample config when the request changes user workflow.
- Mention opt-in behavior, compatibility limits, or security requirements when they materially affect implementation.

## Examples

**Bug/failure report**

````markdown
The `check-markdown-links` workflow is failing during action setup before link checking runs.

Failure from PR #7175: https://github.com/example/repo/actions/runs/123/job/456

```text
The action example/action@sha is not allowed because all actions must match the allowed-actions policy.
```

The workflow uses `example/action@v1`, which attempts to fetch `example/action` by SHA. That does not satisfy the current allowed-actions policy, so the workflow cannot run successfully.
````

**Feature request**

```markdown
Currently, every failure creates a new GitHub issue. If the same failure occurs repeatedly, duplicate issues accumulate.

Instead, `NotificationService` should detect an existing open issue for the same failure and update it rather than opening a new one.

A deduplication key, such as subscription name or manifest/repo, could be added to the notification metadata.
```
