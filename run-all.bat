@echo off
:: run-all.bat
:: Script to launch Block-Chain-of-Custody dev servers in separate CMD windows

echo 🚀 Launching Block-Chain-of-Custody...

echo ➡ Starting Backend on port 5000...
start cmd /k "cd backend && npm run dev"

echo ➡ Starting Frontend on port 3000...
start cmd /k "cd frontend && npm run dev"

echo ✅ Both services have been launched in separate CMD windows!
echo    - Backend: http://localhost:5000
echo    - Frontend: http://localhost:3000
