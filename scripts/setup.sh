#!/usr/bin/env bash
#
# Studio Eylon — one-shot setup for a fresh machine.
# Installs the server's Node deps and the Python deps used for audio
# (voiceover / music / SFX / voice preview). Safe to re-run.
#
# Usage:  bash scripts/setup.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 1/3  Node version"
if ! command -v node >/dev/null 2>&1; then
  echo "    ERROR: Node.js not found. Install Node 18+ from https://nodejs.org and re-run." >&2
  exit 1
fi
node -v

echo "==> 2/3  Installing server dependencies (npm install)"
npm install

echo "==> 3/3  Installing Python audio dependencies (edge-tts, numpy)"
PY=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then
  echo "    WARN: Python 3 not found. Voiceover / music / SFX / voice-preview will be disabled."
  echo "          Install Python 3, then run: python3 -m pip install --user edge-tts numpy"
else
  "$PY" -m pip install --user edge-tts numpy || \
    echo "    WARN: pip install failed. Run manually: $PY -m pip install --user edge-tts numpy"
  "$PY" -c "import edge_tts, numpy; print('    Python audio deps OK')" 2>/dev/null || \
    echo "    WARN: edge_tts/numpy not importable yet."
fi

echo ""
echo "Setup complete."
echo "Start the app:   PORT=8000 npm start     # then open http://localhost:8000"
echo "(default port without PORT= is 3333)"
echo ""
echo "Notes:"
echo " - The first video render auto-installs that project's Remotion deps and"
echo "   downloads a headless Chromium (needs internet; takes a few minutes once)."
echo " - Audio features need internet (edge-tts) at render/preview time."
