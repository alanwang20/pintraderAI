# PinTraderAI — stop backend, frontend, and ngrok
Write-Host "Stopping PinTraderAI..." -ForegroundColor Cyan

Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "All processes stopped." -ForegroundColor Green
