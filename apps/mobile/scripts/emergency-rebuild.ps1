#!/usr/bin/env pwsh

Write-Host ""
Write-Host "🚨 EMERGENCY REBUILD - Fixing Location Race Condition" -ForegroundColor Red
Write-Host ""

# Navigate to mobile directory
Set-Location -Path "$PSScriptRoot/.."

Write-Host "⏸️  Step 1: Stopping all processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>&1 | Out-Null
cd android
.\gradlew --stop 2>&1 | Out-Null
cd ..
Write-Host "✅ Stopped" -ForegroundColor Green

Write-Host ""
Write-Host "🗑️  Step 2: Uninstalling old app..." -ForegroundColor Yellow
adb uninstall com.mayur.pawspace 2>&1 | Out-Null
Write-Host "✅ Uninstalled" -ForegroundColor Green

Write-Host ""
Write-Host "🧹 Step 3: Cleaning build artifacts..." -ForegroundColor Yellow
Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Cleaned" -ForegroundColor Green

Write-Host ""
Write-Host "📱 Step 4: Rebuilding app..." -ForegroundColor Yellow
Write-Host "   This will take 3-5 minutes. Please wait..." -ForegroundColor Cyan
npx react-native run-android --reset-cache

Write-Host ""
Write-Host "✅ Rebuild complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 What to look for in logs:" -ForegroundColor Cyan
Write-Host "   ✅ GOOD: '📍 Starting NEW location watch #1'" -ForegroundColor Green
Write-Host "   ✅ GOOD: '📍 Location unchanged, skipping update'" -ForegroundColor Green
Write-Host "   ✅ GOOD: Single /map/location API calls" -ForegroundColor Green
Write-Host ""
Write-Host "   ❌ BAD: Multiple '📍 Location acquired' at once" -ForegroundColor Red
Write-Host "   ❌ BAD: 4+ /map/location API calls at once" -ForegroundColor Red
Write-Host ""
Write-Host "💰 Expected: 75% reduction in API calls!" -ForegroundColor Yellow
Write-Host ""
