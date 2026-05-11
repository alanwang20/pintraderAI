# PinTraderAI — launch backend, frontend, and ngrok in separate windows
$root = $PSScriptRoot

Write-Host "Starting PinTraderAI..." -ForegroundColor Cyan

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$root\backend'; Write-Host 'Backend starting...' -ForegroundColor Green; uvicorn main:app --reload"

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$root\frontend'; Write-Host 'Frontend starting...' -ForegroundColor Blue; npm run dev"

# ngrok — tunnel port 8000 for eBay OAuth callbacks
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Write-Host 'ngrok starting...' -ForegroundColor Yellow; ngrok http 8000"

Write-Host ""
Write-Host "All three windows launched." -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Blue
Write-Host "  ngrok:    check the ngrok window for your public URL" -ForegroundColor Yellow
