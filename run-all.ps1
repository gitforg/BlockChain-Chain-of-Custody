# run-all.ps1
# Script to launch the Block-Chain-of-Custody local development environment on Windows

Write-Host "🚀 Launching Block-Chain-of-Custody..." -ForegroundColor Green

# 1. Start the Backend server in a new window
Write-Host "➡ Starting Backend Express Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

# 2. Start the Frontend Next.js app in a new window
Write-Host "➡ Starting Frontend Next.js App..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "✅ Both services have been launched in separate PowerShell windows!" -ForegroundColor Green
Write-Host "   - Backend: http://localhost:5000" -ForegroundColor Yellow
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor Yellow
