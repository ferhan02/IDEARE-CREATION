@echo off
setlocal
cd /d "%~dp0"
if exist "C:\xampp\php\php.exe" (
  "C:\xampp\php\php.exe" "%~dp0ideare-cabinet-update\apply.php"
) else (
  where php >nul 2>nul
  if errorlevel 1 (
    echo PHP was not found. Run the installer using your XAMPP PHP executable.
    pause
    exit /b 1
  )
  php "%~dp0ideare-cabinet-update\apply.php"
)
if errorlevel 1 (
  echo Update not completed. Check the message above.
) else (
  echo Update complete. Refresh the website with Ctrl+F5.
)
pause
