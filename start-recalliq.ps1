$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$root\ml-service'; if (!(Test-Path .venv)) { python -m venv .venv }; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt; uvicorn app:app --reload --port 8000"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$root\backend'; npm install; npm start"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$root'; npm start"
Write-Host "RecallIQ services are starting."
