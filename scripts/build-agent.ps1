# Project PULSE: Build Windows Desktop Agent
param(
    [string]$Configuration = "Release",
    [string]$OutputDir = "$PSScriptRoot\..\publish\Pulse.Agent"
)

$ErrorActionPreference = "Stop"

Write-Host "Building Project PULSE Windows Desktop Agent ($Configuration)..." -ForegroundColor Cyan

$dotnet = if (Test-Path "$PSScriptRoot\..\.dotnet\dotnet.exe") { "$PSScriptRoot\..\.dotnet\dotnet.exe" } else { "dotnet" }

$env:DOTNET_CLI_HOME = "$PSScriptRoot\..\.dotnet_home"
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = "1"
$env:DOTNET_NOLOGO = "1"
$env:NUGET_PACKAGES = "$PSScriptRoot\..\.nuget"
$env:APPDATA = "$PSScriptRoot\..\.appdata"
$env:LOCALAPPDATA = "$PSScriptRoot\..\.localappdata"

Set-Location "$PSScriptRoot\..\apps\windows-agent\Pulse.Agent"
& $dotnet publish Pulse.Agent.csproj -c $Configuration -o $OutputDir --no-restore -p:BuildInParallel=false -nr:false

Write-Host "Publish complete! Binary available at: $OutputDir\Pulse.Agent.exe" -ForegroundColor Green
