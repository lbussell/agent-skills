#!/usr/bin/env dotnet
#:project ../../../src/AgentSkills.csproj

using System.CommandLine;
using LoganBussell.AgentSkills;
using static System.Console;

Option<string> orgOption = new("--org", "-o")
{
    Description = "The Azure DevOps organization. Auto-detected from an Azure DevOps git remote if not provided.",
};
Option<string> projectOption = new("--azdo-project")
{
    Description = "The Azure DevOps project. Auto-detected from an Azure DevOps git remote if not provided.",
};
Option<string> folderOption = new("--folder", "-f")
{
    Description = "The pipeline folder path. Defaults to the GitHub owner/repo from 'gh repo set-default --view'.",
};

RootCommand rootCommand = new("Lists failing and warning Azure Pipelines.")
{
    orgOption,
    projectOption,
    folderOption,
};

ParseResult parseResult = rootCommand.Parse(args);
string? org = parseResult.GetValue(orgOption);
string? project = parseResult.GetValue(projectOption);
string? folder = parseResult.GetValue(folderOption);

// Auto-detect AzDO org/project from git remote when not provided.
if (org is null || project is null)
{
    (string detectedOrg, string detectedProject) = await GitHelper.GetAzureDevOpsRemoteAsync();
    org ??= detectedOrg;
    project ??= detectedProject;
}

// Auto-detect pipeline folder from the default GitHub repo when not provided.
folder ??= await GitHelper.GetDefaultGitHubRepoAsync();

string normalizedFolder = @"\" + folder.Trim('\\', '/').Replace('/', '\\');

using AzureDevOpsClient client = AzureDevOpsClient.Create(org: org, project: project);
DefinitionsResponse buildDefinitions = await client.GetBuildDefinitionsAsync(normalizedFolder);
List<BuildDefinitionReference> unhealthyPipelines = buildDefinitions
    .Value.Where(definition =>
        !definition.Name.Contains("unofficial", StringComparison.OrdinalIgnoreCase)
        && definition.LatestCompletedBuild is { Result: "failed" or "partiallySucceeded" })
    .ToList();

if (unhealthyPipelines.Count == 0)
{
    WriteLine("No failing or warning pipelines found.");
    return;
}

WriteLine($"## {org}/{project} - {folder}");
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

WriteLine($"Total: {unhealthyPipelines.Count} unhealthy pipeline(s)");
