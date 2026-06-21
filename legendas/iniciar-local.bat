@echo off
setlocal
cd /d "%~dp0"
start "Shadowing local" /min cmd /c "node servidor-local.js"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8087/login.htm?return=index.htm"
