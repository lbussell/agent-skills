---
name: creating-pull-requests
description: >-
  Open a pull request on GitHub. Use when the user asks to open or create a
  pull request on GitHub.
---

## Workflow

1. Inspect the branch diff and target repository context.
2. Determine the PR style: simple change, bug/failure fix, or feature/tooling change.
3. Draft a concise title and body using the style guide below.
4. Confirm the draft PR details (title, description, target branch) with the user.
5. Create the PR with `gh pr create --title "<title>" --body "<body>"`, adding `--base`, `--head`, `--repo`, or `--draft` when needed.

## Style guide

Write PRs in a direct, reviewer-oriented style:

- Use concise imperative titles: `Add ...`, `Fix ...`, `Remove ...`, `Replace ...`, `Update ...`, `Temporarily disable ...`, etc.
- Lead with what changed or what problem is fixed. Prefer openers like `This PR adds ...`, `This PR fixes ...`, `Removes ...`, or `<component> is EOL ...`.
- Explain why the change exists when it is not obvious. Include root cause, links to prior PRs and issues, compatibility constraints, or release context.
- Use short paragraphs. Use bullets for change lists, affected items, related issues, and compatibility notes.
- Include testing or evaluation only when it adds useful reviewer signal. For performance or tooling changes, include before/after numbers or sample output.
- Keep trivial PR bodies to one sentence. Empty bodies are acceptable only for personal or throwaway PRs whose title fully explains the change.
- Use backticks for code identifiers, commands, branch names, package names, file names, and literal settings.
- Do not use checklists unless the PR template requires one.

## Simple change style

Use this for small, self-contained fixes or cleanup.

```markdown
<One sentence describing what changed.>

<Optional second sentence explaining why, linking an issue, or calling out temporary scope.>
```

## Bug or failure fix style

Use this for test failures, CI failures, regressions, or behavior fixes.

```markdown
This PR fixes <issue or failing behavior>.

The root cause is <brief cause>.

This PR contains several changes:
- <Change 1>
- <Change 2>
- <Change 3>

<Optional note about scope, limitations, or the long-term fix.>
```

## Feature or tooling change style

Use this for new tools, docs, scripts, repo settings, or agent/Copilot changes.

````markdown
## Background

<Problem, motivation, or current limitation.>

## Changes

This PR changes the following:
- <Change 1>
- <Change 2>
- <Change 3>

## Evaluation

<Before/after data, testing notes, or example output when useful.>

```console
<Representative output, if useful for reviewers.>
```
````

## Examples

**Simple change**

```markdown
Removes the leftover `Microsoft.Deployment.DotNet.Releases` package reference from ImageBuilder.

This dependency was originally added for EOL annotation data generation. The EOL handling was later removed, leaving the package reference unused.
```

**Bug/failure fix**

```markdown
This PR fixes digest validation test failures.

The root cause is that the previous validation used an unanchored regex, which allowed invalid digest strings and caused multiple tests to fail.

This PR contains several changes:
- Added `AnchoredDigestRegexp` to capture the encoded value and algorithm.
- Moved digest format validation into `DigestUtils`.
- Updated tests to target `DigestUtils` directly.

The long-term fix is to use the ORAS .NET library for registry interaction, but this keeps the current implementation passing and closer to the OCI spec.
```

**Feature or tooling change**

```markdown
## Background

The existing Copilot settings were adding context and tools that are not needed for every task.

## Changes

This PR changes the following:
- Removed automatic plugin installation.
- Added an MOTD explaining how to install the plugin manually.
- Added local settings to `.gitignore` so the behavior can be overridden locally.
```
