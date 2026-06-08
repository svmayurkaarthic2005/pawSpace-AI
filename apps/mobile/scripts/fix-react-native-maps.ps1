# ============================================================================
# React Native Maps Fix Script for Windows
# Fixes RNMapsAirModule native linking issue
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "React Native Maps Native Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

# Step 1: Stop Metro
Write-Host "[1/10] Stopping Metro Bundler..." -ForegroundColor Yellow
$metroProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*react-native*start*"
}
if ($metroProcess) {
    Stop-Process -Id $metroProcess.Id -Force
    Write-Host "✓ Metro stopped" -ForegroundColor Green
} else {
    Write-Host "✓ Metro not running" -ForegroundColor Green
}
Start-Sleep -Seconds 2

# Step 2: Clean Android build caches
Write-Host "`n[2/10] Cleaning Android build caches..." -ForegroundColor Yellow
Set-Location "$projectRoot\android"

if (Test-Path ".\gradlew.bat") {
    & .\gradlew.bat clean
    Write-Host "✓ Gradle clean completed" -ForegroundColor Green
} else {
    Write-Host "✗ gradlew.bat not found!" -ForegroundColor Red
    exit 1
}

# Clean additional Android caches
$androidCacheDirs = @(
    "$projectRoot\android\.gradle",
    "$projectRoot\android\app\build",
    "$projectRoot\android\build"
)

foreach ($dir in $androidCacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force
        Write-Host "✓ Removed $dir" -ForegroundColor Green
    }
}

Set-Location $projectRoot

# Step 3: Clean node_modules
Write-Host "`n[3/10] Cleaning node_modules..." -ForegroundColor Yellow
if (Test-Path ".\node_modules") {
    Remove-Item -Path ".\node_modules" -Recurse -Force
    Write-Host "✓ node_modules removed" -ForegroundColor Green
} else {
    Write-Host "✓ node_modules already clean" -ForegroundColor Green
}

# Step 4: Clean npm cache
Write-Host "`n[4/10] Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "✓ npm cache cleaned" -ForegroundColor Green

# Step 5: Install compatible react-native-maps version
Write-Host "`n[5/10] Installing compatible react-native-maps..." -ForegroundColor Yellow
Write-Host "Installing react-native-maps@1.18.0 (tested for RN 0.73)" -ForegroundColor Cyan
npm install react-native-maps@1.18.0 --save-exact
Write-Host "✓ react-native-maps installed" -ForegroundColor Green

# Step 6: Install all dependencies
Write-Host "`n[6/10] Installing all dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Step 7: Verify react-native-maps exists
Write-Host "`n[7/10] Verifying react-native-maps installation..." -ForegroundColor Yellow
if (Test-Path ".\node_modules\react-native-maps") {
    Write-Host "✓ react-native-maps found in node_modules" -ForegroundColor Green
} else {
    Write-Host "✗ react-native-maps NOT found!" -ForegroundColor Red
    exit 1
}

# Step 8: Verify newArchEnabled is false
Write-Host "`n[8/10] Verifying New Architecture is disabled..." -ForegroundColor Yellow
$gradleProps = Get-Content "$projectRoot\android\gradle.properties" -Raw
if ($gradleProps -match "newArchEnabled\s*=\s*false") {
    Write-Host "✓ newArchEnabled=false confirmed" -ForegroundColor Green
} else {
    Write-Host "⚠ Setting newArchEnabled=false..." -ForegroundColor Yellow
    $gradleProps = $gradleProps -replace "newArchEnabled\s*=\s*true", "newArchEnabled=false"
    Set-Content "$projectRoot\android\gradle.properties" -Value $gradleProps
    Write-Host "✓ newArchEnabled set to false" -ForegroundColor Green
}

# Step 9: Clean Metro bundler cache
Write-Host "`n[9/10] Cleaning Metro bundler cache..." -ForegroundColor Yellow
if (Test-Path "$env:LOCALAPPDATA\Temp\metro-*") {
    Remove-Item -Path "$env:LOCALAPPDATA\Temp\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "✓ Metro cache cleaned" -ForegroundColor Green

# Step 10: Instructions for rebuild
Write-Host "`n[10/10] Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS - READ CAREFULLY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. REBUILD the Android app (DO NOT just reload):" -ForegroundColor Yellow
Write-Host "   npx react-native run-android" -ForegroundColor White
Write-Host ""
Write-Host "2. If you see 'RNMapsAirModule' error STILL:" -ForegroundColor Yellow
Write-Host "   a. Uninstall the app from emulator completely" -ForegroundColor White
Write-Host "   b. Run: adb uninstall com.mayur.pawspace" -ForegroundColor White
Write-Host "   c. Rebuild: npx react-native run-android" -ForegroundColor White
Write-Host ""
Write-Host "3. For emulator location timeout:" -ForegroundColor Yellow
Write-Host "   a. Open emulator Extended Controls (...)" -ForegroundColor White
Write-Host "   b. Go to Location tab" -ForegroundColor White
Write-Host "   c. Set location manually (e.g., 13.0827, 80.2707)" -ForegroundColor White
Write-Host "   d. Click 'Send Location'" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
