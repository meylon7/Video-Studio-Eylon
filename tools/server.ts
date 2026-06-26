/**
 * Video Generator Web Server
 *
 * Serves the form UI and handles video generation requests.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' tools/server.ts
 */

import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import { resolveConfig } from '../lib/generator/resolve';
import { compileProject } from '../lib/generator/compile';
import { generateAssets, generateSFX } from '../lib/generator/assets';
import { installDependencies } from '../lib/generator/render';
import { execSync, spawn, ChildProcess } from 'child_process';
import * as net from 'net';

// Uploads directory
const uploadsDir = path.join(__dirname, '../app/uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = Number(process.env.PORT) || 3333;

app.use(cors());
app.use(express.json({ limit: '200mb' }));

// Serve static files
// Serve the web UI with no caching so edits always show up on refresh
app.use('/app', express.static(path.join(__dirname, '../app'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate'),
}));
app.use('/projects', express.static(path.join(__dirname, '../projects')));
app.use('/brands', express.static(path.join(__dirname, '../brands')));

// Root redirect
app.get('/', (_req, res) => res.redirect('/app'));

// List available brands
app.get('/api/brands', (_req, res) => {
  const brandsDir = path.join(__dirname, '../brands');
  const brands = fs.readdirSync(brandsDir)
    .filter(d => fs.existsSync(path.join(brandsDir, d, 'brand.json')))
    .map(name => {
      const data = JSON.parse(fs.readFileSync(path.join(brandsDir, name, 'brand.json'), 'utf-8'));
      return { name, displayName: data.name || name, colors: data.colors };
    });
  res.json(brands);
});

// List generated projects
app.get('/api/projects', (_req, res) => {
  const projectsDir = path.join(__dirname, '../projects');
  if (!fs.existsSync(projectsDir)) return res.json([]);
  const projects = fs.readdirSync(projectsDir)
    .filter(d => {
      const outDir = path.join(projectsDir, d, 'remotion', 'out');
      return fs.existsSync(outDir) && fs.readdirSync(outDir).some(f => f.endsWith('.mp4'));
    })
    .map(name => {
      const outDir = path.join(projectsDir, name, 'remotion', 'out');
      const videos = fs.readdirSync(outDir).filter(f => f.endsWith('.mp4'));
      const configPath = path.join(projectsDir, name, 'remotion', 'src', 'video-data.json');
      let config: any = null;
      if (fs.existsSync(configPath)) {
        try { config = JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch {}
      }
      return { name, videos, config };
    })
    .reverse();
  res.json(projects);
});

// Get a single project's config (video-data.json) for editing
app.get('/api/projects/:name/config', (req, res) => {
  const projectName = path.basename(req.params.name);
  const configPath = path.join(__dirname, '../projects', projectName, 'remotion', 'src', 'video-data.json');
  if (!fs.existsSync(configPath)) return res.status(404).json({ error: 'Config not found' });
  try {
    res.json(JSON.parse(fs.readFileSync(configPath, 'utf-8')));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Remotion Studio launcher ────────────────────────────────────────────────
// Live timeline editor per project. We keep one Studio process per project and
// reuse it if already running.
const studios: Record<string, { port: number; proc: ChildProcess }> = {};

/** Kill a detached Studio and its whole process group. */
function killStudio(proc: ChildProcess) {
  if (!proc.pid) return;
  try { process.kill(-proc.pid, 'SIGTERM'); } catch { try { proc.kill(); } catch {} }
}

/** Ask the OS for a guaranteed-free TCP port. */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

/** Resolve when a TCP port starts accepting connections, or false after timeout. */
function waitForPort(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const attempt = () => {
      const sock = net.createConnection({ port, host: '127.0.0.1' });
      sock.once('connect', () => { sock.destroy(); resolve(true); });
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() > deadline) return resolve(false);
        setTimeout(attempt, 400);
      });
    };
    attempt();
  });
}

// Launch (or reuse) Remotion Studio for a project
app.post('/api/projects/:name/studio', async (req, res) => {
  const projectName = path.basename(req.params.name);
  const remotionDir = path.join(__dirname, '../projects', projectName, 'remotion');
  if (!fs.existsSync(remotionDir)) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Reuse a live Studio if we already started one
  const existing = studios[projectName];
  if (existing && existing.proc.exitCode === null && !existing.proc.killed) {
    return res.json({ url: `http://localhost:${existing.port}`, already: true });
  }

  const port = await findFreePort();
  console.log(`Launching Remotion Studio for "${projectName}" on port ${port}...`);
  // Log Studio output to a file and fully detach it so it runs independently of
  // this server (a crashing/exiting Studio must never take the server down).
  const logsDir = path.join(__dirname, '../app/previews');
  fs.mkdirSync(logsDir, { recursive: true });
  const logFd = fs.openSync(path.join(logsDir, `studio-${projectName}.log`), 'a');
  const proc = spawn('npx', ['remotion', 'studio', '--port', String(port), '--no-open'], {
    cwd: remotionDir,
    env: process.env,
    stdio: ['ignore', logFd, logFd],
    detached: true,
  });
  proc.unref();
  studios[projectName] = { port, proc };
  proc.on('exit', () => { delete studios[projectName]; });
  proc.on('error', (err) => { console.error(`Studio spawn error (${projectName}):`, err.message); });

  const up = await waitForPort(port, 40000);
  if (!up) {
    killStudio(proc);
    delete studios[projectName];
    return res.status(500).json({ error: 'Studio did not start in time' });
  }
  res.json({ url: `http://localhost:${port}` });
});

// Delete a project
app.delete('/api/projects/:name', (req, res) => {
  const projectName = path.basename(req.params.name); // prevent path traversal
  if (!projectName || projectName === '.' || projectName === '..') {
    return res.status(400).json({ error: 'Invalid project name' });
  }
  const projectsRoot = path.join(__dirname, '../projects');
  const projectDir = path.join(projectsRoot, projectName);
  // Verify the resolved path is actually inside projects/
  if (!projectDir.startsWith(path.resolve(projectsRoot))) {
    return res.status(400).json({ error: 'Invalid project path' });
  }
  if (!fs.existsSync(projectDir)) {
    return res.status(404).json({ error: 'Project not found' });
  }
  // Stop any running Studio for this project before deleting its files
  if (studios[projectName]) {
    killStudio(studios[projectName].proc);
    delete studios[projectName];
  }
  try {
    // Use OS-level delete on Windows to handle locked files
    if (process.platform === 'win32') {
      require('child_process').execSync(`rmdir /s /q "${projectDir.replace(/\//g, '\\')}"`, { stdio: 'pipe' });
    } else {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
    console.log(`Deleted project: ${projectName}`);
    res.json({ ok: true, deleted: projectName });
  } catch (err: any) {
    console.error(`Failed to delete ${projectName}:`, err.message);
    res.status(500).json({ error: `Could not delete: ${err.message}` });
  }
});

// Allowed MIME types for upload
const ALLOWED_MIMES = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/x-m4a',
]);

/** Resolve a working Python that has edge_tts (env PYTHON → python3 → python). Cached. */
let _pythonBin: string | null = null;
function resolvePython(): string {
  if (_pythonBin) return _pythonBin;
  const candidates = [process.env.PYTHON, 'python3', 'python'].filter(Boolean) as string[];
  for (const cmd of candidates) {
    try { execSync(`"${cmd}" -c "import edge_tts"`, { stdio: 'pipe' }); _pythonBin = cmd; return cmd; } catch {}
  }
  // Fall back to any python that at least runs, so we can report a clear error
  for (const cmd of candidates) {
    try { execSync(`"${cmd}" --version`, { stdio: 'pipe' }); _pythonBin = cmd; return cmd; } catch {}
  }
  _pythonBin = 'python3';
  return _pythonBin;
}
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB

// Base64 file upload
app.post('/api/upload-base64', (req: any, res: any) => {
  try {
    const { name, data, mime } = req.body;
    if (!name || !data) return res.status(400).json({ error: 'Missing name or data' });

    // Validate MIME type
    if (mime && !ALLOWED_MIMES.has(mime)) {
      return res.status(400).json({ error: `Unsupported file type: ${mime}` });
    }

    const buffer = Buffer.from(data, 'base64');

    // Validate file size
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ error: `File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB)` });
    }

    // Sanitize filename — strip path traversal, keep only safe characters
    const safeName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '-');
    const savedName = Date.now() + '-' + safeName;
    const filePath = path.join(uploadsDir, savedName);
    fs.writeFileSync(filePath, buffer);

    const isImage = (mime || '').startsWith('image/');
    const isVideo = (mime || '').startsWith('video/');
    console.log(`  Uploaded: ${savedName} (${buffer.length} bytes)`);

    res.json({
      name: safeName,
      path: `/app/uploads/${savedName}`,
      type: isVideo ? 'video' : 'image',
      size: buffer.length,
      thumbnail: isImage ? `/app/uploads/${savedName}` : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Voice preview
app.post('/api/preview-voice', async (req, res) => {
  const { voice, rate, text } = req.body;
  const previewDir = path.join(__dirname, '../app/previews');
  fs.mkdirSync(previewDir, { recursive: true });
  const filename = `preview-${Date.now()}.mp3`;
  const outputPath = path.join(previewDir, filename).replace(/\\/g, '/');

  const sampleText = text || (voice?.startsWith('he-') ? 'שלום, זוהי דוגמה לקול הזה' : 'Hello, this is a preview of how this voice sounds.');
  const python = resolvePython();
  const script = `import asyncio, edge_tts

async def gen():
    comm = edge_tts.Communicate("${sampleText.replace(/"/g, '\\"')}", "${voice || 'en-GB-RyanNeural'}", rate="${rate || '-5%'}")
    await comm.save("${outputPath}")

asyncio.run(gen())
`;
  const os = require('os');
  const tmpFile = path.join(os.tmpdir(), `voice-preview-${Date.now()}.py`);
  fs.writeFileSync(tmpFile, script, 'utf-8');
  try {
    execSync(`"${python}" "${tmpFile}"`, { timeout: 15000, stdio: 'pipe' });
    try { fs.unlinkSync(tmpFile); } catch {}
    res.json({ url: `/app/previews/${filename}` });
  } catch (err: any) {
    try { fs.unlinkSync(tmpFile); } catch {}
    const stderr = (err.stderr ? err.stderr.toString() : '') || err.message || '';
    let msg = 'יצירת הקול נכשלה';
    if (/No module named ['"]?edge_tts/.test(stderr)) msg = 'edge-tts לא מותקן. הרץ: pip3 install edge-tts';
    else if (/not found|No such file|ENOENT/.test(stderr)) msg = `Python לא נמצא (${python}). התקן Python 3`;
    else if (/getaddrinfo|Temporary failure|ConnectionError|timed out/i.test(stderr)) msg = 'אין חיבור לאינטרנט ליצירת הקול';
    console.error('preview-voice failed:', stderr.slice(0, 400));
    res.status(500).json({ error: msg });
  }
});

// SFX preview — lazily generate the sound-effect palette and return playable URLs
const SFX_LIST = [
  { name: 'whoosh', label: 'וווש', file: 'sfx-whoosh.wav' },
  { name: 'click', label: 'קליק', file: 'sfx-click.wav' },
  { name: 'reveal', label: 'ריוויל', file: 'sfx-reveal.wav' },
  { name: 'success', label: 'הצלחה', file: 'sfx-success.wav' },
  { name: 'boom', label: 'בום', file: 'sfx-boom.wav' },
];
app.get('/api/sfx', (_req, res) => {
  const dir = path.join(__dirname, '../app/previews/sfx');
  fs.mkdirSync(dir, { recursive: true });
  const missing = SFX_LIST.some(s => !fs.existsSync(path.join(dir, s.file)));
  if (missing) {
    try { generateSFX(dir); }
    catch (e: any) { console.error('SFX gen failed:', e.message); return res.status(500).json({ error: 'יצירת אפקטי הקול נכשלה (דרוש Python 3)' }); }
  }
  res.json({ sfx: SFX_LIST.map(s => ({ name: s.name, label: s.label, url: `/app/previews/sfx/${s.file}` })) });
});

// Track generation status
const jobs: Record<string, { status: string; progress: string; output?: string; error?: string }> = {};

// Generate video
app.post('/api/generate', async (req, res) => {
  const config = req.body;
  const jobId = Date.now().toString(36);
  const projectName = config._projectName || `gen-${jobId}`;
  delete config._projectName;

  // Extract uploads info before resolving (resolveConfig doesn't know about _uploads)
  const uploads = config._uploads || { logo: null, images: [], videos: [] };
  delete config._uploads;

  jobs[jobId] = { status: 'starting', progress: 'Validating config...' };
  res.json({ jobId, projectName });

  // Run generation in background
  (async () => {
    try {
      const projectsRoot = path.join(__dirname, '../projects');
      const projectDir = path.join(projectsRoot, projectName);

      // 1. Resolve
      jobs[jobId] = { status: 'running', progress: 'Resolving config and defaults...' };
      const resolved = resolveConfig(config, projectName);

      // 2. Compile
      jobs[jobId] = { status: 'running', progress: 'Compiling Remotion project...' };
      compileProject(resolved, projectDir, uploads);

      // 3. Audio
      if (config.audio?.voiceover?.enabled || config.audio?.music?.enabled !== false) {
        jobs[jobId] = { status: 'running', progress: 'Generating audio (voiceover, music, SFX)...' };
        await generateAssets(resolved, projectDir);
        // Re-compile after audio so it knows which files exist
        jobs[jobId] = { status: 'running', progress: 'Updating project with audio...' };
        compileProject(resolved, projectDir, uploads);
        // Re-write video-data with audio paths
        const dataPath = path.join(projectDir, 'remotion', 'src', 'video-data.json');
        fs.writeFileSync(dataPath, JSON.stringify(resolved, null, 2));
      }

      // 4. Install deps
      jobs[jobId] = { status: 'running', progress: 'Installing dependencies...' };
      installDependencies(projectDir);

      // 5. Render
      jobs[jobId] = { status: 'running', progress: 'Rendering video... (this takes ~30s)' };
      const outDir = path.join(projectDir, 'remotion', 'out');
      fs.mkdirSync(outDir, { recursive: true });
      const outputFile = `${projectName}.mp4`;
      const outputPath = path.join(outDir, outputFile);

      execSync(`npx remotion render Main --concurrency=2 --output "${outputPath}"`, {
        cwd: path.join(projectDir, 'remotion'),
        timeout: 600000,
      });

      jobs[jobId] = {
        status: 'done',
        progress: 'Complete!',
        output: `/projects/${projectName}/remotion/out/${outputFile}`,
      };
    } catch (err: any) {
      jobs[jobId] = { status: 'error', progress: 'Failed', error: err.message };
    }
  })();
});

// Job status
app.get('/api/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.listen(PORT, () => {
  console.log(`\n  Video Generator running at http://localhost:${PORT}\n`);
});
