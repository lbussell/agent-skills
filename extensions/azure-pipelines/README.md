# Azure pipelines canvas

Monitor one or more Azure DevOps pipeline runs from Copilot. The canvas shows
pipeline, stage, and job status and notifies the agent when a run completes.

## Setup

Install Azure CLI and sign in with an identity that can read the pipelines:

```powershell
az login --tenant <tenant-id> --allow-no-subscriptions
```

If authentication expires or requires MFA, sign in again and click **Refresh**.

## Use

Open the **Azure pipelines** canvas and paste one or more Azure DevOps
build-results URLs. Agents can also use these canvas actions:

- `watch`: Add pipeline URLs to the monitor.
- `unwatch`: Remove pipeline URLs from the monitor. This does not stop the pipeline.
- `status`: Read stage and job status.
- `refresh`: Update all watched runs immediately.

The monitor checks active runs every 30 seconds. Completed runs remain visible
but are no longer polled automatically. Monitoring continues while the panel is
closed, but the Copilot session must remain running.
