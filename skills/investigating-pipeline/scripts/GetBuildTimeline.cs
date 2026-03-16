#!/usr/bin/env dotnet

#:project ../../../src/AgentSkills.csproj

using System.CommandLine;
using LoganBussell.AgentSkills;
using static Spectre.Console.AnsiConsole;

Argument<int> buildIdArgument = new("buildId") { Description = "The build ID to fetch the timeline for." };
Option<bool> showAllOption = new("--show-all", "-a") { Description = "Show all tasks, not just failing ones." };
Option<string> orgOption = new("--org", "-o")
{
    Description = "The Azure DevOps organization.",
    Required = true,
};
Option<string> projectOption = new("--azdo-project")
{
    Description = "The Azure DevOps project name or ID.",
    Required = true,
};

RootCommand rootCommand = new("Displays the build timeline as a tree.")
{
    buildIdArgument,
    showAllOption,
    orgOption,
    projectOption,
};

ParseResult parseResult = rootCommand.Parse(args);
int buildId = parseResult.GetValue(buildIdArgument);
bool showAll = parseResult.GetValue(showAllOption);
string org = parseResult.GetValue(orgOption) ?? "";
string project = parseResult.GetValue(projectOption) ?? "";

using AzureDevOpsClient client = AzureDevOpsClient.Create(org: org, project: project);
BuildDetail build = await client.GetBuildAsync(buildId);
TimelineResponse timeline = await client.GetBuildTimelineAsync(buildId);
IReadOnlyList<TimelineNode> roots = timeline.BuildTree();

if (roots.Count == 0)
{
    WriteLine("No timeline records found.");
    return;
}

Func<TimelineNode, bool>? filter = showAll
    ? null
    : node => node.Record.Type is not "Task" || node.Record.Result is "failed" or "succeededWithIssues";

string buildResult = BuildTimelineRendering.FormatBuildResult(build.Result);
string stageCount = roots.Count > 0 ? $" ({roots.Count} Stages)" : "";
string timelineLabel = $"Build #{buildId}: {build.Definition.Name} | {buildResult}{stageCount} | {client.GetBuildResultUrl(buildId)}";
Spectre.Console.Tree buildTimelineTree = BuildTimelineRendering.RenderTree(roots, timelineLabel, filter);
Write(buildTimelineTree);
WriteLine();
