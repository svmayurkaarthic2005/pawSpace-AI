#!/usr/bin/env pwsh
# ============================================================================
# Manual Android Maps Linking Script (FALLBACK)
# ============================================================================
# This script manually adds MapsPackage to MainApplication.kt
# Only use this if autolinking fails
# ============================================================================

Write-Host "🔧 Adding Manual Maps Linking..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileDir = Split-Path -Parent $scriptDir

Set-Location $mobileDir

# Find MainApplication.kt
$mainAppPaths = @(
    "android/app/src/main/java/com/pawspace/MainApplication.kt",
    "android/app/src/main/kotlin/com/pawspace/MainApplication.kt"
)

$mainAppPath = $null
foreach ($path in $mainAppPaths) {
    if (Test-Path $path) {
        $mainAppPath = $path
        break
    }
}

if (-not $mainAppPath) {
    Write-Host "❌ ERROR: Cannot find MainApplication.kt" -ForegroundColor Red
    Write-Host "   Looked in:" -ForegroundColor Yellow
    foreach ($path in $mainAppPaths) {
        Write-Host "   - $path" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "📍 Found MainApplication.kt: $mainAppPath" -ForegroundColor Green
Write-Host ""

# Read the file
$content = Get-Content $mainAppPath -Raw

# Check if already manually linked (escape the dot in regex)
if ($content -match "import com\.rnmaps\.maps\.MapsPackage") {
    Write-Host "ℹ️  MapsPackage import already exists!" -ForegroundColor Yellow
    Write-Host "   Manual linking is already in place." -ForegroundColor Gray
    Write-Host ""
    Write-Host "   If maps still not working, try:" -ForegroundColor Yellow
    Write-Host "   1. Delete android/.gradle android/app/build" -ForegroundColor Cyan
    Write-Host "   2. cd android; .\gradlew.bat clean; cd .." -ForegroundColor Cyan
    Write-Host "   3. npm run start:reset" -ForegroundColor Cyan
    Write-Host "   4. npm run android" -ForegroundColor Cyan
    exit 0
}

Write-Host "Step 1: Adding import statement..." -ForegroundColor Green

# Add import after other imports
if ($content -match "import com\.facebook\.react\.defaults\.DefaultReactNativeHost") {
    $content = $content -replace "(import com\.facebook\.react\.defaults\.DefaultReactNativeHost)", "`$1`nimport com.rnmaps.maps.MapsPackage"
    Write-Host "  ✅ Added import statement" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Could not find import location, adding at top of imports" -ForegroundColor Yellow
    $content = $content -replace "(package com\.pawspace)", "`$1`n`nimport com.rnmaps.maps.MapsPackage"
}

Write-Host ""
Write-Host "Step 2: Adding MapsPackage to packages list..." -ForegroundColor Green

# Find the packages list and add MapsPackage (escape parentheses in regex)
if ($content -match "override fun getPackages\(\): List<ReactPackage> =") {
    # Try to find PackageList().packages and add MapsPackage
    if ($content -match "PackageList\(this\)\.packages") {
        $content = $content -replace "(PackageList\(this\)\.packages)", "PackageList(this).packages.apply { add(MapsPackage()) }"
        Write-Host "  ✅ Added MapsPackage() to packages" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Could not automatically add to packages list" -ForegroundColor Yellow
        Write-Host "  Please manually add: packages.add(MapsPackage())" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  Could not find getPackages() method" -ForegroundColor Yellow
    Write-Host "  Please manually add MapsPackage() to your packages list" -ForegroundColor Yellow
}

# Write the modified content back
Set-Content $mainAppPath -Value $content -NoNewline

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "✅ MANUAL LINKING ADDED!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes made to: $mainAppPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Clean build:" -ForegroundColor White
Write-Host "   cd android" -ForegroundColor Cyan
Write-Host "   .\gradlew.bat clean" -ForegroundColor Cyan
Write-Host "   cd .." -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Start Metro:" -ForegroundColor White
Write-Host "   npm run start:reset" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Build Android:" -ForegroundColor White
Write-Host "   npm run android" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
