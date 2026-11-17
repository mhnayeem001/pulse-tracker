# Project PULSE: Launch Next.js Web Dashboard
$ErrorActionPreference = "Stop"

Write-Host "Starting Project PULSE Web Dashboard on http://localhost:3000..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\apps\web"
npm run dev
