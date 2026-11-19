# Project PULSE Office PC Updater Script
# Run this once in PowerShell on your Office PC:
# irm https://pulse-tracker-theta.vercel.app/downloads/update.ps1 | iex

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Project PULSE: Auto-Update to v1.1.0  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Stop running Pulse.Agent if any
$runningProc = Get-Process -Name Pulse.Agent -ErrorAction SilentlyContinue
$targetDir = ""

if ($runningProc) {
    try {
        $targetDir = [System.IO.Path]::GetDirectoryName($runningProc.Path)
    } catch {}
    Write-Host "Stopping running Project PULSE agent (PID: $($runningProc.Id))..." -ForegroundColor Yellow
    Stop-Process -Name Pulse.Agent -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

if (-not $targetDir -or -not (Test-Path $targetDir)) {
    # Check default common locations
    if (Test-Path "E:\counting click\publish\Pulse.Agent\Pulse.Agent.exe") {
        $targetDir = "E:\counting click\publish\Pulse.Agent"
    } elseif (Test-Path "$env:LOCALAPPDATA\ProjectPulse\Agent\Pulse.Agent.exe") {
        $targetDir = "$env:LOCALAPPDATA\ProjectPulse\Agent"
    } elseif (Test-Path "C:\ProjectPulse\Pulse.Agent.exe") {
        $targetDir = "C:\ProjectPulse"
    } else {
        $targetDir = "$env:LOCALAPPDATA\ProjectPulse\Agent"
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
}

Write-Host "Installing to: $targetDir" -ForegroundColor Green

# 2. Download latest Pulse-Agent.zip
$zipUrl = "https://pulse-tracker-theta.vercel.app/downloads/Pulse-Agent.zip"
$tempZip = "$env:TEMP\Pulse-Agent-v1.1.0.zip"
$tempExtract = "$env:TEMP\Pulse-Agent-v1.1.0-extract"

Write-Host "Downloading latest agent v1.1.0 from cloud..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $zipUrl -OutFile $tempZip -UseBasicParsing

# 3. Extract and overwrite
if (Test-Path $tempExtract) { Remove-Item -Recurse -Force $tempExtract }
Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force

Copy-Item -Path "$tempExtract\*" -Destination $targetDir -Recurse -Force

# Cleanup temp
Remove-Item -Force $tempZip -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $tempExtract -ErrorAction SilentlyContinue

Write-Host "Starting updated Project PULSE Agent (v1.1.0)..." -ForegroundColor Green
Start-Process -FilePath "$targetDir\Pulse.Agent.exe" -ArgumentList "--minimized"

Write-Host "=========================================" -ForegroundColor Green
Write-Host " SUCCESS: Upgraded to v1.1.0!             " -ForegroundColor Green
Write-Host " Auto-Updater is now active.             " -ForegroundColor Green
Write-Host " Future updates will apply automatically!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
