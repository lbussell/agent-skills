---
name: triage-pipelines
description: >-
  Lists all failing and warning Azure Pipelines across configured pipeline folders for daily triage.
  Reads a pipelines.json config file or accepts CLI args for a single query. Use for daily pipeline
  health checks.
---

## Configuration

Create a `pipelines.json` file listing the Azure DevOps locations to monitor:

```json
[
  { "org": "myorg", "project": "myproject", "folder": "my-repo" },
  { "org": "myorg", "project": "public", "folder": "my-repo" }
]
```

## Workflow

### Step 1: List failing pipelines

```shell
# Use the config file (defaults to pipelines.json in cwd)
dotnet scripts/GetFailingPipelines.cs

# Use a custom config file path
dotnet scripts/GetFailingPipelines.cs --config /path/to/pipelines.json

# Single query without a config file
dotnet scripts/GetFailingPipelines.cs --org myorg --azdo-project myproject --folder my-repo
```

### Step 2: Investigate each failure

For each failing pipeline in the output, use the `investigating-pipeline` skill with the build ID to see the timeline and read task logs.
