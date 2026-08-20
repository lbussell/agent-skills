# Line length

Lines under 120 characters don't need extra levels of nesting.
Especially when there is only one expression involved.

---

Bad

```cs
return _buildPlanner.CreatePlanAsync(
    graph,
    publishedImages,
    policy);
```

Good

```cs
return _buildPlanner.CreatePlanAsync(graph, publishedImages, policy);
```

---

Bad:

```cs
public sealed record BuildReason(
    string Message,
    BuildReason? Cause = null);
```

Good:

```cs
public sealed record BuildReason(string Message, BuildReason? Cause = null);
```
