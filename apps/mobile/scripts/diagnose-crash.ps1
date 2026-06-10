# PawSpace Android Crash Diagnostic Script
# Run this to capture real-time crash logs

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PawSpace Crash Diagnostic Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if adb is available
$adbExists = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adbExists) {
    Write-Host "ERROR: adb not found. Please install Android SDK Platform Tools." -ForegroundColor Red
    exit 1
}

# Get connected devices
Write-Host "Checking for connected devices..." -ForegroundColor Yellow
$devices = adb devices
Write-Host $devices
Write-Host ""

# Clear logcat
Write-Host "Clearing old logs..." -ForegroundColor Yellow
adb logcat -c
Write-Host "Logs cleared." -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NOW OPEN THE APP ON YOUR DEVICE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Capturing crash logs (filtering for errors)..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop logging" -ForegroundColor Gray
Write-Host ""

# Start capturing logs with filters for common crash causes
adb logcat -v time `
    AndroidRuntime:E `
    ReactNativeJS:V `
    ReactNative:V `
    PawSpace:V `
    *:F `
    *:E
