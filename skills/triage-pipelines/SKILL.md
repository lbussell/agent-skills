---
name: triage-pipelines
description: >-
  Lists all failing and warning Azure Pipelines for daily triage. Checks preconfigured pipeline
  folders and reports any with failed or warning builds. Use for daily pipeline health checks.
---

## Workflow

### Step 1: List failing pipelines

```shell
dotnet scripts/GetFailingPipelines.cs
```

### Step 2: Investigate each failure

For each failing pipeline in the output, use the `investigating-pipeline` skill with the build ID to see the timeline and read task logs.
