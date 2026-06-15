# Android Build Script for Samsung M31
# This script builds and installs the app on your connected device

Write-Host "Building PawSpace for Android..." -ForegroundColor Green
Write-Host "Compatible with Samsung Galaxy M31" -ForegroundColor Cyan

# Build and install
npx react-native run-android --no-packager

Write-Host "`nBuild complete! The app should be installing on your Samsung M31..." -ForegroundColor Green
