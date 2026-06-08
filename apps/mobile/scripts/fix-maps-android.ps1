# React Native Maps Android Fix Script
# This script fixes the native module linking issue for react-native-maps

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  FIXING REACT-NATIVE-MAPS FOR ANDROID                        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"
$mobileDir = Split-Path -Parent $PSScriptRoot

# Step 1: Stop any running Metro bundler
Write-Host "[1/7] Stopping Metro bundler..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Metro bundler stopped" -ForegroundColor Green
} catch {
    Write-Host "  ℹ No Metro bundler running" -ForegroundColor Gray
}

# Step 2: Check if react-native-maps is installed
Write-Host "`n[2/7] Checking react-native-maps installation..." -ForegroundColor Yellow
$packageJson = Get-Content "$mobileDir/package.json" -Raw | ConvertFrom-Json
$mapsVersion = $packageJson.dependencies."react-native-maps"

if ($mapsVersion) {
    Write-Host "  ✓ react-native-maps@$mapsVersion found" -ForegroundColor Green
} else {
    Write-Host "  ✗ react-native-maps not found in package.json" -ForegroundColor Red
    Write-Host "  Installing react-native-maps..." -ForegroundColor Yellow
    Set-Location $mobileDir
    npm install react-native-maps@latest
}

# Step 3: Clean Android build
Write-Host "`n[3/7] Cleaning Android build..." -ForegroundColor Yellow
Set-Location "$mobileDir/android"

if (Test-Path "./gradlew.bat") {
    Write-Host "  Running: gradlew.bat clean" -ForegroundColor Gray
    & cmd /c "gradlew.bat clean"
    Write-Host "  ✓ Android build cleaned" -ForegroundColor Green
} else {
    Write-Host "  ✗ gradlew.bat not found" -ForegroundColor Red
    exit 1
}

# Step 4: Clean build folders
Write-Host "`n[4/7] Removing build artifacts..." -ForegroundColor Yellow
$foldersToDelete = @(
    "$mobileDir/android/app/build",
    "$mobileDir/android/build",
    "$mobileDir/android/.gradle"
)

foreach ($folder in $foldersToDelete) {
    if (Test-Path $folder) {
        Write-Host "  Removing: $folder" -ForegroundColor Gray
        Remove-Item -Recurse -Force $folder -ErrorAction SilentlyContinue
        Write-Host "    ✓ Removed" -ForegroundColor Green
    }
}

# Step 5: Clear Metro cache
Write-Host "`n[5/7] Clearing Metro bundler cache..." -ForegroundColor Yellow
Set-Location $mobileDir
$cacheFolders = @(
    "$env:TEMP/metro-*",
    "$env:TEMP/haste-map-*",
    "$mobileDir/node_modules/.cache"
)

foreach ($cache in $cacheFolders) {
    if (Test-Path $cache) {
        Write-Host "  Removing: $cache" -ForegroundColor Gray
        Remove-Item -Recurse -Force $cache -ErrorAction SilentlyContinue
    }
}

# Also clear watchman if available
Write-Host "  Clearing watchman cache..." -ForegroundColor Gray
try {
    & watchman watch-del-all 2>&1 | Out-Null
    Write-Host "    ✓ Watchman cache cleared" -ForegroundColor Green
} catch {
    Write-Host "    ℹ Watchman not available (optional)" -ForegroundColor Gray
}

Write-Host "  ✓ Metro cache cleared" -ForegroundColor Green

# Step 6: Verify Google Maps API Key
Write-Host "`n[6/7] Verifying Google Maps configuration..." -ForegroundColor Yellow
$manifestPath = "$mobileDir/android/app/src/main/AndroidManifest.xml"
$manifestContent = Get-Content $manifestPath -Raw

if ($manifestContent -match 'com\.google\.android\.geo\.API_KEY') {
    Write-Host "  ✓ Google Maps API key meta-data found" -ForegroundColor Green
    
    if ($manifestContent -match 'AIza[A-Za-z0-9_-]{35}') {
        Write-Host "  ✓ Valid API key format detected" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ API key might be invalid or empty" -ForegroundColor Yellow
        Write-Host "    Please check: $manifestPath" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ Google Maps API key meta-data missing" -ForegroundColor Red
    Write-Host "    Add this inside <application> tag in AndroidManifest.xml:" -ForegroundColor Yellow
    Write-Host "    <meta-data" -ForegroundColor Gray
    Write-Host "      android:name=`"com.google.android.geo.API_KEY`"" -ForegroundColor Gray
    Write-Host "      android:value=`"YOUR_GOOGLE_MAPS_API_KEY`"/>" -ForegroundColor Gray
}

# Step 7: Show next steps
Write-Host "`n[7/7] Setup complete!" -ForegroundColor Green
Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  NEXT STEPS                                                   ║" -ForegroundColor Cyan
Write-Host "╠═══════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  1. Start Metro bundler in a NEW terminal:                   ║" -ForegroundColor White
Write-Host "║     cd apps/mobile                                            ║" -ForegroundColor Gray
Write-Host "║     npx react-native start --reset-cache                      ║" -ForegroundColor Gray
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  2. Keep Metro terminal running, then in ANOTHER terminal:    ║" -ForegroundColor White
Write-Host "║     cd apps/mobile                                            ║" -ForegroundColor Gray
Write-Host "║     npx react-native run-android                              ║" -ForegroundColor Gray
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  3. Wait for the build to complete (may take 5-10 minutes)    ║" -ForegroundColor White
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
