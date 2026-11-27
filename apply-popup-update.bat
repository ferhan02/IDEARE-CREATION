@echo off
setlocal
cd /d "%~dp0"
if exist "C:\xampp\php\php.exe" (
  "C:\xampp\php\php.exe" "%~dp0ideare-popup-update\apply.php"
) else (
  where php >nul 2>nul
  if errorlevel 1 (
    echo PHP not found. Run the installer using XAMPP PHP.
    pause
    exit /b 1
  )
  php "%~dp0ideare-popup-update\apply.php"
)
if errorlevel 1 (echo Update failed. Check the message above.) else (echo Update complete. Refresh with Ctrl+F5.)
pause
