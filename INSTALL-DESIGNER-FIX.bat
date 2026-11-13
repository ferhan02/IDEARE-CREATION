@echo off
cd /d "%~dp0"
set "PHP_BIN=C:\xampp\php\php.exe"
if not exist "%PHP_BIN%" (
  echo XAMPP PHP was not found at %PHP_BIN%.
  echo Run: php APPLY-DESIGNER-FIX.php
  pause
  exit /b 1
)
"%PHP_BIN%" "%~dp0APPLY-DESIGNER-FIX.php"
echo.
pause
