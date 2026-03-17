---
name: triage-pull-requests
description: >-
  Reviews the CI status of all open pull requests in a repository. Lists open PRs via the GitHub
  CLI, then checks each one's pipeline status. Use for daily PR triage to identify PRs with failing
  CI that need attention.
user-invocable: true
disable-model-invocation: true
---

## Workflow

### Step 1: Detect the repository

```shell
gh repo set-default --view
```

Use the output as the `--repo` value in subsequent commands. If no default is set, ask the user to run `gh repo set-default` first.

### Step 2: List open pull requests

```shell
gh pr list --repo <detected_repo> --state open --json number,title,author,headRefName
```

### Step 3: Check each PR's pipeline status

For each open PR, run the `GetPullRequestStatus.cs` script from the `investigating-pull-request` skill:

```shell
dotnet skills/investigating-pull-request/scripts/GetPullRequestStatus.cs <number> --repo <detected_repo>
```

### Step 4: Focus on failures

Prioritize PRs where pipeline runs show `Failed` results. For each failing build, use the `investigating-pipeline` skill to read task logs and diagnose the root cause.
