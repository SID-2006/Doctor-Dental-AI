#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-8005}"
echo "=== Starting DentalAI FastAPI Backend on http://localhost:$PORT ==="

if [ ! -d "backend/.venv" ]; then
    echo "Creating virtual environment in backend/.venv..."
    python3 -m venv backend/.venv
    echo "Installing backend dependencies..."
    backend/.venv/bin/pip install -r backend/requirements.txt
fi

export PYTHONPATH="$SCRIPT_DIR"
echo "Interactive Swagger Docs: http://localhost:$PORT/docs"
exec backend/.venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port "$PORT" --reload
