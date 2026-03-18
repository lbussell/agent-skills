---
name: triage-pipelines
description: >-
  List all failing and warning Azure Pipelines for daily triage. Checks preconfigured pipeline folders and reports any with failed or warning builds. Use for daily pipeline health checks.
---

## Workflow

### Step 1: List failing pipelines

```shell
# Get failing pipelines for the current repo.
dotnet scripts/GetFailingPipelines.cs

# (Optionally) override auto-detected values
dotnet scripts/GetFailingPipelines.cs --org myorg --azdo-project myproject --folder owner/repo
```

### Step 2: Investigate each failure

For each failing pipeline in the output, use the `investigating-pipeline` skill with the build ID to see the timeline and read task logs.

### Step 3: Correlate failures with recent pull requests and issues

- Check recent issues: `gh issue list --state all`
- Check recent pull requests: `gh pr list --state all`

Look for the following things:

- Is there a recent change that obviously caused this failure?
- Is this failure a known issue?
- Is there already a pull request open that addresses the failure?
