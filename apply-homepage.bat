@echo off
cd /d "%~dp0"
set "PHP=php"
if exist "C:\xampp\php\php.exe" set "PHP=C:\xampp\php\php.exe"
"%PHP%" home-configurator\apply-homepage.php
pause
