#!/usr/bin/env pwsh
# Test Location Fix - Automated Verification Script
# This script helps verify that the location race condition fix is working

Write-Host "🔍 Location Fix Verification Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "android")) {
    Write-Host "❌ Error: Run this script from apps/mobile directory" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Checking if app is running..." -ForegroundColor Yellow
$appRunning = adb shell "pidof com.mayur.pawspace" 2>$null
if ($appRunning) {
    Write-Host "✅ App is running (PID: $appRunning)" -ForegroundColor Green
} else {
    Write-Host "⚠️  App is not running - you need to start it first!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To start the app:" -ForegroundColor White
    Write-Host "  1. In one terminal: npx react-native start --reset-cache" -ForegroundColor Gray
    Write-Host "  2. In another terminal: npx react-native run-android" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Step 2: Monitoring location logs..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray
Write-Host ""
Write-Host "Looking for these patterns:" -ForegroundColor White
Write-Host "  ✅ GOOD: '📍 Starting NEW location watch #1' (appears ONCE)" -ForegroundColor Green
Write-Host "  ✅ GOOD: '⚠️  Watch already exists, reusing it'" -ForegroundColor Green
Write-Host "  ✅ GOOD: '📍 Location unchanged, skipping update'" -ForegroundColor Green
Write-Host "  ❌ BAD:  '📍 Location acquired' (multiple times at once)" -ForegroundColor Red
Write-Host ""
Write-Host "Starting log monitor in 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host ""
Write-Host "==================== LIVE LOGS ====================" -ForegroundColor Cyan

# Monitor logs and highlight important patterns
try {
    adb logcat -c # Clear logcat
    
    $watchCount = 0
    $locationAcquiredCount = 0
    $lastLocationTime = Get-Date
    
    adb logcat | ForEach-Object {
        $line = $_
        
        # Track "Starting NEW location watch" messages
        if ($line -match "Starting NEW location watch") {
            $watchCount++
            if ($watchCount -eq 1) {
                Write-Host "✅ GOOD: $line" -ForegroundColor Green
            } else {
                Write-Host "❌ BAD: Multiple watches detected! $line" -ForegroundColor Red
            }
        }
        
        # Track "Watch already exists" messages
        elseif ($line -match "Watch already exists, reusing it") {
            Write-Host "✅ GOOD: $line" -ForegroundColor Green
        }
        
        # Track "Location unchanged" messages
        elseif ($line -match "Location unchanged, skipping update") {
            Write-Host "✅ GOOD: $line" -ForegroundColor Green
        }
        
        # Track "Location watch updated" messages
        elseif ($line -match "Location watch updated") {
            $currentTime = Get-Date
            $timeDiff = ($currentTime - $lastLocationTime).TotalSeconds
            $lastLocationTime = $currentTime
            
            if ($timeDiff -lt 5 -and $locationAcquiredCount -gt 0) {
                Write-Host "⚠️  WARNING: Rapid location updates (${timeDiff}s): $line" -ForegroundColor Yellow
            } else {
                Write-Host "✅ GOOD: $line (after ${timeDiff}s)" -ForegroundColor Green
            }
            $locationAcquiredCount++
        }
        
        # Track old "Location acquired" messages (shouldn't appear)
        elseif ($line -match "📍 Location acquired") {
            Write-Host "❌ BAD: Old location fetch detected! $line" -ForegroundColor Red
        }
        
        # Track API calls to /map/location
        elseif ($line -match "POST /map/location") {
            Write-Host "🌐 API: $line" -ForegroundColor Cyan
        }
        
        # Show other location-related logs
        elseif ($line -match "location|Location|LOCATION" -and $line -notmatch "LocationRequest") {
            Write-Host $line -ForegroundColor Gray
        }
    }
} catch {
    Write-Host ""
    Write-Host "Monitoring stopped." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================== SUMMARY ====================" -ForegroundColor Cyan
Write-Host "Total 'Starting NEW location watch' messages: $watchCount" -ForegroundColor White
Write-Host ""

if ($watchCount -eq 1) {
    Write-Host "✅ SUCCESS: Only ONE location watch was created!" -ForegroundColor Green
    Write-Host "   This is the expected behavior. Fix is working!" -ForegroundColor Green
} elseif ($watchCount -gt 1) {
    Write-Host "❌ FAILURE: Multiple location watches detected ($watchCount total)" -ForegroundColor Red
    Write-Host "   The fix did NOT work. Need to investigate further." -ForegroundColor Red
} else {
    Write-Host "⚠️  INCONCLUSIVE: No location watch messages detected" -ForegroundColor Yellow
    Write-Host "   Try navigating to the Map screen in the app" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For more details, see: LOCATION_FIX_VERIFICATION.md" -ForegroundColor Gray
