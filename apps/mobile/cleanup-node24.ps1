# PawSpace - Clean Up Node 24 Corruption
# Run this AFTER installing Node 20 LTS

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PawSpace - Node 24 Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node version
$nodeVersion = node -v
Write-Host "Current Node version: $nodeVersion" -ForegroundColor Yellow

if ($nodeVersion -like "v24.*") {
    Write-Host "❌ ERROR: You're still using Node 24!" -ForegroundColor Red
    Write-Host "Please install Node 20 LTS first:" -ForegroundColor Red
    Write-Host "  https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  Download 'LTS' version (Node 20)" -ForegroundColor Yellow
    exit 1
}

if ($nodeVersion -like "v20.*") {
    Write-Host "✅ Node 20 detected - proceeding with cleanup" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Node version is $nodeVersion (expected v20.x.x)" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
}

Write-Host ""
Write-Host "Cleaning corrupted files..." -ForegroundColor Cyan
Write-Host ""

# Clean node_modules
Write-Host "Deleting node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Write-Host "✅ node_modules deleted" -ForegroundColor Green

# Clean package-lock
Write-Host "Deleting package-lock.json..." -ForegroundColor Yellow
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Write-Host "✅ package-lock.json deleted" -ForegroundColor Green

# Clean Android builds
Write-Host "Deleting Android build artifacts..." -ForegroundColor Yellow
Remove-Item -Recurse -Force android\.gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue
Write-Host "✅ Android builds deleted" -ForegroundColor Green

# Clean Metro cache
Write-Host "Deleting Metro cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .metro -ErrorAction SilentlyContinue
Write-Host "✅ Metro cache deleted" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete! ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. npm install" -ForegroundColor Yellow
Write-Host "2. npm install @shopify/flash-list@1.6.3 --legacy-peer-deps" -ForegroundColor Yellow
Write-Host "3. npx react-native start --reset-cache" -ForegroundColor Yellow
Write-Host "4. (new terminal) npx react-native run-android" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run these commands now? (automated)" -ForegroundColor Cyan
$automate = Read-Host "(y/n)"

if ($automate -eq "y") {
    Write-Host ""
    Write-Host "Installing packages..." -ForegroundColor Yellow
    npm install
    
    Write-Host ""
    Write-Host "Installing FlashList v1.6.3..." -ForegroundColor Yellow
    npm install "@shopify/flash-list@1.6.3" --legacy-peer-deps
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Setup Complete! ✅" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Now run in Terminal 1:" -ForegroundColor Cyan
    Write-Host "  npx react-native start --reset-cache" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then in Terminal 2:" -ForegroundColor Cyan
    Write-Host "  cd android" -ForegroundColor Yellow
    Write-Host "  ./gradlew clean" -ForegroundColor Yellow
    Write-Host "  cd .." -ForegroundColor Yellow
    Write-Host "  npx react-native run-android" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Manual steps - run these commands:" -ForegroundColor Cyan
    Write-Host "  npm install" -ForegroundColor Yellow
    Write-Host "  npm install @shopify/flash-list@1.6.3 --legacy-peer-deps" -ForegroundColor Yellow
    Write-Host "  npx react-native start --reset-cache" -ForegroundColor Yellow
    Write-Host "  (new terminal) npx react-native run-android" -ForegroundColor Yellow
}

Write-Host ""
