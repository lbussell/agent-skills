#!/usr/bin/env dotnet

#:project ../../../src/AgentSkills.csproj

using System.CommandLine;
using LoganBussell.AgentSkills;

Argument<int> buildIdArgument = new("buildId") { Description = "The build ID to fetch the log from." };
Argument<int> logIdArgument = new("logId") { Description = "The log ID to fetch." };
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

RootCommand rootCommand = new("Fetches a task log from an Azure DevOps build.")
{
    buildIdArgument,
    logIdArgument,
    orgOption,
    projectOption,
};

ParseResult parseResult = rootCommand.Parse(args);
int buildId = parseResult.GetValue(buildIdArgument);
int logId = parseResult.GetValue(logIdArgument);
string org = parseResult.GetValue(orgOption) ?? "";
string project = parseResult.GetValue(projectOption) ?? "";

using AzureDevOpsClient client = AzureDevOpsClient.Create(org: org, project: project);
string logContent = await client.GetBuildLogContentAsync(buildId, logId);
Console.Write(logContent);
