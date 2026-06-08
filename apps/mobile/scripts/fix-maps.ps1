# PowerShell script to fix react-native-maps native module issues
# Run this from apps/mobile directory

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Fixing React Native Maps Module                              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from apps/mobile directory" -ForegroundColor Red
    Write-Host "   cd apps/mobile; .\scripts\fix-maps.ps1" -ForegroundColor Yellow
    exit 1
}

# Step 1: Clean Android build
Write-Host "📦 Step 1: Cleaning Android build..." -ForegroundColor Yellow
Set-Location android

if (Test-Path "gradlew.bat") {
    Write-Host "   Running gradlew clean..." -ForegroundColor Gray
    .\gradlew.bat clean
    Write-Host "   Running gradlew cleanBuildCache..." -ForegroundColor Gray
    .\gradlew.bat cleanBuildCache
    Write-Host "✅ Android build cleaned" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: gradlew.bat not found, skipping gradle clean" -ForegroundColor Yellow
}

Set-Location ..

# Step 2: Remove build artifacts
Write-Host ""
Write-Host "🗑️  Step 2: Removing build artifacts..." -ForegroundColor Yellow

$pathsToRemove = @(
    "android\app\build",
    "android\.gradle",
    "android\.idea",
    "node_modules\.cache"
)

foreach ($path in $pathsToRemove) {
    if (Test-Path $path) {
        Write-Host "   Removing $path..." -ForegroundColor Gray
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "✅ Build artifacts removed" -ForegroundColor Green

# Step 3: Ask about reinstalling node_modules
Write-Host ""
$reinstall = Read-Host "Do you want to reinstall node_modules? (y/n)"

if ($reinstall -eq 'y' -or $reinstall -eq 'Y') {
    Write-Host "📥 Reinstalling node_modules..." -ForegroundColor Yellow
    
    if (Test-Path "node_modules") {
        Write-Host "   Removing node_modules..." -ForegroundColor Gray
        Remove-Item -Path "node_modules" -Recurse -Force
    }
    
    Write-Host "   Running npm install..." -ForegroundColor Gray
    npm install
    Write-Host "✅ node_modules reinstalled" -ForegroundColor Green
}

# Step 4: Instructions for next steps
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Next Steps                                                    ║" -ForegroundColor Cyan
Write-Host "╠═══════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  1. Start Metro bundler with reset cache:                     ║" -ForegroundColor Cyan
Write-Host "║     npm run start:reset                                       ║" -ForegroundColor White
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  2. In a NEW terminal, rebuild the app:                       ║" -ForegroundColor Cyan
Write-Host "║     npm run android                                           ║" -ForegroundColor White
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  3. If still not working, check that Google Maps API key      ║" -ForegroundColor Cyan
Write-Host "║     is set in android/app/src/main/AndroidManifest.xml        ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Cleanup complete!" -ForegroundColor Green
