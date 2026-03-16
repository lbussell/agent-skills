#!/usr/bin/env dotnet
#:project ../../../src/AgentSkills.csproj

using System.CommandLine;
using System.Text.Json;
using System.Text.Json.Serialization;
using LoganBussell.AgentSkills;
using static System.Console;

Option<string> configOption = new("--config", "-c")
{
    Description = "Path to a JSON config file listing Azure DevOps pipeline locations to check.",
    DefaultValueFactory = _ => "pipelines.json",
};
Option<string> orgOption = new("--org", "-o")
{
    Description = "The Azure DevOps organization. Use with --project and --folder for a single query.",
};
Option<string> projectOption = new("--azdo-project")
{
    Description = "The Azure DevOps project. Use with --org and --folder for a single query.",
};
Option<string> folderOption = new("--folder", "-f")
{
    Description = "The Azure DevOps pipeline folder path. Use with --org and --project for a single query.",
};

RootCommand rootCommand = new("Lists failing and warning pipelines across Azure DevOps pipeline folders.")
{
    configOption,
    orgOption,
    projectOption,
    folderOption,
};

ParseResult parseResult = rootCommand.Parse(args);
string configPath = parseResult.GetValue(configOption) ?? "pipelines.json";
string? cliOrg = parseResult.GetValue(orgOption);
string? cliProject = parseResult.GetValue(projectOption);
string? cliFolder = parseResult.GetValue(folderOption);

List<PipelineLocation> locations;

if (cliOrg is not null && cliProject is not null && cliFolder is not null)
{
    // Single query via CLI args - no config file needed
    locations = [new PipelineLocation(cliOrg, cliProject, cliFolder)];
}
else
{
    if (!File.Exists(configPath))
    {
        Error.WriteLine($"Config file not found: {configPath}");
        Error.WriteLine();
        Error.WriteLine("Create a pipelines.json file with an array of locations to check:");
        Error.WriteLine("""
            [
              { "org": "myorg", "project": "myproject", "folder": "my-repo" }
            ]
            """);
        Error.WriteLine();
        Error.WriteLine("Or pass --org, --project, and --folder for a single query.");
        return 1;
    }

    string configJson = await File.ReadAllTextAsync(configPath);
    locations = JsonSerializer.Deserialize(configJson, PipelineConfigJsonContext.Default.ListPipelineLocation)
        ?? throw new InvalidOperationException($"Failed to parse config file: {configPath}");
}

int totalUnhealthy = 0;

foreach (PipelineLocation location in locations)
{
    // Normalize to the backslash-prefixed format the API expects
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

return 0;

record PipelineLocation(string Org, string Project, string Folder);

[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
[JsonSerializable(typeof(List<PipelineLocation>))]
partial class PipelineConfigJsonContext : JsonSerializerContext;
