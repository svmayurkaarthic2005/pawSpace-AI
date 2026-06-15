# PawSpace Development Startup Script
# Manages backend and mobile dev servers

param(
    [switch]$StopAll,
    [switch]$Backend,
    [switch]$Mobile,
    [switch]$CheckPorts
)

function Stop-ProcessOnPort {
    param([int]$Port)
    
    Write-Host "Checking port $Port..." -ForegroundColor Yellow
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($process) {
        $pid = $process.OwningProcess
        Write-Host "  Found process $pid using port $Port. Stopping..." -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Process stopped" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Port $Port is free" -ForegroundColor Green
    }
}

function Show-PortStatus {
    Write-Host "`n=== Port Status ===" -ForegroundColor Cyan
    Write-Host "Backend (5000): " -NoNewline
    $backend = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($backend) {
        Write-Host "IN USE (PID: $($backend.OwningProcess))" -ForegroundColor Red
    } else {
        Write-Host "FREE" -ForegroundColor Green
    }
    
    Write-Host "Metro Bundler (8081): " -NoNewline
    $metro = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
    if ($metro) {
        Write-Host "IN USE (PID: $($metro.OwningProcess))" -ForegroundColor Red
    } else {
        Write-Host "FREE" -ForegroundColor Green
    }
    Write-Host ""
}

# Check ports only
if ($CheckPorts) {
    Show-PortStatus
    exit 0
}

# Stop all services
if ($StopAll) {
    Write-Host "Stopping all PawSpace services..." -ForegroundColor Yellow
    Stop-ProcessOnPort 5000  # Backend
    Stop-ProcessOnPort 8081  # Metro Bundler
    Write-Host "`n✓ All services stopped" -ForegroundColor Green
    exit 0
}

# Show current status
Show-PortStatus

# Start Backend
if ($Backend) {
    Write-Host "Starting Backend..." -ForegroundColor Cyan
    Stop-ProcessOnPort 5000
    Set-Location apps/backend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Set-Location ../..
    Write-Host "✓ Backend starting in new window" -ForegroundColor Green
}

# Start Mobile
if ($Mobile) {
    Write-Host "Starting Mobile Metro Bundler..." -ForegroundColor Cyan
    Stop-ProcessOnPort 8081
    Set-Location apps/mobile
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
    Set-Location ../..
    Write-Host "✓ Metro Bundler starting in new window" -ForegroundColor Green
}

# Show help if no parameters
if (-not ($Backend -or $Mobile -or $StopAll -or $CheckPorts)) {
    Write-Host ""
    Write-Host "PawSpace Development Manager" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\start-dev.ps1 -Backend          Start backend server"
    Write-Host "  .\start-dev.ps1 -Mobile           Start metro bundler"
    Write-Host "  .\start-dev.ps1 -Backend -Mobile  Start both"
    Write-Host "  .\start-dev.ps1 -StopAll          Stop all services"
    Write-Host "  .\start-dev.ps1 -CheckPorts       Check port status"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\start-dev.ps1 -Backend -Mobile  # Start full dev environment"
    Write-Host "  .\start-dev.ps1 -StopAll          # Clean shutdown"
    Write-Host ""
}
