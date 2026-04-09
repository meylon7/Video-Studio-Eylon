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
import { generateAssets } from '../lib/generator/assets';
import { installDependencies } from '../lib/generator/render';
import { execSync } from 'child_process';

// Uploads directory
const uploadsDir = path.join(__dirname, '../app/uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json({ limit: '200mb' }));

// Serve static files
app.use('/app', express.static(path.join(__dirname, '../app')));
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
]);
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
  const python = process.env.PYTHON || 'python';
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
    execSync(`"${python}" "${tmpFile}"`, { timeout: 15000 });
    try { fs.unlinkSync(tmpFile); } catch {}
    res.json({ url: `/app/previews/${filename}` });
  } catch (err: any) {
    try { fs.unlinkSync(tmpFile); } catch {}
    res.status(500).json({ error: err.message });
  }
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
