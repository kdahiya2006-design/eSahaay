@echo off
echo ================================================================
echo Starting Temporary Public HTTPS Link for eSahaay...
echo ================================================================
echo.
echo Connecting to Cloudflare secure tunnel forwarding port 5173...
echo.
"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe" tunnel --url http://127.0.0.1:5173
pause
