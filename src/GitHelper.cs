
using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace LoganBussell.AgentSkills;

/// <summary>
/// Helpers for detecting repository information from the local git environment.
/// </summary>
public static partial class GitHelper
{
    /// <summary>
    /// Returns the default GitHub repository (<c>owner/repo</c>) by running <c>gh repo set-default --view</c>.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when no default repository is configured.</exception>
    public static async Task<string> GetDefaultGitHubRepoAsync()
    {
        try
        {
            string output = await ProcessHelper.RunAsync("gh", "repo", "set-default", "--view");
            string repo = output.Trim();
            if (string.IsNullOrEmpty(repo))
            {
                throw new InvalidOperationException("gh repo set-default --view returned empty output.");
            }
            return repo;
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("exited with code"))
        {
            throw new InvalidOperationException(
                "No default GitHub repository is configured. Run 'gh repo set-default' to set one.",
                ex);
        }
    }

    /// <summary>
    /// Detects the Azure DevOps organization and project from a git remote URL.
    /// Parses <c>git remote -v</c> looking for Azure DevOps HTTPS or SSH URLs.
    /// </summary>
    /// <returns>A tuple of (org, project) extracted from the first matching remote.</returns>
    /// <exception cref="InvalidOperationException">Thrown when no Azure DevOps remote is found.</exception>
    public static async Task<(string Org, string Project)> GetAzureDevOpsRemoteAsync()
    {
        string output = await ProcessHelper.RunAsync("git", "remote", "-v");

        foreach (string line in output.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            // Extract just the URL (second whitespace-delimited token)
            string[] parts = line.Split([' ', '\t'], StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2) continue;
            string url = parts[1];

            if (TryParseAzureDevOpsRemoteUrl(url, out string? org, out string? project))
            {
                return (org, project);
            }
        }

        throw new InvalidOperationException(
            "No Azure DevOps remote found. Expected a remote URL matching " +
            "https://dev.azure.com/{org}/{project}/... or git@ssh.dev.azure.com:v3/{org}/{project}/...");
    }

    /// <summary>
    /// Tries to parse an Azure DevOps remote URL to extract the organization and project.
    /// </summary>
    /// <remarks>
    /// Supported formats:
    /// <list type="bullet">
    /// <item><c>https://dev.azure.com/{org}/{project}/_git/{repo}</c></item>
    /// <item><c>https://{org}.visualstudio.com/{project}/_git/{repo}</c></item>
    /// <item><c>git@ssh.dev.azure.com:v3/{org}/{project}/{repo}</c></item>
    /// <item><c>{org}@vs-ssh.visualstudio.com:v3/{org}/{project}/{repo}</c></item>
    /// </list>
    /// </remarks>
    internal static bool TryParseAzureDevOpsRemoteUrl(
        string url,
        [System.Diagnostics.CodeAnalysis.NotNullWhen(true)] out string? org,
        [System.Diagnostics.CodeAnalysis.NotNullWhen(true)] out string? project)
    {
        org = null;
        project = null;

        // HTTPS: https://dev.azure.com/{org}/{project}/_git/{repo}
        Match httpsMatch = DevAzureComHttpsPattern().Match(url);
        if (httpsMatch.Success)
        {
            org = httpsMatch.Groups["org"].Value;
            project = httpsMatch.Groups["project"].Value;
            return true;
        }

        // HTTPS: https://{org}.visualstudio.com/{project}/_git/{repo}
        Match vstsMatch = VisualStudioHttpsPattern().Match(url);
        if (vstsMatch.Success)
        {
            org = vstsMatch.Groups["org"].Value;
            project = vstsMatch.Groups["project"].Value;
            return true;
        }

        // SSH: git@ssh.dev.azure.com:v3/{org}/{project}/{repo}
        Match sshMatch = DevAzureComSshPattern().Match(url);
        if (sshMatch.Success)
        {
            org = sshMatch.Groups["org"].Value;
            project = sshMatch.Groups["project"].Value;
            return true;
        }

        // SSH: {org}@vs-ssh.visualstudio.com:v3/{org}/{project}/{repo}
        Match vstsSshMatch = VisualStudioSshPattern().Match(url);
        if (vstsSshMatch.Success)
        {
            org = vstsSshMatch.Groups["org"].Value;
            project = vstsSshMatch.Groups["project"].Value;
            return true;
        }

        return false;
    }

    [GeneratedRegex(@"https://dev\.azure\.com/(?<org>[^/]+)/(?<project>[^/]+)/")]
    private static partial Regex DevAzureComHttpsPattern();

    [GeneratedRegex(@"https://(?<org>[^.]+)\.visualstudio\.com/(?<project>[^/]+)/")]
    private static partial Regex VisualStudioHttpsPattern();

    [GeneratedRegex(@"git@ssh\.dev\.azure\.com:v3/(?<org>[^/]+)/(?<project>[^/]+)/")]
    private static partial Regex DevAzureComSshPattern();

    [GeneratedRegex(@"@vs-ssh\.visualstudio\.com:v3/(?<org>[^/]+)/(?<project>[^/]+)/")]
    private static partial Regex VisualStudioSshPattern();
}
