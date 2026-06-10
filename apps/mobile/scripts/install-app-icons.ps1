#!/usr/bin/env pwsh
# Install PawSpace app icons from EasyAppIcon download

param(
    [Parameter(Mandatory=$true)]
    [string]$IconFolder
)

Write-Host "`n🐾 Installing PawSpace App Icons" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if the icon folder exists
if (-not (Test-Path $IconFolder)) {
    Write-Host "❌ Error: Icon folder not found: $IconFolder" -ForegroundColor Red
    Write-Host "`nPlease provide the path to your extracted easyappicon folder." -ForegroundColor Yellow
    Write-Host "Example: ./scripts/install-app-icons.ps1 'C:\Downloads\easyappicon-icons-1781013175798'" -ForegroundColor Gray
    exit 1
}

Write-Host "✓ Found icon folder: $IconFolder" -ForegroundColor Green

# Look for Android folder
$androidFolder = Join-Path $IconFolder "android"
if (-not (Test-Path $androidFolder)) {
    # Try alternate paths
    $possiblePaths = @(
        Join-Path $IconFolder "Android",
        Join-Path $IconFolder "res",
        $IconFolder  # Icons might be directly in root
    )
    
    $found = $false
    foreach ($path in $possiblePaths) {
        if (Test-Path (Join-Path $path "mipmap-hdpi")) {
            $androidFolder = $path
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "❌ Error: Could not find Android icons in the folder" -ForegroundColor Red
        Write-Host "`nExpected structure:" -ForegroundColor Yellow
        Write-Host "  easyappicon-folder/" -ForegroundColor Gray
        Write-Host "    android/ (or Android/)" -ForegroundColor Gray
        Write-Host "      mipmap-mdpi/" -ForegroundColor Gray
        Write-Host "      mipmap-hdpi/" -ForegroundColor Gray
        Write-Host "      ..." -ForegroundColor Gray
        exit 1
    }
}

Write-Host "✓ Found Android icons folder" -ForegroundColor Green

# Define target directory
$targetRes = "android/app/src/main/res"

if (-not (Test-Path $targetRes)) {
    Write-Host "❌ Error: Target res folder not found: $targetRes" -ForegroundColor Red
    Write-Host "Make sure you're running this from apps/mobile directory" -ForegroundColor Yellow
    exit 1
}

# Backup existing icons
Write-Host "`n📦 Creating backup of existing icons..." -ForegroundColor Yellow
$backupFolder = "android/app/src/main/res/mipmap-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

$mipmapFolders = @("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi")
$backedUp = 0

foreach ($folder in $mipmapFolders) {
    $sourcePath = Join-Path $targetRes $folder
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $backupFolder $folder
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
        $backedUp++
    }
}

Write-Host "✓ Backed up $backedUp icon folders to: $backupFolder" -ForegroundColor Green

# Copy new icons
Write-Host "`n📥 Installing new PawSpace icons..." -ForegroundColor Yellow

$copiedFolders = 0
$copiedFiles = 0

foreach ($folder in $mipmapFolders) {
    $sourcePath = Join-Path $androidFolder $folder
    $destPath = Join-Path $targetRes $folder
    
    if (Test-Path $sourcePath) {
        # Create destination folder if it doesn't exist
        if (-not (Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
        
        # Copy icon files
        $iconFiles = Get-ChildItem -Path $sourcePath -Filter "*.png"
        foreach ($file in $iconFiles) {
            Copy-Item -Path $file.FullName -Destination $destPath -Force
            $copiedFiles++
        }
        
        Write-Host "  ✓ Installed icons in $folder" -ForegroundColor Green
        $copiedFolders++
    } else {
        Write-Host "  ⚠ Missing $folder in source" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Installation complete!" -ForegroundColor Green
Write-Host "  - Copied $copiedFiles icon files" -ForegroundColor Cyan
Write-Host "  - Updated $copiedFolders mipmap folders" -ForegroundColor Cyan

# Verify installation
Write-Host "`n🔍 Verifying installation..." -ForegroundColor Yellow

$allGood = $true
foreach ($folder in $mipmapFolders) {
    $iconPath = Join-Path $targetRes "$folder/ic_launcher.png"
    if (Test-Path $iconPath) {
        $file = Get-Item $iconPath
        $sizeKB = [math]::Round($file.Length / 1KB, 2)
        
        if ($sizeKB -gt 8) {
            Write-Host "  ✓ $folder - $sizeKB KB (Custom icon)" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ $folder - $sizeKB KB (Seems small, might be default)" -ForegroundColor Yellow
            $allGood = $false
        }
    } else {
        Write-Host "  ✗ $folder - ic_launcher.png missing!" -ForegroundColor Red
        $allGood = $false
    }
}

if ($allGood) {
    Write-Host "`n🎉 All icons installed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n⚠ Some icons may not have installed correctly" -ForegroundColor Yellow
}

# Next steps
Write-Host "`n" + ("=" * 60)
Write-Host "📱 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Clean Android build:" -ForegroundColor White
Write-Host "   cd android" -ForegroundColor Gray
Write-Host "   ./gradlew clean" -ForegroundColor Gray
Write-Host "   cd .." -ForegroundColor Gray
Write-Host ""
Write-Host "2. Rebuild and run the app:" -ForegroundColor White
Write-Host "   npx react-native run-android" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check your emulator/device app drawer" -ForegroundColor White
Write-Host "   You should see the new PawSpace icon! 🐾" -ForegroundColor Green
Write-Host ""
Write-Host "4. If icons don't appear, try:" -ForegroundColor White
Write-Host "   - Uninstall the app completely" -ForegroundColor Gray
Write-Host "   - Rebuild with: npx react-native run-android" -ForegroundColor Gray
Write-Host "   - Some launchers cache icons - restart device if needed" -ForegroundColor Gray
Write-Host ""
Write-Host ("=" * 60)
Write-Host "✨ Your app will look professional with the custom icon!" -ForegroundColor Green
Write-Host ""
