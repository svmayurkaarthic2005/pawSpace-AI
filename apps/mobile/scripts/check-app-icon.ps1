#!/usr/bin/env pwsh
# Check if app is using custom icon or default Android icon

Write-Host "`n🔍 PawSpace App Icon Checker" -ForegroundColor Cyan
Write-Host "=" * 60

$resPath = "android/app/src/main/res"

# Check if mipmap folders exist
Write-Host "`n📁 Checking icon folders..." -ForegroundColor Yellow

$mipmapFolders = @("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi")
$allExist = $true

foreach ($folder in $mipmapFolders) {
    $path = Join-Path $resPath $folder
    if (Test-Path $path) {
        Write-Host "  ✓ $folder exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $folder missing!" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host "`n❌ Some mipmap folders are missing!" -ForegroundColor Red
    exit 1
}

# Check icon files and sizes
Write-Host "`n📊 Checking icon files..." -ForegroundColor Yellow

$defaultIconSizes = @{
    "mipmap-mdpi" = 5200      # ~5KB for default Android icon
    "mipmap-hdpi" = 7400      # ~7KB
    "mipmap-xhdpi" = 9700     # ~9KB
    "mipmap-xxhdpi" = 15000   # ~15KB
    "mipmap-xxxhdpi" = 22000  # ~22KB
}

$usingDefault = $true
$iconStats = @()

foreach ($folder in $mipmapFolders) {
    $iconPath = Join-Path $resPath "$folder/ic_launcher.png"
    
    if (Test-Path $iconPath) {
        $file = Get-Item $iconPath
        $size = $file.Length
        
        $iconStats += [PSCustomObject]@{
            Folder = $folder
            Size = $size
            SizeKB = [math]::Round($size / 1KB, 2)
            Status = if ($size -gt $defaultIconSizes[$folder] * 1.2) { "Custom" } else { "Default" }
        }
        
        if ($size -gt $defaultIconSizes[$folder] * 1.2) {
            $usingDefault = $false
        }
    } else {
        Write-Host "  ✗ ic_launcher.png missing in $folder" -ForegroundColor Red
    }
}

# Display results
Write-Host "`n" -NoNewline
$iconStats | Format-Table -AutoSize

# Final verdict
Write-Host "`n" + ("=" * 60)
if ($usingDefault) {
    Write-Host "❌ USING DEFAULT ANDROID ICON (Green Robot)" -ForegroundColor Red
    Write-Host @"

Your app is currently using the default Android launcher icon.
This makes your app look unprofessional and hard to recognize.

📖 Read: UPDATE_APP_ICON_GUIDE.md for step-by-step instructions
🎨 Quick fix: Use https://easyappicon.com/ to generate icons

Recommended design:
  - Background: Purple gradient (#7C3AED)
  - Icon: White paw print
  - Size: 1024x1024px base image

"@ -ForegroundColor Yellow
} else {
    Write-Host "✅ USING CUSTOM APP ICON" -ForegroundColor Green
    Write-Host @"

Your app has a custom launcher icon! 🎉

Make sure it:
  - Matches your brand (purple + paw theme)
  - Is recognizable at small sizes
  - Works well on different backgrounds

"@ -ForegroundColor Cyan
}

Write-Host ("=" * 60)

# Check round icons
Write-Host "`n🔄 Checking round icons..." -ForegroundColor Yellow
$hasRoundIcons = $true

foreach ($folder in $mipmapFolders) {
    $roundPath = Join-Path $resPath "$folder/ic_launcher_round.png"
    if (-not (Test-Path $roundPath)) {
        Write-Host "  ⚠ ic_launcher_round.png missing in $folder" -ForegroundColor Yellow
        $hasRoundIcons = $false
    }
}

if ($hasRoundIcons) {
    Write-Host "  ✓ All round icons present" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Some round icons missing (optional but recommended)" -ForegroundColor Yellow
}

# Check adaptive icons (Android 8.0+)
Write-Host "`n🎨 Checking adaptive icon support..." -ForegroundColor Yellow
$adaptivePath = Join-Path $resPath "mipmap-anydpi-v26"

if (Test-Path $adaptivePath) {
    Write-Host "  ✓ Adaptive icon folder exists" -ForegroundColor Green
    
    $adaptiveXml = Join-Path $adaptivePath "ic_launcher.xml"
    if (Test-Path $adaptiveXml) {
        Write-Host "  ✓ Adaptive icon configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Adaptive icon XML missing" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ No adaptive icon (Android 8.0+)" -ForegroundColor Yellow
    Write-Host "    This is optional but improves icon appearance on modern Android" -ForegroundColor Gray
}

Write-Host ""
