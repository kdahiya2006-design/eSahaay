@echo off
echo ===================================================
echo Starting eSahaay Backend (FastAPI on Port 8000)...
echo ===================================================
set PYTHONPATH=backend
"%LOCALAPPDATA%\Microsoft\WinGet\Packages\astral-sh.uv_Microsoft.Winget.Source_8wekyb3d8bbwe\uv.exe" run --python "%APPDATA%\uv\python\cpython-3.11.17-windows-x86_64-none\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
