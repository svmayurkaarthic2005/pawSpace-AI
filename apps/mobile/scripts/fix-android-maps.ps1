#!/usr/bin/env pwsh
# ============================================================================
# Android Maps Native Module Fix Script
# ============================================================================
# This script fixes the RNMapsAirModule native linking issue on Android
# ============================================================================

Write-Host "🔧 Fixing Android Maps Native Module Linking..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileDir = Split-Path -Parent $scriptDir

# Change to mobile directory
Set-Location $mobileDir

Write-Host "📍 Working directory: $mobileDir" -ForegroundColor Yellow
Write-Host ""

# Step 1: Verify New Architecture is disabled
Write-Host "Step 1: Checking New Architecture setting..." -ForegroundColor Green
$gradleProps = Get-Content "android/gradle.properties" -Raw
if ($gradleProps -match "newArchEnabled=true") {
    Write-Host "  ⚠️  New Architecture is ENABLED - This causes issues with react-native-maps!" -ForegroundColor Red
    Write-Host "  Disabling New Architecture..." -ForegroundColor Yellow
    $gradleProps = $gradleProps -replace "newArchEnabled=true", "newArchEnabled=false"
    Set-Content "android/gradle.properties" -Value $gradleProps -NoNewline
    Write-Host "  ✅ New Architecture disabled" -ForegroundColor Green
} else {
    Write-Host "  ✅ New Architecture already disabled" -ForegroundColor Green
}
Write-Host ""

# Step 2: Clean everything
Write-Host "Step 2: Cleaning build artifacts..." -ForegroundColor Green
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

Write-Host "  Removing node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "  ✅ Removed node_modules" -ForegroundColor Green
}

Write-Host "  Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "  ✅ Removed package-lock.json" -ForegroundColor Green
}
Write-Host ""

# Step 3: Install stable react-native-maps version
Write-Host "Step 3: Installing stable react-native-maps version..." -ForegroundColor Green
Write-Host "  Uninstalling current version..." -ForegroundColor Yellow
npm uninstall react-native-maps react-native-map-clustering 2>&1 | Out-Null

Write-Host "  Installing react-native-maps@1.14.0 (stable)..." -ForegroundColor Yellow
npm install react-native-maps@1.14.0 --save --legacy-peer-deps

Write-Host "  Installing react-native-map-clustering@4.0.0..." -ForegroundColor Yellow
npm install react-native-map-clustering@4.0.0 --save --legacy-peer-deps

Write-Host "  ✅ Installed stable versions" -ForegroundColor Green
Write-Host ""

# Step 4: Reinstall all packages
Write-Host "Step 4: Reinstalling all packages..." -ForegroundColor Green
npm install --legacy-peer-deps
Write-Host "  ✅ Packages reinstalled" -ForegroundColor Green
Write-Host ""

# Step 5: Verify autolinking
Write-Host "Step 5: Verifying autolinking..." -ForegroundColor Green
$autolink = npx react-native config 2>&1 | Out-String
if ($autolink -match "react-native-maps") {
    Write-Host "  ✅ react-native-maps is properly autolinked" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: react-native-maps NOT found in autolinking!" -ForegroundColor Red
    Write-Host "  This may require manual linking in MainApplication.kt" -ForegroundColor Yellow
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

# Step 7: Check for manual linking requirements
Write-Host "Step 7: Checking MainApplication.kt..." -ForegroundColor Green
$mainAppPath = "android/app/src/main/java/com/pawspace/MainApplication.kt"
if (Test-Path $mainAppPath) {
    $mainAppContent = Get-Content $mainAppPath -Raw
    if ($mainAppContent -match "MapsPackage") {
        Write-Host "  ℹ️  Manual MapsPackage import already present" -ForegroundColor Cyan
    } else {
        Write-Host "  ℹ️  No manual MapsPackage import found (autolinking should handle this)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ⚠️  MainApplication.kt not found at expected location" -ForegroundColor Yellow
}
Write-Host ""

# Final instructions
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "✅ CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Metro bundler with cache reset:" -ForegroundColor White
Write-Host "   npm run start:reset" -ForegroundColor Cyan
Write-Host "   (Keep this terminal open)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. In a NEW terminal, build and run Android:" -ForegroundColor White
Write-Host "   cd apps/mobile" -ForegroundColor Cyan
Write-Host "   npm run android" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. If you still get RNMapsAirModule error:" -ForegroundColor White
Write-Host "   Run: .\scripts\fix-android-maps-manual.ps1" -ForegroundColor Cyan
Write-Host "   (This will add manual linking)" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
