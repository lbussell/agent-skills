# Spacing

Be generous with spacing. It makes code easier to read.

Expressions with extra nesting or indentation _must_ be followed by an empty new line.

---

Bad:

```cs
if (foo)
{
    Foo();
}
else if (bar)
{
    Bar();
}
if (baz)
{
    Baz();
}
```

Good:

```cs
if (foo)
{
    Foo();
}
else if (bar)
{
    Bar();
}

if (baz)
{
    Baz();
}
```

---

Bad:

```cs
ImageArtifactDetails? publishedImages = Options.ImageInfoSourcePath is not null
    ? ImageInfoHelper.LoadFromFile(Options.ImageInfoSourcePath, Manifest, skipManifestValidation: true)
    : null;
_buildGraph = BuildGraph.CreateFiltered(Manifest);
await ExecuteWithDockerCredentialsAsync(() => PullBaseImagesAsync(_buildGraph));
BuildPlanItem[] plan = await CreateBuildPlanAsync(_buildGraph, publishedImages);
await BuildImagesAsync(plan);
```

Good:

```cs
ImageArtifactDetails? publishedImages = Options.ImageInfoSourcePath is not null
    ? ImageInfoHelper.LoadFromFile(Options.ImageInfoSourcePath, Manifest, skipManifestValidation: true)
    : null;

_buildGraph = BuildGraph.CreateFiltered(Manifest);
await ExecuteWithDockerCredentialsAsync(() => PullBaseImagesAsync(_buildGraph));
BuildPlanItem[] plan = await CreateBuildPlanAsync(_buildGraph, publishedImages);
await BuildImagesAsync(plan);
```

---

Bad:

```cs
IEnumerable<PlatformInfo> plannedPlatforms = plan
    .Where(item => item.Action != BuildAction.NoAction)
    .Select(item => item.Target.Platform);
return Options.TrimCachedImages
    ? plannedPlatforms.OrderBy(platform => platform.DockerfilePath)
    : plannedPlatforms;
```

Good:

```cs
IEnumerable<PlatformInfo> plannedPlatforms = plan
    .Where(item => item.Action != BuildAction.NoAction)
    .Select(item => item.Target.Platform);

return Options.TrimCachedImages
    ? plannedPlatforms.OrderBy(platform => platform.DockerfilePath)
    : plannedPlatforms;
```
