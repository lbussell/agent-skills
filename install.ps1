[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$skillsDirectory = Join-Path $PSScriptRoot 'skills'
$extensionSource = Join-Path $PSScriptRoot 'extensions\review-workflow'
$legacyExtensionSource = Join-Path $PSScriptRoot '.github\extensions\review-workflow'
$copilotHome = if ($env:COPILOT_HOME) {
    $env:COPILOT_HOME
} else {
    Join-Path $HOME '.copilot'
}
$extensionsDirectory = Join-Path $copilotHome 'extensions'
$extensionDestination = Join-Path $extensionsDirectory 'review-workflow'

if (-not (Test-Path -LiteralPath $skillsDirectory -PathType Container)) {
    throw "Skill source directory not found: $skillsDirectory"
}

if (-not (Test-Path -LiteralPath (Join-Path $extensionSource 'extension.mjs') -PathType Leaf)) {
    throw "Review extension entry point not found in: $extensionSource"
}

Get-Command copilot -ErrorAction Stop | Out-Null

New-Item -ItemType Directory -Path $extensionsDirectory -Force | Out-Null
$existingExtension = Get-ChildItem -LiteralPath $extensionsDirectory -Force |
    Where-Object { $_.Name -eq 'review-workflow' }

if ($existingExtension) {
    if ($existingExtension.LinkType -in @('Junction', 'SymbolicLink') -and $existingExtension.Target -eq $legacyExtensionSource) {
        Remove-Item -LiteralPath $extensionDestination -Force
        $existingExtension = $null
        Write-Host "Removed legacy review extension link"
    } elseif ($existingExtension.LinkType -notin @('Junction', 'SymbolicLink') -or $existingExtension.Target -ne $extensionSource) {
        throw "Review extension destination already exists: $extensionDestination. Move it aside before running this installer."
    }
}

if ($existingExtension) {
    Write-Host "Review extension already linked to $extensionSource"
} else {
    New-Item -ItemType Junction -Path $extensionDestination -Target $extensionSource | Out-Null
    Write-Host "Linked $extensionDestination to $extensionSource"
}

copilot skill add $skillsDirectory
if ($LASTEXITCODE -ne 0) {
    throw "Failed to install skills from $skillsDirectory (Copilot exit code: $LASTEXITCODE)."
}
