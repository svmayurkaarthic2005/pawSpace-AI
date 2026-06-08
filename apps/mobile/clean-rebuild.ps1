# React Native Clean & Rebuild Script for PowerShell
# Run from apps/mobile directory

Write-Host "=== React Native Clean & Rebuild ===" -ForegroundColor Cyan
Write-Host ""

# 1. Clean node_modules and build artifacts
Write-Host "Step 1: Removing node_modules and build artifacts..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force
    Write-Host "Removed node_modules" -ForegroundColor Green
}
if (Test-Path "android\.gradle") {
    Remove-Item -Path "android\.gradle" -Recurse -Force
    Write-Host "Removed android\.gradle" -ForegroundColor Green
}
if (Test-Path "android\app\build") {
    Remove-Item -Path "android\app\build" -Recurse -Force
    Write-Host "Removed android\app\build" -ForegroundColor Green
}
if (Test-Path "android\build") {
    Remove-Item -Path "android\build" -Recurse -Force
    Write-Host "Removed android\build" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Remove-Item -Path "package-lock.json" -Force
    Write-Host "Removed package-lock.json" -ForegroundColor Green
}

Write-Host ""

# 2. Reinstall dependencies
Write-Host "Step 2: Reinstalling npm dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Verify autolinking
Write-Host "Step 3: Verifying autolinking..." -ForegroundColor Yellow
npx react-native config
Write-Host ""

# 4. Clean Android
Write-Host "Step 4: Cleaning Android build..." -ForegroundColor Yellow
Push-Location android
if (Test-Path ".\gradlew.bat") {
    .\gradlew.bat clean
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Android clean successful" -ForegroundColor Green
    } else {
        Write-Host "Android clean failed" -ForegroundColor Red
    }
} else {
    Write-Host "gradlew.bat not found" -ForegroundColor Red
}
Pop-Location

Write-Host ""
Write-Host "=== Cleanup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Metro bundler: npm run start:reset" -ForegroundColor White
Write-Host "2. In a new terminal run: npm run android" -ForegroundColor White
Write-Host ""
