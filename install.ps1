[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$skillsDirectory = Join-Path $PSScriptRoot 'skills'
$extensionsSourceDirectory = Join-Path $PSScriptRoot 'extensions'
$copilotHome = if ($env:COPILOT_HOME) {
    $env:COPILOT_HOME
} else {
    Join-Path $HOME '.copilot'
}
$extensionsDirectory = Join-Path $copilotHome 'extensions'

if (-not (Test-Path -LiteralPath $skillsDirectory -PathType Container)) {
    throw "Skill source directory not found: $skillsDirectory"
}

if (-not (Test-Path -LiteralPath $extensionsSourceDirectory -PathType Container)) {
    throw "Extension source directory not found: $extensionsSourceDirectory"
}

$extensions = @(Get-ChildItem -LiteralPath $extensionsSourceDirectory -Directory)

if ($extensions.Count -eq 0) {
    throw "No extensions found in: $extensionsSourceDirectory"
}

foreach ($extension in $extensions) {
    $entryPoint = Join-Path $extension.FullName 'extension.mjs'
    if (-not (Test-Path -LiteralPath $entryPoint -PathType Leaf)) {
        throw "Extension entry point not found in: $($extension.FullName)"
    }
}

Get-Command copilot -ErrorAction Stop | Out-Null

New-Item -ItemType Directory -Path $extensionsDirectory -Force | Out-Null

foreach ($extension in $extensions) {
    $extensionSource = $extension.FullName
    $legacyExtensionSource = Join-Path $PSScriptRoot ".github\extensions\$($extension.Name)"
    $extensionDestination = Join-Path $extensionsDirectory $extension.Name

    $existingExtension = Get-ChildItem -LiteralPath $extensionsDirectory -Force |
        Where-Object { $_.Name -eq $extension.Name }

    if ($existingExtension) {
        if ($existingExtension.LinkType -in @('Junction', 'SymbolicLink') -and $existingExtension.Target -eq $legacyExtensionSource) {
            Remove-Item -LiteralPath $extensionDestination -Force
            $existingExtension = $null
            Write-Host "Removed legacy $($extension.Name) extension link"
        } elseif ($existingExtension.LinkType -notin @('Junction', 'SymbolicLink') -or $existingExtension.Target -ne $extensionSource) {
            throw "Extension destination already exists: $extensionDestination. Move it aside before running this installer."
        }
    }

    if ($existingExtension) {
        Write-Host "Extension '$($extension.Name)' already linked to $extensionSource"
    } else {
        New-Item -ItemType Junction -Path $extensionDestination -Target $extensionSource | Out-Null
        Write-Host "Linked $extensionDestination to $extensionSource"
    }
}

copilot skill add $skillsDirectory
if ($LASTEXITCODE -ne 0) {
    throw "Failed to install skills from $skillsDirectory (Copilot exit code: $LASTEXITCODE)."
}
