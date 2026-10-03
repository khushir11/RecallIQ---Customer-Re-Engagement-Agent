@echo off
echo Starting RecallIQ ML service...
start "RecallIQ ML" cmd /k "cd /d %~dp0ml-service && if not exist .venv python -m venv .venv && call .venv\Scripts\activate && pip install -r requirements.txt && uvicorn app:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting RecallIQ backend...
start "RecallIQ API" cmd /k "cd /d %~dp0backend && npm install && npm start"

timeout /t 3 /nobreak >nul

echo Starting RecallIQ frontend...
start "RecallIQ Web" cmd /k "cd /d %~dp0 && npm start"

echo.
echo RecallIQ services are starting.
echo ML:      http://127.0.0.1:8000
echo Backend: http://localhost:4000
echo Frontend: see the URL printed by the static server.
