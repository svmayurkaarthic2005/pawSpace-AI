# Map Discovery Setup Script for PawSpace (PowerShell)
# This script helps set up Google Maps integration

$ErrorActionPreference = "Stop"

Write-Host "🗺️  PawSpace Map Discovery Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if running from correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from apps/mobile directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Running from correct directory" -ForegroundColor Green
Write-Host ""

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Add your Google Maps API key to .env:" -ForegroundColor Yellow
    Write-Host "   GOOGLE_MAPS_API_KEY=your_api_key_here"
    Write-Host ""
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Check if GOOGLE_MAPS_API_KEY is set
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "GOOGLE_MAPS_API_KEY=(.+)") {
        $key = $matches[1].Trim()
        if ([string]::IsNullOrWhiteSpace($key) -or $key -eq "your_google_maps_api_key_here") {
            Write-Host "⚠️  GOOGLE_MAPS_API_KEY not set in .env" -ForegroundColor Yellow
            Write-Host "   Please add your API key: GOOGLE_MAPS_API_KEY=your_api_key_here"
        } else {
            Write-Host "✅ GOOGLE_MAPS_API_KEY is configured" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  GOOGLE_MAPS_API_KEY not found in .env" -ForegroundColor Yellow
        Write-Host "   Please add: GOOGLE_MAPS_API_KEY=your_api_key_here"
    }
}
Write-Host ""

# Check dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Cyan

$deps = @(
    "react-native-maps",
    "@gorhom/bottom-sheet",
    "@react-native-community/slider",
    "react-native-permissions",
    "react-native-haptic-feedback",
    "react-native-map-clustering",
    "@react-native-community/geolocation"
)

$packageJson = Get-Content "package.json" -Raw
$missingDeps = @()

foreach ($dep in $deps) {
    if ($packageJson -match [regex]::Escape("`"$dep`"")) {
        Write-Host "  OK $dep" -ForegroundColor Green
    } else {
        Write-Host "  MISSING $dep" -ForegroundColor Red
        $missingDeps += $dep
    }
}

if ($missingDeps.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Some dependencies are missing. Install with:" -ForegroundColor Yellow
    Write-Host "   npm install --legacy-peer-deps $($missingDeps -join ' ')"
    exit 1
}

Write-Host ""
Write-Host "✅ All dependencies installed" -ForegroundColor Green
Write-Host ""

# iOS Setup
Write-Host "🍎 iOS Setup" -ForegroundColor Cyan
Write-Host "------------" -ForegroundColor Cyan

if (Test-Path "ios") {
    Write-Host "  ✅ iOS folder exists" -ForegroundColor Green
    
    if (Test-Path "ios/Podfile") {
        $podfile = Get-Content "ios/Podfile" -Raw
        if ($podfile -match "react-native-google-maps") {
            Write-Host "  ✅ Podfile has react-native-google-maps" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Podfile missing react-native-google-maps" -ForegroundColor Yellow
        }
    }
    
    if (Test-Path "ios/myapp/Info.plist") {
        $infoPlist = Get-Content "ios/myapp/Info.plist" -Raw
        if ($infoPlist -match "NSLocationWhenInUseUsageDescription") {
            Write-Host "  ✅ Info.plist has location permissions" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Info.plist missing location permissions" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "  Run: cd ios; pod install" -ForegroundColor Cyan
} else {
    Write-Host "  ⚠️  iOS folder not found" -ForegroundColor Yellow
}

Write-Host ""

# Android Setup
Write-Host "🤖 Android Setup" -ForegroundColor Cyan
Write-Host "----------------" -ForegroundColor Cyan

if (Test-Path "android") {
    Write-Host "  ✅ Android folder exists" -ForegroundColor Green
    
    if (Test-Path "android/app/build.gradle") {
        $buildGradle = Get-Content "android/app/build.gradle" -Raw
        if ($buildGradle -match "GOOGLE_MAPS_API_KEY") {
            Write-Host "  ✅ build.gradle has GOOGLE_MAPS_API_KEY placeholder" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  build.gradle missing GOOGLE_MAPS_API_KEY" -ForegroundColor Yellow
        }
    }
    
    if (Test-Path "android/app/src/main/AndroidManifest.xml") {
        $manifest = Get-Content "android/app/src/main/AndroidManifest.xml" -Raw
        if ($manifest -match "com.google.android.geo.API_KEY") {
            Write-Host "  ✅ AndroidManifest.xml has Google Maps API key" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  AndroidManifest.xml missing Google Maps API key meta-data" -ForegroundColor Yellow
        }
        
        if ($manifest -match "ACCESS_FINE_LOCATION") {
            Write-Host "  ✅ AndroidManifest.xml has location permissions" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  AndroidManifest.xml missing location permissions" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  ⚠️  Android folder not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Setup check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Add Google Maps API key to .env"
Write-Host "   2. iOS: cd ios && pod install"
Write-Host "   3. Run: npx react-native run-android or run-ios"
Write-Host ""
Write-Host "Documentation: MAP_DISCOVERY_SETUP.md" -ForegroundColor Cyan
Write-Host ""
