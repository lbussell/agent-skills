# Nested expressions

Do not put complicated expressions in the definition of `for`/`while` loops.

---

Bad:

```cs
foreach (IGrouping<RepoInfo, BuildPlanItem> repoPlan in executableItems
    .GroupBy(item => item.Target.Repo))
{
    // ...
}
```

Good:

```cs
var repoPlans = executableItems.GroupBy(item => item.Target.Repo);

foreach (IGrouping<RepoInfo, BuildPlanItem> repoPlan in repoPlans)
{
    // ...
}
```
