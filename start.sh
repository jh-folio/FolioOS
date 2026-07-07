#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "Folio OS starting..."
echo "Open this address in your browser: http://localhost:8787"
echo "Keep this window open while using the archive."
echo ""

if [ -f ".venv/bin/python3" ]; then
    PYTHON=".venv/bin/python3"
elif command -v python3 &>/dev/null; then
    PYTHON="python3"
else
    echo "Error: python3 not found. Please install Python 3 first."
    echo "  macOS: brew install python"
    exit 1
fi

# Exit code 3 = restart signal from the in-app restart button.
while true; do
  "$PYTHON" app.py
  [ $? -eq 3 ] || break
  echo ""
  echo "Restarting..."
  echo ""
done
