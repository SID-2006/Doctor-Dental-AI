#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/frontend"

PORT="${PORT:-5175}"
echo "=== Starting DentalAI React Vite Frontend on http://localhost:$PORT ==="

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies with npm..."
    npm install
fi

exec npm run dev -- --host --port "$PORT"
