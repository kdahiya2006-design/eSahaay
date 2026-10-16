@echo off
echo ================================================================
echo Starting eSahaay: AI-Powered Helpline Triage for Women's Safety
echo ================================================================
start "eSahaay Backend (FastAPI)" run_backend.bat
start "eSahaay Frontend (React)" run_frontend.bat
echo.
echo eSahaay is launching!
echo.
echo - On THIS Computer:
echo   Web App:  http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo.
echo - On OTHER Devices (Phones, Teammates, Judges on same Wi-Fi):
echo   Web App:  http://192.168.1.37:5173
echo   (Replace 192.168.1.37 with your current Wi-Fi IP if it changes)
echo ================================================================
