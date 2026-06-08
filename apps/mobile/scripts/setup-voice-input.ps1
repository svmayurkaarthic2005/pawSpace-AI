# Voice Input Setup Script for Windows
# This script installs and configures voice recognition for PawSpace

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SETTING UP VOICE INPUT FOR PAWSPACE                          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"
$mobileDir = Split-Path -Parent $PSScriptRoot

# Step 1: Install voice package
Write-Host "[1/3] Installing @react-native-voice/voice package..." -ForegroundColor Yellow
Set-Location $mobileDir

try {
    npm install @react-native-voice/voice
    Write-Host "  ✓ Voice package installed successfully`n" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to install voice package" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Check Android permissions
Write-Host "[2/3] Checking Android permissions..." -ForegroundColor Yellow
$manifestPath = "$mobileDir/android/app/src/main/AndroidManifest.xml"

if (Test-Path $manifestPath) {
    $manifestContent = Get-Content $manifestPath -Raw
    
    if ($manifestContent -match 'RECORD_AUDIO') {
        Write-Host "  ✓ RECORD_AUDIO permission already added`n" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ RECORD_AUDIO permission missing`n" -ForegroundColor Yellow
        Write-Host "  The permission should already be added. If voice input doesn't work," -ForegroundColor Gray
        Write-Host "  please verify this line exists in AndroidManifest.xml:" -ForegroundColor Gray
        Write-Host '  <uses-permission android:name="android.permission.RECORD_AUDIO" />' -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "  ⚠ AndroidManifest.xml not found at expected location`n" -ForegroundColor Yellow
}

# Step 3: Complete
Write-Host "[3/3] Setup complete!`n" -ForegroundColor Green

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  NEXT STEPS                                                    ║" -ForegroundColor Cyan
Write-Host "╠═══════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  1. Rebuild the app:                                          ║" -ForegroundColor White
Write-Host "║     npx react-native run-android                              ║" -ForegroundColor Gray
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  2. Test voice input:                                         ║" -ForegroundColor White
Write-Host "║     - Go to Discover tab                                      ║" -ForegroundColor Gray
Write-Host "║     - Tap microphone icon                                     ║" -ForegroundColor Gray
Write-Host "║     - Speak your search query                                 ║" -ForegroundColor Gray
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  3. Grant microphone permission when prompted                 ║" -ForegroundColor White
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  For detailed documentation, see:                             ║" -ForegroundColor White
Write-Host "║     VOICE_INPUT_DISCOVER_FIX.md                               ║" -ForegroundColor Gray
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
