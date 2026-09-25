[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$sourceDirectory = Join-Path $PSScriptRoot 'agents'
$copilotHome = if ($env:COPILOT_HOME) {
    $env:COPILOT_HOME
} else {
    Join-Path $HOME '.copilot'
}
$destinationDirectory = Join-Path $copilotHome 'agents'

if (-not (Test-Path -LiteralPath $sourceDirectory -PathType Container)) {
    throw "Agent source directory not found: $sourceDirectory"
}

$agents = @(Get-ChildItem -LiteralPath $sourceDirectory -Filter '*.md' -File)

if ($agents.Count -eq 0) {
    throw "No agent profiles found in: $sourceDirectory"
}

New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null

foreach ($agent in $agents) {
    $destinationName = if ($agent.Name.EndsWith('.agent.md')) {
        $agent.Name
    } else {
        "$($agent.BaseName).agent.md"
    }
    $destination = Join-Path $destinationDirectory $destinationName

    Copy-Item -LiteralPath $agent.FullName -Destination $destination -Force
    Write-Host "Installed $destinationName"
}

Write-Host "Installed $($agents.Count) agent profile(s) to $destinationDirectory"
