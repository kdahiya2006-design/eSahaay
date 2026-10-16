@echo off
echo ===================================================
echo Starting eSahaay Frontend (Vite on Port 5173)...
echo ===================================================
cd frontend
set PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64;%PATH%
cmd.exe /c "npm run dev -- --host 0.0.0.0 --port 5173"
pause
