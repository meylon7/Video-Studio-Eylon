/**
 * Asset Generation — Stage 3
 *
 * Generates audio assets (voiceover, music, SFX) for the video project.
 * Uses Edge TTS for voiceover and synthetic generation for music/SFX.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import type { ResolvedConfig } from './schema';
import { TRANSITION_SFX } from './defaults';

/** Python executable path — uses Python 3.13 with edge-tts */
function findPython(): string {
  const candidates = [
    ...(process.env.PYTHON ? [process.env.PYTHON] : []),
    'python3',
    'python',
  ];
  for (const cmd of candidates) {
    try {
      execSync(`"${cmd}" -c "import edge_tts"`, { stdio: 'pipe' });
      return cmd;
    } catch {}
  }
  return 'python';
}

/** Run a Python script by writing to a temp file (avoids Windows escaping issues) */
function runPython(python: string, script: string, timeout: number = 120000): void {
  const tmpFile = path.join(os.tmpdir(), `video-gen-${Date.now()}.py`);
  fs.writeFileSync(tmpFile, script);
  try {
    execSync(`"${python}" "${tmpFile}"`, { stdio: 'inherit', timeout });
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

/** Generate all audio assets for a project */
export async function generateAssets(config: ResolvedConfig, projectDir: string): Promise<void> {
  const audioDir = path.join(projectDir, 'remotion', 'public', 'audio');
  fs.mkdirSync(audioDir, { recursive: true });

  // 1. Generate voiceover if enabled
  if (config.audio.voiceover.enabled) {
    await generateVoiceover(config, audioDir);
  }

  // 2. Generate background music
  if (config.audio.music.enabled && !config.audio.music.customFile) {
    generateMusic(audioDir, config.totalDurationSeconds + 2);
  }

  // 3. Generate SFX
  if (config.audio.sfx.enabled) {
    generateSFX(audioDir);
  }
}

/** Generate per-scene voiceover using Edge TTS */
async function generateVoiceover(config: ResolvedConfig, audioDir: string): Promise<void> {
  const python = findPython();
  const voice = config.audio.voiceover.voice;
  const rate = config.audio.voiceover.rate;
  const pitch = config.audio.voiceover.pitch;

  const scenes = config.scenes
    .filter(s => s.narration)
    .map((s, i) => ({
      file: `vo-scene${i + 1}.mp3`,
      text: s.narration!,
    }));

  if (scenes.length === 0) return;

  // Build Python script for batch generation
  const sceneLines = scenes.map(s =>
    `    ('${s.file}', ${JSON.stringify(s.text)}),`
  ).join('\n');

  const script = `
import asyncio, edge_tts, os
VOICE = '${voice}'
RATE = '${rate}'
PITCH = '${pitch}'
OUTPUT_DIR = ${JSON.stringify(audioDir.replace(/\\/g, '/'))}
scenes = [
${sceneLines}
]
async def generate():
    for filename, text in scenes:
        path = os.path.join(OUTPUT_DIR, filename)
        comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
        await comm.save(path)
        print(f'Generated {filename}')
asyncio.run(generate())
`;

  try {
    runPython(python, script, 120000);

    // Update config scenes with audio file paths
    let voIdx = 0;
    for (const scene of config.scenes) {
      if (scene.narration) {
        scene.audioFile = `audio/vo-scene${voIdx + 1}.mp3`;
        voIdx++;
      }
    }
  } catch (err) {
    console.error('Voiceover generation failed:', err);
  }
}

/** Generate synthetic background music */
function generateMusic(audioDir: string, duration: number): void {
  const python = findPython();
  const outputPath = path.join(audioDir, 'background-music.wav').replace(/\\/g, '/');

  const script = `
import struct, wave, math, random
RATE = 44100
DURATION = ${Math.ceil(duration)}
samples = []
for i in range(RATE * DURATION):
    t = i / RATE
    val = 0.0
    for freq in [130.81, 164.81, 196.0, 246.94]:
        val += math.sin(2 * math.pi * (freq + 0.3) * t) * 0.04
        val += math.sin(2 * math.pi * (freq - 0.3) * t) * 0.04
    beat_pos = (t * 100 / 60) % 1
    bass_env = max(0, 1 - beat_pos * 3) if beat_pos < 0.33 else 0
    val += math.sin(2 * math.pi * 65.41 * t) * bass_env * 0.12
    hh_pos = (t * 100 / 60 * 2) % 1
    if hh_pos < 0.02:
        val += (random.random() * 2 - 1) * 0.03
    lfo = 0.5 + 0.5 * math.sin(2 * math.pi * 0.08 * t)
    val *= (0.6 + 0.4 * lfo)
    val += math.sin(2 * math.pi * 523.25 * t) * 0.01 * lfo
    if t < 2: val *= t / 2
    elif t > DURATION - 3: val *= (DURATION - t) / 3
    samples.append(int(max(-1, min(1, val)) * 32767))
with wave.open('${outputPath}', 'w') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(RATE)
    wf.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
print('Generated background-music.wav')
`;

  try {
    runPython(python, script, 60000);
  } catch (err) {
    console.error('Music generation failed:', err);
  }
}

/** Generate synthetic SFX */
function generateSFX(audioDir: string): void {
  const python = findPython();
  const outDir = audioDir.replace(/\\/g, '/');

  const script = `
import struct, wave, math, random, os
RATE = 44100
def write_wav(path, samples):
    with wave.open(path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(RATE)
        wf.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
def clamp(x): return max(-1.0, min(1.0, x))
def whoosh(dur=0.5):
    s = []
    for i in range(int(RATE*dur)):
        t=i/RATE; p=t/dur; freq=200+p*2000; env=math.sin(math.pi*p)**0.5
        s.append(int(clamp(((random.random()*2-1)*0.4+math.sin(2*math.pi*freq*t)*0.2)*env*0.6)*32767))
    return s
def click(dur=0.08):
    s = []
    for i in range(int(RATE*dur)):
        t=i/RATE; env=math.exp(-t*80)
        s.append(int(clamp((math.sin(2*math.pi*3500*t)*0.5+math.sin(2*math.pi*1200*t)*0.3)*env)*32767))
    return s
def reveal(dur=1.0):
    s = []
    for i in range(int(RATE*dur)):
        t=i/RATE; p=t/dur; env=p*math.exp(-p*2)*4; v=0
        for f in [440,554,659,880]: v+=math.sin(2*math.pi*f*(1+p*0.2)*t)*env*0.15
        s.append(int(clamp(v+(random.random()*2-1)*env*0.05*p)*32767))
    return s
def success(dur=0.6):
    s = []
    for i in range(int(RATE*dur)):
        t=i/RATE; v=math.sin(2*math.pi*880*t)*math.exp(-t*6)*0.3
        if t>0.15: v+=math.sin(2*math.pi*1320*t)*math.exp(-(t-0.15)*5)*0.35
        s.append(int(clamp(v)*32767))
    return s
def boom(dur=1.5):
    s = []
    for i in range(int(RATE*dur)):
        t=i/RATE; env=math.exp(-t*2.5)
        s.append(int(clamp((math.sin(2*math.pi*40*t)*0.7+math.sin(2*math.pi*80*t)*0.3+(random.random()*2-1)*0.08)*env)*32767))
    return s
d='${outDir}'
write_wav(f'{d}/sfx-whoosh.wav', whoosh())
write_wav(f'{d}/sfx-click.wav', click())
write_wav(f'{d}/sfx-reveal.wav', reveal())
write_wav(f'{d}/sfx-success.wav', success())
write_wav(f'{d}/sfx-boom.wav', boom())
print('Generated SFX')
`;

  try {
    runPython(python, script, 30000);
  } catch (err) {
    console.error('SFX generation failed:', err);
  }
}
