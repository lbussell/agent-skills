# Avoid unnecessary nesting

Nested constructors make code hard to read.
Prefer to have many expressions stand on their own if possible.
It helps the code read more linearly.

---

Bad:

```cs
BuildPolicyResult[] results = await Task.WhenAll(
    policies.Select(policy => policy.EvaluateAsync(context, cancellationToken)));
```

Good:

```cs
var policyTasks = policies.Select(policy => policy.EvaluateAsync(context, cancellationToken));
BuildPolicyResult[] var policyResults = await Task.WhenAll(policyTasks);
```

---

Bad:

```cs
BuildPlanItem[] plan = await _buildPlanner.CreatePlanAsync(
    graph,
    imageArtifactDetails,
    new CompositeBuildPolicy(...));
```

Good:

```cs
var policy = new CompositeBuildPolicy(...);
BuildPlanItem[] plan = await _buildPlanner.CreatePlanAsync(graph, imageArtifactDetails, policy);
```
