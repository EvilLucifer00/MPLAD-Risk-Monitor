<#
.SYNOPSIS
Starts the MPLADS RAG backend and frontend in separate terminal windows.

.DESCRIPTION
This script starts both the FastAPI backend and React frontend simultaneously.
It will open two new PowerShell windows.
#>

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "      Starting MPLADS RAG System         " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start the Backend
$BackendDir = Join-Path $ScriptDir "backend"
$PythonExe = Join-Path $BackendDir "venv\Scripts\python.exe"

if (-not (Test-Path $PythonExe)) {
    Write-Host "Error: Backend virtual environment not found at $PythonExe" -ForegroundColor Red
    Write-Host "Please ensure you have run the setup scripts." -ForegroundColor Red
    exit 1
}

Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Yellow
$BackendArgs = "-NoExit", "-Command", "cd '$BackendDir'; & '$PythonExe' main.py"
Start-Process "powershell.exe" -ArgumentList $BackendArgs -WindowStyle Normal

# 2. Start the Frontend
$FrontendDir = Join-Path $ScriptDir "frontend"
$NodeModules = Join-Path $FrontendDir "node_modules"

if (-not (Test-Path $NodeModules)) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    npm install
    Pop-Location
}

Write-Host "Starting Frontend (React/Vite)..." -ForegroundColor Yellow
$FrontendArgs = "-NoExit", "-Command", "cd '$FrontendDir'; npm run dev"
Start-Process "powershell.exe" -ArgumentList $FrontendArgs -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers are starting in new windows!" -ForegroundColor Green
Write-Host "   - Backend API: http://localhost:8000" -ForegroundColor Gray
Write-Host "   - Frontend UI: http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "You can close this window now. To stop the servers, just close their respective terminal windows." -ForegroundColor Gray
