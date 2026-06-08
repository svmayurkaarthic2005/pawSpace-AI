# PawSpace Mobile - Complete Clean & Rebuild Script (PowerShell)
# This script cleans all caches and rebuilds the Android app

$ErrorActionPreference = "Stop"

Write-Host "🧹 Cleaning Metro bundler cache..." -ForegroundColor Cyan
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
}

Write-Host "🧹 Cleaning React Native temp files..." -ForegroundColor Cyan
$tempPath = $env:TEMP
Get-ChildItem -Path $tempPath -Filter "react-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $tempPath -Filter "metro-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "🧹 Cleaning Android build cache..." -ForegroundColor Cyan
Push-Location android
& .\gradlew clean
if (Test-Path "app\build") {
    Remove-Item -Recurse -Force "app\build"
}
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}
Pop-Location

Write-Host "🧹 Removing old package folders..." -ForegroundColor Cyan
if (Test-Path "android\app\src\main\java\com\myapp") {
    Remove-Item -Recurse -Force "android\app\src\main\java\com\myapp"
}

Write-Host "✅ Clean complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🛑 Stopping any existing Metro bundler..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess | 
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 2

Write-Host "📦 Starting Metro bundler with cache reset..." -ForegroundColor Cyan
$metroJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run start -- --reset-cache
}

Write-Host "⏳ Waiting for Metro to start (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "🚀 Building and running Android app..." -ForegroundColor Cyan
npm run android

Write-Host ""
Write-Host "✅ App should now be running!" -ForegroundColor Green
Write-Host "   Metro Job ID: $($metroJob.Id)" -ForegroundColor Gray
Write-Host "   To stop Metro: Stop-Job -Id $($metroJob.Id); Remove-Job -Id $($metroJob.Id)" -ForegroundColor Gray
