@echo off
setlocal
cd /d "%~dp0"
set "PHP=C:\xampp\php\php.exe"
if not exist "%PHP%" (
  echo XAMPP PHP was not found at C:\xampp\php\php.exe
  pause
  exit /b 1
)
"%PHP%" "%~dp0update-room-doors.php"
set "RESULT=%ERRORLEVEL%"
pause
exit /b %RESULT%
