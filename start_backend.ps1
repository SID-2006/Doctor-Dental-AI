# DentalAI - Start Backend Server (Windows PowerShell)
$PORT = if ($env:PORT) { $env:PORT } else { "8005" }
Write-Host "Starting DentalAI FastAPI Backend on http://localhost:$PORT..." -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\backend"

if (-not (Test-Path ".venv\Scripts\Activate.ps1")) {
    Write-Host "Virtual environment not found. Creating .venv..." -ForegroundColor Yellow
    python -m venv .venv
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & .\.venv\Scripts\pip install -r requirements.txt
}

& .\.venv\Scripts\Activate.ps1

$env:PYTHONPATH = "$PSScriptRoot"
Write-Host "Swagger Documentation available at: http://localhost:$PORT/docs" -ForegroundColor Green
& .\.venv\Scripts\uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT --reload
