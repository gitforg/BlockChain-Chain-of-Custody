#!/bin/bash
# run-all.sh
# Script to launch Block-Chain-of-Custody dev servers concurrently in Unix/Git Bash

echo "🚀 Starting Block-Chain-of-Custody dev servers..."

# Start backend dev server
echo "➡ Launching Backend on port 5000..."
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend dev server
echo "➡ Launching Frontend on port 3000..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

# Handle shutdown cleanly
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT

echo "✅ Both servers are running. Access them at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:5000"
echo "   - Press Ctrl+C to terminate both servers."

wait
