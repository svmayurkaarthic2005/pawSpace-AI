@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  REACT NATIVE MAPS FIX                                        ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

cd "%~dp0"
powershell -ExecutionPolicy Bypass -File "scripts\fix-maps-android.ps1"
pause
