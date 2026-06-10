#!/usr/bin/env pwsh
# Quick fix for AIRMap native component linking issue

Write-Host "`n🔧 Quick Fix: React Native Maps Linking" -ForegroundColor Cyan
Write-Host "This will clean and rebuild your Android app`n" -ForegroundColor Yellow

# Clean Android build
Write-Host "1️⃣  Cleaning Android build..." -ForegroundColor Yellow
Push-Location android
./gradlew clean
Pop-Location

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Clean failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Clean successful`n" -ForegroundColor Green

# Start Metro with reset cache in new window
Write-Host "2️⃣  Starting Metro bundler (new window)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npx react-native start --reset-cache"

Write-Host "✓ Metro starting...`n" -ForegroundColor Green
Write-Host "⏱  Waiting 10 seconds for Metro to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Rebuild and run
Write-Host "`n3️⃣  Building and installing app..." -ForegroundColor Yellow
Write-Host "(This may take 5-10 minutes on first build)`n" -ForegroundColor Gray

npx react-native run-android

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! App rebuilt and installed.`n" -ForegroundColor Green
    Write-Host "The AIRMap native component should now be available." -ForegroundColor Cyan
    Write-Host "Check your emulator to verify the app loaded correctly.`n" -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Build failed! Check errors above.`n" -ForegroundColor Red
    exit 1
}
