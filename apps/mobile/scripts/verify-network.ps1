# Network Configuration Verification Script
# Verifies everything is set up correctly for physical device development

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PawSpace Network Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allPassed = $true

# Check 1: .env file exists and has API_BASE_URL
Write-Host "1️⃣  Checking .env configuration..." -ForegroundColor Yellow
$envPath = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "API_BASE_URL=(.+)") {
        $apiUrl = $matches[1].Trim()
        Write-Host "   ✅ API_BASE_URL found: $apiUrl" -ForegroundColor Green
        
        # Extract IP from URL
        if ($apiUrl -match "http://([0-9.]+):") {
            $configuredIP = $matches[1]
            Write-Host "   📍 Configured IP: $configuredIP`n" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ❌ API_BASE_URL not found in .env" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "   ❌ .env file not found!" -ForegroundColor Red
    $allPassed = $false
}

# Check 2: Current PC IP addresses
Write-Host "2️⃣  Checking your PC's IP addresses..." -ForegroundColor Yellow
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -ne "127.0.0.1" } |
    Select-Object IPAddress, InterfaceAlias

if ($ipAddresses.Count -gt 0) {
    Write-Host "   ✅ Found network interfaces:" -ForegroundColor Green
    foreach ($ip in $ipAddresses) {
        $indicator = ""
        if ($configuredIP -eq $ip.IPAddress) {
            $indicator = " ← CONFIGURED"
            Write-Host "   📍 $($ip.IPAddress) - $($ip.InterfaceAlias)$indicator" -ForegroundColor Green
        } else {
            Write-Host "      $($ip.IPAddress) - $($ip.InterfaceAlias)" -ForegroundColor White
        }
    }
    Write-Host ""
    
    # Warn if configured IP doesn't match any current IP
    if ($configuredIP) {
        $matchFound = $false
        foreach ($ip in $ipAddresses) {
            if ($ip.IPAddress -eq $configuredIP) {
                $matchFound = $true
                break
            }
        }
        if (-not $matchFound) {
            Write-Host "   ⚠️  WARNING: Configured IP ($configuredIP) not found in current network adapters!" -ForegroundColor Yellow
            Write-Host "      You may have switched WiFi networks. Run setup-physical-device.ps1 to update.`n" -ForegroundColor Yellow
            $allPassed = $false
        }
    }
} else {
    Write-Host "   ❌ No active network interfaces found!" -ForegroundColor Red
    $allPassed = $false
}

# Check 3: Backend port accessibility
Write-Host "3️⃣  Checking backend accessibility..." -ForegroundColor Yellow
if ($configuredIP) {
    try {
        $response = Invoke-WebRequest -Uri "http://${configuredIP}:5000/api/v1/health" -TimeoutSec 3 -ErrorAction Stop
        Write-Host "   ✅ Backend is running and accessible!" -ForegroundColor Green
        Write-Host "      Status: $($response.StatusCode) OK`n" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Cannot reach backend at http://${configuredIP}:5000" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n      Possible issues:" -ForegroundColor Yellow
        Write-Host "      • Backend not running (run: npm run dev in apps/backend)" -ForegroundColor White
        Write-Host "      • Firewall blocking port 5000" -ForegroundColor White
        Write-Host "      • Wrong IP configured`n" -ForegroundColor White
        $allPassed = $false
    }
}

# Check 4: Firewall rule
Write-Host "4️⃣  Checking Windows Firewall..." -ForegroundColor Yellow
try {
    $firewallRules = netsh advfirewall firewall show rule name="PawSpace Backend" 2>&1
    if ($firewallRules -match "Rule Name:.*PawSpace Backend") {
        Write-Host "   ✅ Firewall rule exists`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Firewall rule not found" -ForegroundColor Yellow
        Write-Host "      Run this as Administrator:" -ForegroundColor Yellow
        Write-Host "      netsh advfirewall firewall add rule name=`"PawSpace Backend`" dir=in action=allow protocol=TCP localport=5000`n" -ForegroundColor White
    }
} catch {
    Write-Host "   ⚠️  Could not check firewall (need admin privileges)`n" -ForegroundColor Yellow
}

# Check 5: ADB and device connection
Write-Host "5️⃣  Checking Android device connection..." -ForegroundColor Yellow
try {
    $adbDevices = adb devices 2>&1
    if ($adbDevices -match "device$") {
        Write-Host "   ✅ Android device connected!" -ForegroundColor Green
        $deviceLines = $adbDevices -split "`n" | Where-Object { $_ -match "device$" }
        foreach ($line in $deviceLines) {
            $deviceId = ($line -split "`t")[0]
            Write-Host "      Device ID: $deviceId" -ForegroundColor Cyan
        }
        Write-Host ""
    } else {
        Write-Host "   ⚠️  No Android device connected" -ForegroundColor Yellow
        Write-Host "      Connect your phone via USB and enable USB debugging`n" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ ADB not found in PATH" -ForegroundColor Red
    Write-Host "      Make sure Android SDK is installed`n" -ForegroundColor White
}

# Check 6: APK exists
Write-Host "6️⃣  Checking built APK..." -ForegroundColor Yellow
$apkPath = Join-Path $PSScriptRoot ".." "android" "app" "build" "outputs" "apk" "debug" "app-debug.apk"
if (Test-Path $apkPath) {
    $apkInfo = Get-Item $apkPath
    Write-Host "   ✅ APK exists" -ForegroundColor Green
    Write-Host "      Location: $apkPath" -ForegroundColor Cyan
    Write-Host "      Size: $([math]::Round($apkInfo.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "      Modified: $($apkInfo.LastWriteTime)`n" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  APK not found (needs build)" -ForegroundColor Yellow
    Write-Host "      Run: cd android && .\\gradlew assembleDebug`n" -ForegroundColor White
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "  ✅ All checks passed!" -ForegroundColor Green
    Write-Host "  Ready to test on physical device" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Some issues found" -ForegroundColor Yellow
    Write-Host "  Review the warnings above" -ForegroundColor Yellow
}
Write-Host "========================================`n" -ForegroundColor Cyan

# Next steps
if ($allPassed) {
    Write-Host "📱 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Ensure phone is on WiFi (same network as PC)" -ForegroundColor White
    Write-Host "   2. Connect phone via USB" -ForegroundColor White
    Write-Host "   3. Run: npm run android" -ForegroundColor White
    Write-Host "   4. Test Google Sign-In`n" -ForegroundColor White
} else {
    Write-Host "🔧 Fix the issues above, then run this script again`n" -ForegroundColor Yellow
}
