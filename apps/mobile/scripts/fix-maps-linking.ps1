#!/usr/bin/env pwsh
# Fix React Native Maps AIRMap Native Component Linking Issue

Write-Host "🔧 React Native Maps - Native Module Linking Fix" -ForegroundColor Cyan
Write-Host "=" * 60

# Step 1: Verify package.json
Write-Host "`n📦 Step 1: Verifying react-native-maps in package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$mapsVersion = $packageJson.dependencies.'react-native-maps'
if ($mapsVersion) {
    Write-Host "✓ react-native-maps found: $mapsVersion" -ForegroundColor Green
} else {
    Write-Host "✗ react-native-maps NOT found in dependencies!" -ForegroundColor Red
    exit 1
}

# Step 2: Check autolinking configuration
Write-Host "`n🔗 Step 2: Checking autolinking configuration..." -ForegroundColor Yellow
npx react-native config | Select-String -Pattern "react-native-maps"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ react-native-maps is configured for autolinking" -ForegroundColor Green
} else {
    Write-Host "⚠ Could not verify autolinking (this might be OK)" -ForegroundColor Yellow
}

# Step 3: Verify API key in gradle.properties
Write-Host "`n🔑 Step 3: Verifying Google Maps API key..." -ForegroundColor Yellow
$apiKeyLine = Select-String -Path "android/gradle.properties" -Pattern "MAPS_API_KEY"
if ($apiKeyLine) {
    Write-Host "✓ MAPS_API_KEY found in gradle.properties" -ForegroundColor Green
} else {
    Write-Host "✗ MAPS_API_KEY NOT found in gradle.properties!" -ForegroundColor Red
    exit 1
}

# Step 4: Clean Android build
Write-Host "`n🧹 Step 4: Cleaning Android build cache..." -ForegroundColor Yellow
Push-Location android
Write-Host "Running: ./gradlew clean" -ForegroundColor Gray
./gradlew clean
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Android build cleaned successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Clean failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Step 5: Clean Metro cache
Write-Host "`n🧹 Step 5: Cleaning Metro bundler cache..." -ForegroundColor Yellow
Remove-Item -Path "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\react-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\haste-map-*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ Metro cache cleaned" -ForegroundColor Green

# Step 6: Clean node_modules cache (optional but recommended)
Write-Host "`n🧹 Step 6: Cleaning watchman and node caches..." -ForegroundColor Yellow
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all
    Write-Host "✓ Watchman cache cleared" -ForegroundColor Green
} else {
    Write-Host "⚠ Watchman not installed (skipping)" -ForegroundColor Yellow
}

# Step 7: Rebuild the app
Write-Host "`n🔨 Step 7: Rebuilding Android app..." -ForegroundColor Yellow
Write-Host @"

Starting React Native with fresh build...
This will:
1. Start Metro bundler with reset cache
2. Build Android native modules (including react-native-maps)
3. Install APK to emulator/device

This may take 5-10 minutes...
"@ -ForegroundColor Cyan

# Start Metro in background
Write-Host "`nStarting Metro bundler..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx react-native start --reset-cache" -WindowStyle Normal

# Wait for Metro to start
Write-Host "Waiting 10 seconds for Metro to start..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Build and run Android
Write-Host "`nBuilding and running Android app..." -ForegroundColor Gray
npx react-native run-android

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! App rebuilt and installed." -ForegroundColor Green
    Write-Host @"

The native react-native-maps module should now be properly linked.
If you still see the AIRMap error:

1. Check LogCat for detailed error messages
2. Verify Google Maps SDK for Android is enabled in Google Cloud Console
3. Make sure your API key has no restrictions blocking localhost/emulator
4. Try uninstalling the app completely and running this script again

"@ -ForegroundColor Yellow
} else {
    Write-Host "`n✗ Build failed! Check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "`n" + ("=" * 60)
Write-Host "Done! Check your emulator/device." -ForegroundColor Cyan
