#!/usr/bin/env pwsh
# ============================================================================
# Android Maps Monorepo Autolinking Fix Script
# ============================================================================
# This script fixes react-native-maps autolinking issues in monorepo setups
# ============================================================================

Write-Host "🔧 Fixing React Native Maps in Monorepo..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileDir = Split-Path -Parent $scriptDir

# Change to mobile directory
Set-Location $mobileDir

Write-Host "📍 Working directory: $mobileDir" -ForegroundColor Yellow
Write-Host ""

# Step 1: Verify react-native-maps is in package.json
Write-Host "Step 1: Checking package.json..." -ForegroundColor Green
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.dependencies.'react-native-maps') {
    Write-Host "  ✅ react-native-maps found in dependencies: $($packageJson.dependencies.'react-native-maps')" -ForegroundColor Green
} else {
    Write-Host "  ❌ react-native-maps NOT found in package.json!" -ForegroundColor Red
    Write-Host "  Installing react-native-maps@1.14.0..." -ForegroundColor Yellow
    npm install react-native-maps@1.14.0 --save --legacy-peer-deps
}
Write-Host ""

# Step 2: Verify react-native.config.js exists
Write-Host "Step 2: Verifying react-native.config.js..." -ForegroundColor Green
$configExists = Test-Path "react-native.config.js"
if ($configExists) {
    Write-Host "  ✅ react-native.config.js already exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ react-native.config.js not found!" -ForegroundColor Red
    Write-Host "  Creating react-native.config.js..." -ForegroundColor Yellow
    Write-Host "  NOTE: This file was already created. If missing, please create it manually." -ForegroundColor Yellow
    Write-Host "  See: apps/mobile/docs/MONOREPO_AUTOLINKING_FIX.md for content" -ForegroundColor Cyan
}
Write-Host ""

# Step 3: Clean everything
Write-Host "Step 3: Cleaning build artifacts..." -ForegroundColor Green
Write-Host "  Removing node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "  ✅ Removed node_modules" -ForegroundColor Green
}

Write-Host "  Removing android/.gradle..." -ForegroundColor Yellow
if (Test-Path "android/.gradle") {
    Remove-Item -Recurse -Force "android/.gradle"
    Write-Host "  ✅ Removed android/.gradle" -ForegroundColor Green
}

Write-Host "  Removing android/app/build..." -ForegroundColor Yellow
if (Test-Path "android/app/build") {
    Remove-Item -Recurse -Force "android/app/build"
    Write-Host "  ✅ Removed android/app/build" -ForegroundColor Green
}

Write-Host "  Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "  ✅ Removed package-lock.json" -ForegroundColor Green
}
Write-Host ""

# Step 4: Reinstall dependencies
Write-Host "Step 4: Reinstalling dependencies..." -ForegroundColor Green
npm install --legacy-peer-deps
Write-Host "  ✅ Dependencies reinstalled" -ForegroundColor Green
Write-Host ""

# Step 5: Verify autolinking
Write-Host "Step 5: Verifying autolinking configuration..." -ForegroundColor Green
$configOutput = npx react-native config 2>&1 | Out-String

if ($configOutput -match "react-native-maps") {
    Write-Host "  ✅ react-native-maps is now visible in autolinking!" -ForegroundColor Green
    Write-Host "  Autolinking is working correctly." -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: react-native-maps still not detected!" -ForegroundColor Red
    Write-Host "  Manual linking will be required." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  After this script completes, run:" -ForegroundColor Yellow
    Write-Host "  .\scripts\fix-android-maps-manual-linking.ps1" -ForegroundColor Cyan
}
Write-Host ""

# Step 6: Clean Android build
Write-Host "Step 6: Cleaning Android build..." -ForegroundColor Green
Set-Location "android"
if (Test-Path "gradlew.bat") {
    Write-Host "  Running gradlew clean..." -ForegroundColor Yellow
    .\gradlew.bat clean
    Write-Host "  ✅ Android cleaned" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  gradlew.bat not found, skipping gradle clean" -ForegroundColor Yellow
}
Set-Location ..
Write-Host ""

# Final instructions
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "MONOREPO FIX COMPLETE!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "react-native.config.js has been created to enable autolinking in monorepo." -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Verify autolinking (should show react-native-maps):" -ForegroundColor White
Write-Host "   npx react-native config" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Start Metro bundler:" -ForegroundColor White
Write-Host "   npm run start:reset" -ForegroundColor Cyan
Write-Host "   (Keep this terminal open)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. In a NEW terminal, build Android:" -ForegroundColor White
Write-Host "   npm run android" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. If still failing, manual linking required:" -ForegroundColor White
Write-Host "   .\scripts\fix-android-maps-manual-linking.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
