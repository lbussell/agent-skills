[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$extensionsSourceDirectory = Join-Path $PSScriptRoot 'extensions'
$legacyExtensionsDirectory = Join-Path $PSScriptRoot '.github\extensions'
$copilotHome = if ($env:COPILOT_HOME) {
    $env:COPILOT_HOME
} else {
    Join-Path $HOME '.copilot'
}
$extensionsDirectory = Join-Path $copilotHome 'extensions'

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

$extensionPlans = foreach ($extension in $extensions) {
    $extensionDestination = Join-Path $extensionsDirectory $extension.Name
    $legacyExtensionSource = Join-Path $legacyExtensionsDirectory $extension.Name
    $existingExtension = Get-Item -LiteralPath $extensionDestination -Force -ErrorAction SilentlyContinue
    $isLegacyLink = $existingExtension -and
        $existingExtension.LinkType -in @('Junction', 'SymbolicLink') -and
        $existingExtension.Target -eq $legacyExtensionSource

    if ($existingExtension -and -not $isLegacyLink -and
        ($existingExtension.LinkType -notin @('Junction', 'SymbolicLink') -or
            $existingExtension.Target -ne $extension.FullName)) {
        throw "Extension destination already exists: $extensionDestination. Move it aside before running this installer."
    }

    [pscustomobject]@{
        Source = $extension
        Destination = $extensionDestination
        Existing = $existingExtension
        IsLegacy = $isLegacyLink
    }
}

foreach ($extensionPlan in $extensionPlans) {
    if ($extensionPlan.IsLegacy) {
        Remove-Item -LiteralPath $extensionPlan.Destination -Force
        Write-Host "Removed legacy $($extensionPlan.Source.Name) extension link"
    }

    if ($extensionPlan.Existing -and -not $extensionPlan.IsLegacy) {
        Write-Host "Extension '$($extensionPlan.Source.Name)' already linked to $($extensionPlan.Source.FullName)"
    } else {
        New-Item -ItemType Junction -Path $extensionPlan.Destination -Target $extensionPlan.Source.FullName | Out-Null
        Write-Host "Linked $($extensionPlan.Destination) to $($extensionPlan.Source.FullName)"
    }
}
