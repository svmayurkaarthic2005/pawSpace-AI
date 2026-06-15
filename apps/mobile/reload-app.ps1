# Reload React Native app on device

Write-Host "Reloading app on device..." -ForegroundColor Cyan

# Method 1: Send reload command via ADB
adb shell input text "RR"

# Alternative: Open dev menu and press reload
# adb shell input keyevent 82
# Start-Sleep -Milliseconds 500
# adb shell input keyevent 66

Write-Host "✓ Reload command sent" -ForegroundColor Green
Write-Host "If the app doesn't reload, shake your device and press 'Reload'" -ForegroundColor Yellow
