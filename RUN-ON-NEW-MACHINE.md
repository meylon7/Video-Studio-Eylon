# Run Studio Eylon on a new machine — agent handoff

This file is an execution checklist for the **Claude Code agent** (or a human) to
get Studio Eylon running on a second computer. The code is in git; the things git
can't carry (Node deps, per-project Remotion deps, Python packages) are installed
by the steps below.

---

## What ships in git vs. what must be installed here

**In git (already present after clone):**
- All app/server/pipeline code, `templates/`, brand profiles
- `app/player/bundle.js` — the prebuilt live-preview bundle (so the in-app
  preview works without a build step)

**NOT in git — install on this machine:**
- Root `node_modules` → `npm install` (server: express, ts-node, …)
- Each generated project's Remotion `node_modules` → **auto-installed on the
  first render** (the `projects/` folder is gitignored)
- Python audio stack: `edge-tts` + `numpy` for voiceover / music / SFX / voice
  preview (needs `python3` + internet)
- A headless Chromium for rendering → Remotion **downloads it automatically** on
  the first render (needs internet, a few minutes once)

---

## Prerequisites
- **Node.js 18+** and npm  (`node -v`)
- **Python 3**  (`python3 --version`) — only for audio; the app runs without it
- **Internet** — required the first time you render (Chromium download) and for
  any audio (edge-tts calls Microsoft's TTS)

---

## Steps

### 1. Clone
```bash
git clone https://github.com/meylon7/Video-Studio-Eylon.git
cd Video-Studio-Eylon
```
> If the work is on a feature branch and not yet on `main`, also run:
> `git checkout feature/motion-graphics-and-live-editor`

### 2. Run setup (Node + Python deps)
```bash
bash scripts/setup.sh
```
This runs `npm install` and `python3 -m pip install --user edge-tts numpy`.
You can do those two by hand instead if you prefer.

### 3. Start the server
```bash
PORT=8000 npm start          # open http://localhost:8000   (omit PORT -> :3333)
```

### 4. First render (bootstraps the Remotion project)
In the web UI: **Project → pick a preset → Scenes → "צור וידאו"** (or the
**מושן** tab → a preset → "צור וידאו מושן").
The first render will:
- create `projects/<name>/remotion/` and run `npm install` there (Remotion deps),
- download a headless Chromium (once),
then produce an MP4 and show it. This first one takes a few minutes; later
renders are fast.

---

## Verify (expected output in parentheses)
```bash
node -v                                             # (v18+ )
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/app/   # (200)
python3 -c "import edge_tts, numpy; print('audio OK')"                # (audio OK)
curl -s -X POST http://localhost:8000/api/preview-voice \
  -H 'Content-Type: application/json' \
  -d '{"voice":"he-IL-AvriNeural","rate":"-5%","text":"בדיקה"}'        # ({"url":"/app/previews/...mp3"})
```

---

## Rebuilding the live-preview bundle (only after editing `lib/components`)
The committed `app/player/bundle.js` already works. If you change components under
`lib/` and want the **in-app preview** to reflect it:
```bash
npm run build:player
```
This needs Remotion build deps; it auto-finds them from any installed
`projects/*/remotion/node_modules`, so **render one video first** if you're on a
brand-new clone. (The final MP4 always uses the latest `lib/` code regardless —
only the live preview needs this rebuild.)

---

## Troubleshooting
- **Voices silent / "voice preview failed"** → `python3 -c "import edge_tts,numpy"`
  must succeed, and you need internet. Re-run `python3 -m pip install --user edge-tts numpy`.
  The server auto-detects `python3`/`python`.
- **Port already in use** → start with a different `PORT=...`.
- **First render fails / hangs** → it's downloading Chromium + installing Remotion;
  ensure internet and retry. Watch the terminal running `npm start` for progress.
- **Edits to the web UI don't show** → the server sends `no-store`, so a normal
  refresh is enough; otherwise hard-refresh (Cmd/Ctrl+Shift+R).
- **`ffmpeg` not found** → not required; Remotion bundles its own.

---

## Quick reference
| Action | Command |
|---|---|
| Install everything | `bash scripts/setup.sh` |
| Start (port 8000) | `PORT=8000 npm start` |
| Start (port 3333) | `npm start` |
| Rebuild live preview | `npm run build:player` |
| Python audio deps | `python3 -m pip install --user edge-tts numpy` |
