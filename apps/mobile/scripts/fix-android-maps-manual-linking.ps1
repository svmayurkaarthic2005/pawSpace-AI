#!/usr/bin/env pwsh
# ============================================================================
# Manual Android Maps Linking Script (For Monorepo)
# ============================================================================
# This script manually links react-native-maps when autolinking fails
# ============================================================================

Write-Host "🔧 Adding Manual React Native Maps Linking..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileDir = Split-Path -Parent $scriptDir

Set-Location $mobileDir

Write-Host "📍 Working directory: $mobileDir" -ForegroundColor Yellow
Write-Host ""

# Step 1: Modify settings.gradle
Write-Host "Step 1: Updating android/settings.gradle..." -ForegroundColor Green
$settingsGradle = "android/settings.gradle"

if (-not (Test-Path $settingsGradle)) {
    Write-Host "  ❌ ERROR: Cannot find android/settings.gradle" -ForegroundColor Red
    exit 1
}

$settingsContent = Get-Content $settingsGradle -Raw

# Check if already manually linked
if ($settingsContent -match "react-native-maps") {
    Write-Host "  ℹ️  react-native-maps already in settings.gradle" -ForegroundColor Cyan
} else {
    Write-Host "  Adding react-native-maps to settings.gradle..." -ForegroundColor Yellow
    
    # Add at the end of the file
    $mapsInclude = @"

// Manual linking for react-native-maps (monorepo fix)
include ':react-native-maps'
project(':react-native-maps').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-maps/lib/android')
"@
    
    Add-Content $settingsGradle $mapsInclude
    Write-Host "  ✅ Added react-native-maps to settings.gradle" -ForegroundColor Green
}
Write-Host ""

# Step 2: Modify app/build.gradle
Write-Host "Step 2: Updating android/app/build.gradle..." -ForegroundColor Green
$appBuildGradle = "android/app/build.gradle"

if (-not (Test-Path $appBuildGradle)) {
    Write-Host "  ❌ ERROR: Cannot find android/app/build.gradle" -ForegroundColor Red
    exit 1
}

$buildContent = Get-Content $appBuildGradle -Raw

# Check if already has the dependency
if ($buildContent -match "project\(':react-native-maps'\)") {
    Write-Host "  ℹ️  react-native-maps already in build.gradle dependencies" -ForegroundColor Cyan
} else {
    Write-Host "  Adding react-native-maps to dependencies..." -ForegroundColor Yellow
    
    # Find dependencies block and add
    if ($buildContent -match "dependencies \{") {
        $buildContent = $buildContent -replace "(dependencies \{)", "`$1`n    implementation project(':react-native-maps')"
        Set-Content $appBuildGradle -Value $buildContent -NoNewline
        Write-Host "  ✅ Added react-native-maps to dependencies" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Could not find dependencies block" -ForegroundColor Yellow
        Write-Host "  Please manually add: implementation project(':react-native-maps')" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 3: Modify MainApplication.kt
Write-Host "Step 3: Updating MainApplication.kt..." -ForegroundColor Green

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
    Write-Host "  ❌ ERROR: Cannot find MainApplication.kt" -ForegroundColor Red
    exit 1
}

Write-Host "  Found: $mainAppPath" -ForegroundColor Cyan

$mainAppContent = Get-Content $mainAppPath -Raw

# Check if already has import
if ($mainAppContent -match "com\.rnmaps\.maps\.MapsPackage") {
    Write-Host "  ℹ️  MapsPackage import already present" -ForegroundColor Cyan
} else {
    Write-Host "  Adding MapsPackage import..." -ForegroundColor Yellow
    
    # Add import after other imports
    if ($mainAppContent -match "import com\.facebook\.react\.defaults\.DefaultReactNativeHost") {
        $mainAppContent = $mainAppContent -replace "(import com\.facebook\.react\.defaults\.DefaultReactNativeHost)", "`$1`nimport com.rnmaps.maps.MapsPackage"
        Write-Host "  ✅ Added MapsPackage import" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Could not find import location" -ForegroundColor Yellow
    }
    
    # Add to packages list
    Write-Host "  Adding MapsPackage to packages list..." -ForegroundColor Yellow
    
    if ($mainAppContent -match "PackageList\(this\)\.packages") {
        # Try to add .apply { add(MapsPackage()) }
        $mainAppContent = $mainAppContent -replace "(PackageList\(this\)\.packages)(?!\.apply)", "`$1.apply { add(MapsPackage()) }"
        Write-Host "  ✅ Added MapsPackage to packages" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Could not find packages list" -ForegroundColor Yellow
        Write-Host "  Please manually add: packages.add(MapsPackage())" -ForegroundColor Yellow
    }
    
    Set-Content $mainAppPath -Value $mainAppContent -NoNewline
}
Write-Host ""

# Step 4: Clean and rebuild
Write-Host "Step 4: Cleaning Android build..." -ForegroundColor Green
Set-Location "android"
if (Test-Path "gradlew.bat") {
    Write-Host "  Running gradlew clean..." -ForegroundColor Yellow
    .\gradlew.bat clean
    Write-Host "  ✅ Gradle cleaned" -ForegroundColor Green
}
Set-Location ..
Write-Host ""

# Final instructions
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "✅ MANUAL LINKING COMPLETE!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files modified:" -ForegroundColor Yellow
Write-Host "  - android/settings.gradle" -ForegroundColor Gray
Write-Host "  - android/app/build.gradle" -ForegroundColor Gray
Write-Host "  - $mainAppPath" -ForegroundColor Gray
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Metro:" -ForegroundColor White
Write-Host "   npm run start:reset" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Build Android (in new terminal):" -ForegroundColor White
Write-Host "   npm run android" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Check logs for 'RNMapsAirModule' errors" -ForegroundColor White
Write-Host ""
Write-Host "If build fails, check:" -ForegroundColor Yellow
Write-Host "  - Gradle sync errors in Android Studio" -ForegroundColor Gray
Write-Host "  - Module path in settings.gradle" -ForegroundColor Gray
Write-Host "  - Google Maps API key in AndroidManifest.xml" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
