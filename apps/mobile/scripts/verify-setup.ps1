# Simple Map Discovery Setup Verification Script

Write-Host "PawSpace Map Discovery - Setup Verification" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] Please run from apps/mobile directory" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Running from correct directory" -ForegroundColor Green

# Check .env
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "GOOGLE_MAPS_API_KEY=([^\s]+)") {
        $key = $matches[1]
        if ($key -and $key -ne "your_google_maps_api_key_here") {
            Write-Host "[OK] GOOGLE_MAPS_API_KEY configured" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Set GOOGLE_MAPS_API_KEY in .env" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARN] Add GOOGLE_MAPS_API_KEY to .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARN] No .env file - copy from .env.example" -ForegroundColor Yellow
}

Write-Host ""

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" -Raw

$deps = @(
    "react-native-maps",
    "@gorhom/bottom-sheet",
    "@react-native-community/slider",
    "react-native-permissions"
)

$allFound = $true
foreach ($dep in $deps) {
    $escapedDep = [regex]::Escape($dep)
    if ($packageJson -match $escapedDep) {
        Write-Host "  [OK] $dep" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $dep" -ForegroundColor Red
        $allFound = $false
    }
}

if ($allFound) {
    Write-Host ""
    Write-Host "[OK] All dependencies installed" -ForegroundColor Green
}

Write-Host ""

# iOS check
Write-Host "iOS Configuration:" -ForegroundColor Cyan
if (Test-Path "ios/Podfile") {
    $podfile = Get-Content "ios/Podfile" -Raw
    if ($podfile -match "react-native-google-maps") {
        Write-Host "  [OK] Podfile configured" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Podfile needs react-native-google-maps" -ForegroundColor Yellow
    }
    Write-Host "  Run: cd ios; pod install" -ForegroundColor Cyan
}

Write-Host ""

# Android check
Write-Host "Android Configuration:" -ForegroundColor Cyan
if (Test-Path "android/app/build.gradle") {
    $buildGradle = Get-Content "android/app/build.gradle" -Raw
    if ($buildGradle -match "GOOGLE_MAPS_API_KEY") {
        Write-Host "  [OK] build.gradle configured" -ForegroundColor Green
    }
}

if (Test-Path "android/app/src/main/AndroidManifest.xml") {
    $manifest = Get-Content "android/app/src/main/AndroidManifest.xml" -Raw
    if ($manifest -match "com.google.android.geo.API_KEY") {
        Write-Host "  [OK] AndroidManifest.xml configured" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "[DONE] Setup verification complete" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Add Google Maps API key to .env"
Write-Host "  2. iOS: cd ios; pod install"
Write-Host "  3. Run: npx react-native run-android (or run-ios)"
Write-Host ""
