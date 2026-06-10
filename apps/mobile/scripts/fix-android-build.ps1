#!/usr/bin/env pwsh

Write-Host "🔧 Fixing Android Build Issues..." -ForegroundColor Cyan
Write-Host ""

# Navigate to mobile directory
Set-Location -Path "$PSScriptRoot/.."

Write-Host "📦 Step 1: Cleaning build artifacts..." -ForegroundColor Yellow
Write-Host "  - Removing node_modules..."
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "  - Cleaning Android build..."
Set-Location -Path "android"
if (Test-Path "build") {
    Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "app/build") {
    Remove-Item -Path "app/build" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path ".gradle") {
    Remove-Item -Path ".gradle" -Recurse -Force -ErrorAction SilentlyContinue
}
Set-Location -Path ".."

Write-Host ""
Write-Host "📦 Step 2: Reinstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "🔗 Step 3: Relinking native modules..." -ForegroundColor Yellow
npx react-native-clean-project --remove-iOS-build --remove-iOS-pods

Write-Host ""
Write-Host "🏗️  Step 4: Cleaning Android gradle..." -ForegroundColor Yellow
Set-Location -Path "android"
.\gradlew clean
Set-Location -Path ".."

Write-Host ""
Write-Host "📱 Step 5: Rebuilding Android app..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..."
npx react-native run-android --reset-cache

Write-Host ""
Write-Host "✅ Build process complete!" -ForegroundColor Green
Write-Host ""
Write-Host "If you still encounter issues:" -ForegroundColor Yellow
Write-Host "  1. Close Metro bundler if running"
Write-Host "  2. Uninstall app from device/emulator"
Write-Host "  3. Run: npm start -- --reset-cache"
Write-Host "  4. Run: npm run android"
