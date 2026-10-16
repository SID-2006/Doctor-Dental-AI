# DentalAI - Start Frontend Dev Server (Windows PowerShell)
$PORT = if ($env:PORT) { $env:PORT } else { "5175" }
Write-Host "Starting DentalAI React Vite Frontend on http://localhost:$PORT..." -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
}

npm run dev -- --host --port $PORT
