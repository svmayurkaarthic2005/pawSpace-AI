#!/usr/bin/env pwsh
# Interactive script to copy PawSpace app icons

Write-Host "`n🐾 PawSpace App Icon Installer" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host "`nPlease drag and drop your easyappicon folder here and press Enter:" -ForegroundColor Yellow
Write-Host "(or type/paste the full path)" -ForegroundColor Gray
Write-Host ""

$userPath = Read-Host "Path"

# Remove quotes if user dragged and dropped
$userPath = $userPath.Trim('"')

if (-not (Test-Path $userPath)) {
    Write-Host "`n❌ Path not found: $userPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n✓ Found folder: $userPath" -ForegroundColor Green

# Look for android subfolder or mipmap folders
$androidPath = $null

if (Test-Path (Join-Path $userPath "android")) {
    $androidPath = Join-Path $userPath "android"
    Write-Host "✓ Found android subfolder" -ForegroundColor Green
} else {
    # Check if mipmap folders are in root
    $mipmaps = Get-ChildItem -Path $userPath -Directory -Filter "mipmap-*" -ErrorAction SilentlyContinue
    if ($mipmaps) {
        $androidPath = $userPath
        Write-Host "✓ Found mipmap folders in root" -ForegroundColor Green
    }
}

if (-not $androidPath) {
    Write-Host "`n❌ Could not find mipmap folders" -ForegroundColor Red
    Write-Host "Expected structure:" -ForegroundColor Yellow
    Write-Host "  your-folder/" -ForegroundColor Gray
    Write-Host "    android/ (or mipmap-* folders directly)" -ForegroundColor Gray
    Write-Host "      mipmap-mdpi/" -ForegroundColor Gray
    Write-Host "      mipmap-hdpi/" -ForegroundColor Gray
    Write-Host "      ..." -ForegroundColor Gray
    exit 1
}

# Count mipmap folders
$mipmapFolders = Get-ChildItem -Path $androidPath -Directory -Filter "mipmap-*"
Write-Host "✓ Found $($mipmapFolders.Count) mipmap folders" -ForegroundColor Green

# Show what will be copied
Write-Host "`n📋 Folders to copy:" -ForegroundColor Yellow
foreach ($folder in $mipmapFolders) {
    $iconCount = (Get-ChildItem -Path $folder.FullName -Filter "*.png").Count
    Write-Host "  - $($folder.Name) ($iconCount PNG files)" -ForegroundColor Gray
}

# Confirm
Write-Host "`n⚠ This will replace your current app icons." -ForegroundColor Yellow
$confirm = Read-Host "Continue? (y/n)"

if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Cancelled." -ForegroundColor Gray
    exit 0
}

# Backup existing icons
$targetRes = "android/app/src/main/res"
$backupFolder = "android/app/src/main/res/mipmap-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "`n📦 Creating backup..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

foreach ($folder in @("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi")) {
    $sourcePath = Join-Path $targetRes $folder
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $backupFolder $folder
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
    }
}
Write-Host "✓ Backup created: $backupFolder" -ForegroundColor Green

# Copy new icons
Write-Host "`n📥 Copying new icons..." -ForegroundColor Yellow

$copiedFiles = 0
foreach ($folder in $mipmapFolders) {
    $destFolder = Join-Path $targetRes $folder.Name
    
    # Create destination if needed
    if (-not (Test-Path $destFolder)) {
        New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
    }
    
    # Copy PNG files
    $pngFiles = Get-ChildItem -Path $folder.FullName -Filter "*.png"
    foreach ($file in $pngFiles) {
        Copy-Item -Path $file.FullName -Destination $destFolder -Force
        $copiedFiles++
    }
    
    Write-Host "  ✓ Copied $($folder.Name)" -ForegroundColor Green
}

Write-Host "`n✅ Successfully copied $copiedFiles icon files!" -ForegroundColor Green

# Verify
Write-Host "`n🔍 Verifying installation..." -ForegroundColor Yellow

$allGood = $true
foreach ($folder in @("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi")) {
    $iconPath = Join-Path $targetRes "$folder/ic_launcher.png"
    if (Test-Path $iconPath) {
        $file = Get-Item $iconPath
        $sizeKB = [math]::Round($file.Length / 1KB, 1)
        
        if ($sizeKB -gt 8) {
            Write-Host "  ✓ $folder - $sizeKB KB" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ $folder - $sizeKB KB (seems small)" -ForegroundColor Yellow
            $allGood = $false
        }
    } else {
        Write-Host "  ✗ $folder - Missing!" -ForegroundColor Red
        $allGood = $false
    }
}

if ($allGood) {
    Write-Host "`n🎉 All icons installed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n⚠ Some icons may not be correct" -ForegroundColor Yellow
}

# Next steps
Write-Host "`n" + ("=" * 60)
Write-Host "📱 Next: Rebuild your app" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run these commands:" -ForegroundColor White
Write-Host "  cd android" -ForegroundColor Gray
Write-Host "  ./gradlew clean" -ForegroundColor Gray
Write-Host "  cd .." -ForegroundColor Gray
Write-Host "  npx react-native run-android" -ForegroundColor Gray
Write-Host ""
Write-Host "Your app will show the new purple paw icon! 🐾" -ForegroundColor Green
Write-Host ("=" * 60)
Write-Host ""
