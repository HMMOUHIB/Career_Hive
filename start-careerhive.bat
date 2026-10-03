@echo off
rem Starts CareerHive: checks the database, then opens the API (:8000) and the UI (:5173) in their own windows,
rem skipping any part that is already running, and opens the app in the browser. Double-click to run.
setlocal
title CareerHive launcher
cd /d "%~dp0"

netstat -ano | findstr /r /c:":3306 .*LISTENING" >nul
if errorlevel 1 (
  echo MySQL is not running. Start MySQL in the XAMPP Control Panel, then run this again.
  if exist "C:\xampp\xampp-control.exe" start "" "C:\xampp\xampp-control.exe"
  pause
  exit /b 1
)

netstat -ano | findstr /r /c:":8000 .*LISTENING" >nul
if errorlevel 1 (
  echo Starting the API on http://localhost:8000 ...
  start "CareerHive API (:8000)" cmd /k "cd /d ""%~dp0careerhive-backend"" && npm run dev"
) else (
  echo The API is already running on :8000.
)

netstat -ano | findstr /r /c:":5173 .*LISTENING" >nul
if errorlevel 1 (
  echo Starting the UI on http://localhost:5173 ...
  start "CareerHive UI (:5173)" cmd /k "cd /d ""%~dp0careerhive-ui"" && npm run dev"
) else (
  echo The UI is already running on :5173.
)

rem give the servers a moment, then open the app
timeout /t 5 /nobreak >nul
start "" http://localhost:5173
echo.
echo CareerHive is starting. Keep the API and UI windows open while you use the app.
timeout /t 4 >nul
