# Project PULSE: Run Windows Agent Automated Test Suite
$ErrorActionPreference = "Stop"

Write-Host "Running Project PULSE Automated Tests..." -ForegroundColor Cyan

$dotnet = if (Test-Path "$PSScriptRoot\..\.dotnet\dotnet.exe") { "$PSScriptRoot\..\.dotnet\dotnet.exe" } else { "dotnet" }

$env:DOTNET_CLI_HOME = "$PSScriptRoot\..\.dotnet_home"
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = "1"
$env:DOTNET_NOLOGO = "1"
$env:NUGET_PACKAGES = "$PSScriptRoot\..\.nuget"
$env:APPDATA = "$PSScriptRoot\..\.appdata"
$env:LOCALAPPDATA = "$PSScriptRoot\..\.localappdata"

Set-Location "$PSScriptRoot\..\apps\windows-agent\Pulse.Tests"
& $dotnet test Pulse.Tests.csproj -v normal -p:BuildInParallel=false -nr:false

Write-Host "All tests executed successfully!" -ForegroundColor Green
