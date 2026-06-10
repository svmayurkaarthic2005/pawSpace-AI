# PawSpace Physical Device Setup Script
# This script helps you configure the API URL for physical Android devices

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PawSpace Physical Device Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if .env file exists
$envPath = Join-Path $PSScriptRoot ".." ".env"
$envExamplePath = Join-Path $PSScriptRoot ".." ".env.example"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Creating .env from .env.example...`n" -ForegroundColor Yellow
    
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Host "✅ Created .env file`n" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.example not found. Please create .env manually." -ForegroundColor Red
        exit 1
    }
}

# Get all IPv4 addresses
Write-Host "🔍 Detecting your computer's IP addresses...`n" -ForegroundColor Yellow

$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -ne "127.0.0.1" } |
    Select-Object IPAddress, InterfaceAlias

if ($ipAddresses.Count -eq 0) {
    Write-Host "❌ No network interfaces found!" -ForegroundColor Red
    Write-Host "   Make sure you're connected to WiFi or Ethernet.`n" -ForegroundColor Yellow
    exit 1
}

# Display available IP addresses
Write-Host "Available IP addresses:" -ForegroundColor Cyan
$index = 1
foreach ($ip in $ipAddresses) {
    Write-Host "  [$index] $($ip.IPAddress) - $($ip.InterfaceAlias)" -ForegroundColor White
    $index++
}

Write-Host "`n💡 Choose the IP address that matches your active network connection." -ForegroundColor Yellow
Write-Host "   Usually, this is your WiFi adapter (192.168.x.x or 172.x.x.x)`n" -ForegroundColor Yellow

# Prompt user to select IP
$selection = Read-Host "Enter the number of the IP address to use (or press Enter to skip)"

if ([string]::IsNullOrWhiteSpace($selection)) {
    Write-Host "`n⚠️  Skipping IP configuration. You'll need to update .env manually." -ForegroundColor Yellow
    exit 0
}

$selectedIndex = [int]$selection - 1
if ($selectedIndex -lt 0 -or $selectedIndex -ge $ipAddresses.Count) {
    Write-Host "`n❌ Invalid selection!" -ForegroundColor Red
    exit 1
}

$selectedIP = $ipAddresses[$selectedIndex].IPAddress

# Read current .env file
$envContent = Get-Content $envPath -Raw

# Check if API_BASE_URL already exists
if ($envContent -match "API_BASE_URL=(.+)") {
    $currentUrl = $matches[1]
    Write-Host "`n📝 Current API_BASE_URL: $currentUrl" -ForegroundColor Yellow
    $confirm = Read-Host "   Replace with http://$selectedIP:5000/api/v1? (y/n)"
    
    if ($confirm -ne 'y') {
        Write-Host "`n❌ Cancelled. No changes made." -ForegroundColor Yellow
        exit 0
    }
    
    # Replace existing API_BASE_URL
    $newUrl = "http://${selectedIP}:5000/api/v1"
    $envContent = $envContent -replace "API_BASE_URL=.+", "API_BASE_URL=$newUrl"
    
} else {
    # Add API_BASE_URL if it doesn't exist
    $newUrl = "http://${selectedIP}:5000/api/v1"
    $envContent += "`n`n# API Configuration`nAPI_BASE_URL=$newUrl`n"
}

# Write updated content back to .env
Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Host "`n✅ Updated .env file successfully!" -ForegroundColor Green
Write-Host "   API_BASE_URL=http://${selectedIP}:5000/api/v1`n" -ForegroundColor Green

# Check if backend is running
Write-Host "🔍 Checking if backend is accessible...`n" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://${selectedIP}:5000/api/v1/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend is running and accessible!" -ForegroundColor Green
    Write-Host "   Response: $($response.StatusCode) OK`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Cannot reach backend at http://${selectedIP}:5000" -ForegroundColor Yellow
    Write-Host "   Make sure:" -ForegroundColor Yellow
    Write-Host "   1. Backend server is running (npm run dev in apps/backend)" -ForegroundColor White
    Write-Host "   2. Windows Firewall allows port 5000" -ForegroundColor White
    Write-Host "   3. Your phone and computer are on the same WiFi network`n" -ForegroundColor White
}

Write-Host "📱 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Make sure backend is running: cd apps/backend && npm run dev" -ForegroundColor White
Write-Host "   2. Restart Metro bundler: npm run start:reset" -ForegroundColor White
Write-Host "   3. Rebuild the app: npm run android --deviceId=RZCWC0J8F7D" -ForegroundColor White
Write-Host "   4. Test the connection on your device`n" -ForegroundColor White

Write-Host "========================================`n" -ForegroundColor Cyan
