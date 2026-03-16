#!/usr/bin/env dotnet
#:project ../../../src/AgentSkills.csproj

using LoganBussell.AgentSkills;
using static System.Console;

// Add or remove entries here to change which pipeline folders are monitored.
PipelineLocation[] locations =
[
    new("dnceng", "internal", "dotnet/docker-tools"),
];

int totalUnhealthy = 0;

foreach (PipelineLocation location in locations)
{
    string normalizedFolder = @"\" + location.Folder.Trim('\\', '/').Replace('/', '\\');

    using AzureDevOpsClient client = AzureDevOpsClient.Create(org: location.Org, project: location.Project);
    DefinitionsResponse buildDefinitions = await client.GetBuildDefinitionsAsync(normalizedFolder);
    List<BuildDefinitionReference> unhealthyPipelines = buildDefinitions
        .Value.Where(definition => definition.LatestCompletedBuild is { Result: "failed" or "partiallySucceeded" })
        .ToList();

    if (unhealthyPipelines.Count == 0)
    {
        continue;
    }

    totalUnhealthy += unhealthyPipelines.Count;
    WriteLine($"## {location.Org}/{location.Project} - {location.Folder}");
    WriteLine();

    foreach (BuildDefinitionReference def in unhealthyPipelines)
    {
        ApiBuild build = def.LatestCompletedBuild!;
        string result = BuildTimelineRendering.FormatBuildResult(build.Result);
        WriteLine($"Pipeline: {def.Name}");
        WriteLine($"  Result: {result}");
        WriteLine($"  Commit: {build.SourceVersion ?? "unknown"}");
        WriteLine($"  Link:   {client.GetBuildResultUrl(build.Id)}");
        WriteLine();
    }
}

if (totalUnhealthy == 0)
{
    WriteLine("No failing or warning pipelines found.");
}
else
{
    WriteLine($"Total: {totalUnhealthy} unhealthy pipeline(s)");
}

record PipelineLocation(string Org, string Project, string Folder);
