# Studio Eylon Video Toolkit

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

An AI-powered video creation toolkit built on top of [Digital Samba's claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit). Extended with a web UI, 13 scene types, RTL support, image/video uploads, gallery management, and a complete config-driven generation pipeline.

Created by [Studio Eylon](https://www.meylon.co.il).

## Demo

![Demo](docs/screenshots/demo.gif)

## Use Cases

- **Product Demo** - launch videos, feature walkthroughs, landing page heroes
- **Course Promo** - intro/outro videos for online courses and webinars
- **Onboarding Video** - welcome sequences, tool setup guides, team intros
- **Social Ad** - short branded clips for LinkedIn, YouTube, Instagram

## Screenshots

| Scenes | Project |
| ------ | ------- |
| ![Scenes](docs/screenshots/scenes-tab.png) | ![Project](docs/screenshots/project-tab.png) |

| Visual | Audio |
| ------ | ----- |
| ![Visual](docs/screenshots/visual-tab.png) | ![Audio](docs/screenshots/audio-tab.png) |

## Quick Start

```bash
git clone https://github.com/meylon7/Video-Studio-Eylon.git
cd Video-Studio-Eylon

# Install Node dependencies
npm install

# Install Python voiceover dependency (for Edge TTS)
pip install edge-tts

# (Optional) Copy environment template for cloud GPU features
cp .env.example .env
```

### Option A: Web UI

```bash
npx ts-node --compiler-options '{"module":"commonjs"}' tools/server.ts
```

Open http://localhost:3333 - fill the form, upload assets, generate MP4.

### Option B: Claude Code Workflow

```bash
claude                    # Open Claude Code in the toolkit
```

Then:

```
/setup                    # Configure cloud GPU, storage, voice (~5 min, mostly free)
/video                    # Create your first video
```

### Option C: CLI

```bash
npx ts-node --compiler-options '{"module":"commonjs"}' tools/generate-video.ts examples/test-config.json --name my-video
```

> **Want to skip setup and just render something?**
> ```bash
> cd examples/hello-world && npm install && npm run render
> ```
> No API keys needed - outputs an MP4 immediately.

**Requirements:** [Node.js](https://nodejs.org/) 18+, [Python](https://python.org/) 3.9+ (for voiceover/AI tools). [Claude Code](https://docs.anthropic.com/en/docs/claude-code) recommended. FFmpeg optional.

---

## About

> This project started as a fork of [Digital Samba's claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit) - an open-source AI video workspace for Claude Code. We took that foundation and built significantly on top of it:
>
> - **Web UI** with a complete form-based workflow, file uploads, voice preview, and video gallery
> - **Config-driven pipeline** that generates full Remotion projects from JSON
> - **13 scene types** with animated entrances, themed styling, and RTL support
> - **Image and video upload integration** - assets flow automatically into scenes
> - **Gallery management** with playback, download, and deletion
> - **Hebrew/Arabic RTL** support across all components
> - **Edge TTS voiceover** with 24+ voices built into the pipeline
>
> The original toolkit's skills, commands, templates, cloud GPU tools, and brand system are all still here and fully functional. We added the web interface and generation engine to make it accessible without needing Claude Code.
>
> **[Studio Eylon](https://www.meylon.co.il)** - AI-powered creative tools.
>
> Credit to the Digital Samba team for the excellent foundation this is built on.

---

## Web UI

The web interface at `localhost:3333` provides a complete video creation experience:

### Form Tabs

1. **Project** - name, brand selection, video type, product info (name, tagline, website)
2. **Visual** - text direction (LTR/RTL), background variant, transition style, animation speed, overlays (vignette, film grain, watermark)
3. **Audio** - voiceover toggle with 24+ voices (including Hebrew/Arabic), speech rate, background music, SFX
4. **Scenes** - add/remove scenes with type-specific fields, drag-and-drop reorder
5. **Media & Assets** - drag-and-drop upload for logo, images, and videos

### Gallery

- Thumbnails of all generated videos
- Click to play in fullscreen overlay with download link
- Delete button on each card (with confirmation)

### Generation Pipeline

```
Form submit → Upload assets → Resolve config → Compile Remotion project → Generate audio → Render MP4
```

Uploaded files are automatically wired into the video:
- **Logo** -> watermark overlay + scene logos
- **Images** -> auto-assigned to `image` scenes
- **Videos** -> auto-assigned to `demo` scenes

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/brands` | List available brand profiles |
| `GET` | `/api/projects` | List generated projects with videos |
| `POST` | `/api/generate` | Start video generation (returns jobId) |
| `GET` | `/api/status/:jobId` | Poll generation progress |
| `POST` | `/api/upload-base64` | Upload file (logo/image/video) |
| `POST` | `/api/preview-voice` | Generate voice preview sample |
| `DELETE` | `/api/projects/:name` | Delete a project and its files |

---

## Scene Types

13 scene types (+ `feature` alias for stats), each with animated entrances and themed styling:

| Type | Description | Key Fields |
|------|-------------|------------|
| `title` | Opening scene with logo and headline | headline, subheadline, logos |
| `problem` | Pain points with animated cards + code block | headline, bullets/problems, codeExample |
| `solution` | Solution reveal with highlight cards | headline, description, highlights |
| `demo` | Video playback in browser/terminal chrome | videoFile, demoType (browser/terminal/raw), label, caption |
| `image` | Uploaded image with 3 layout modes | imageSrc, headline, caption, layout |
| `stats` | Animated stat cards with icons | headline, stats (value/label/icon/color) |
| `spotlight` | Feature deep-dive with bullet points | icon, feature, tagline, bullets, accentColor |
| `comparison` | Side-by-side feature comparison table | headline, rows, ourLabel, theirLabel |
| `testimonial` | Customer quote with word-by-word reveal | quote, author, role, company, rating |
| `infographic` | Animated counters, progress rings, bar charts | headline, counters, rings, bars |
| `cta` | Call-to-action with links and logo | headline, tagline, links |
| `webinar-intro` | Webinar opening with animated particles | brandName, tagline, logoSrc |
| `webinar-outro` | Webinar closing with fade-out | headline, url, contacts |

### Image Scene Layouts

- **`fullscreen`** - full-bleed image with Ken Burns effect + text overlay at bottom
- **`contain`** - centered image in rounded frame with headline and caption
- **`split`** - image on one side, text on the other (flips in RTL)

Any scene can also have a `backgroundImage` - renders as a full-bleed background behind the scene content with a dark overlay for readability.

---

## Transitions

7 custom cinematic transitions + 4 official Remotion transitions:

| Transition | Description |
|------------|-------------|
| `glitch()` | Digital distortion with RGB shift |
| `rgbSplit()` | Chromatic aberration effect |
| `zoomBlur()` | Radial motion blur |
| `lightLeak()` | Cinematic lens flare |
| `clockWipe()` | Radial sweep reveal (9 patterns) |
| `pixelate()` | Digital mosaic dissolution |
| `checkerboard()` | Grid-based reveal (9 patterns) |
| `fade()` | Standard crossfade |
| `slide()` | Directional slide |
| `wipe()` | Linear wipe |
| `flip()` | 3D card flip |

Preview all transitions:
```bash
cd showcase/transitions && npm install && npm run studio
```

See [lib/transitions/README.md](lib/transitions/README.md) for full documentation and customization options.

---

## RTL Support

Full right-to-left layout mirroring for Hebrew and Arabic:

- Set `direction: "rtl"` in the Visual tab or config
- Auto-detected when selecting Hebrew (`he-*`) or Arabic (`ar-*`) voices
- All scene components mirror: flex direction, margins, slide animations, accent positions
- Logo watermark and decorative elements reposition correctly
- `useIsRTL()` hook available for custom components via the theme context

---

## Features

### Skills

Claude Code has deep knowledge in:

| Skill | Description |
|-------|-------------|
| **remotion** | React-based video framework - compositions, animations, rendering |
| **elevenlabs** | AI audio - text-to-speech, voice cloning, music, sound effects |
| **ffmpeg** | Media processing - format conversion, compression, resizing |
| **playwright-recording** | Browser automation - record demos as video |
| **frontend-design** | Visual design refinement for distinctive, production-grade aesthetics |
| **qwen-edit** | AI image editing - prompting patterns and best practices |
| **acestep** | AI music generation - prompts, lyrics, scene presets, video integration |
| **ltx2** | AI video generation - text-to-video, image-to-video clips, prompting guide |
| **runpod** | Cloud GPU - setup, Docker images, endpoint management, costs |

### Commands

| Command | Description |
|---------|-------------|
| `/setup` | First-time setup - cloud GPU, file transfer, voice, prerequisites |
| `/video` | Video projects - list, resume, or create new |
| `/scene-review` | Scene-by-scene review in Remotion Studio |
| `/design` | Focused design refinement session for a scene |
| `/brand` | Brand profiles - list, edit, or create new |
| `/template` | List available templates or create new ones |
| `/skills` | List installed skills or create new ones |
| `/contribute` | Share improvements - issues, PRs, examples |
| `/record-demo` | Record browser interactions with Playwright |
| `/generate-voiceover` | Generate AI voiceover from a script |
| `/redub` | Redub existing video with a different voice |
| `/voice-clone` | Record, test, and save a cloned voice to a brand |
| `/versions` | Check dependency versions and toolkit updates |

> **Note:** After creating or modifying commands/skills, restart Claude Code to load changes.

### Templates

Pre-built video structures in `templates/`:

- **product-demo** - Marketing videos with dark tech aesthetic, stats, CTA
- **sprint-review** - Sprint review videos with demos, stats, and voiceover
- **sprint-review-v2** - Composable scene-based sprint review with modular architecture

### Brand Profiles

Define visual identity in `brands/`. When you create a project, the brand's colors, fonts, and styling are automatically applied.

```
brands/my-brand/
├── brand.json    # Colors, fonts, typography, spacing
├── voice.json    # Voice settings (voice ID, rate, pitch)
└── assets/       # Logo, backgrounds
```

Included brands: `default`, `digital-samba`

Create your own with `/brand` or by adding files to `brands/your-brand/`.

**brand.json example:**
```json
{
  "colors": {
    "primary": "#ea580c",
    "primaryLight": "#fb923c",
    "accent": "#3771e0",
    "textDark": "#ffffff",
    "bgLight": "#0f172a",
    "bgDark": "#020617"
  },
  "fonts": {
    "primary": "Inter, system-ui, sans-serif",
    "mono": "JetBrains Mono, monospace"
  },
  "typography": {
    "h1": { "size": 72, "weight": 700 },
    "h2": { "size": 56, "weight": 700 },
    "body": { "size": 28, "weight": 400 }
  }
}
```

---

## Audio

### Voiceover

- **Edge TTS** (default, free) - 24+ voices including Hebrew and Arabic
- **ElevenLabs** (premium, optional) - requires API key in `.env`
- **Qwen3-TTS** (cloud GPU) - self-hosted via Modal/RunPod
- Per-scene narration text in the form or config
- Adjustable speech rate

### Background Music

- Auto-generated synthetic music (Python-based)
- Adjustable volume (default: 0.1)
- Custom music file upload supported
- ACE-Step AI music generation via cloud GPU

### Sound Effects

- Auto-generated: whoosh, click, reveal, success, boom
- Per-transition SFX support

---

## Configuration

### JSON Config Structure

```json
{
  "type": "product-demo",
  "brand": "digital-samba",
  "product": {
    "name": "My Product",
    "tagline": "One line description",
    "website": "example.com",
    "logo": "images/logo.png"
  },
  "scenes": [
    { "type": "title", "headline": "Welcome", "duration": 5, "narration": "Welcome to..." },
    { "type": "problem", "headline": "The Problem", "bullets": ["Issue 1", "Issue 2"] },
    { "type": "image", "headline": "Our Solution", "layout": "fullscreen", "duration": 6 },
    { "type": "solution", "headline": "How It Works", "highlights": ["Fast", "Reliable"] },
    { "type": "cta", "headline": "Get Started", "url": "example.com" }
  ],
  "visual": {
    "background": "dark",
    "transition": { "type": "fade", "durationFrames": 15 },
    "direction": "ltr"
  },
  "audio": {
    "voiceover": { "enabled": true, "voice": "en-GB-RyanNeural", "rate": "-5%" },
    "music": { "enabled": true, "volume": 0.1 },
    "sfx": { "enabled": true }
  },
  "overlays": {
    "vignette": true,
    "filmGrain": false,
    "logoWatermark": { "enabled": true, "position": "top-left" }
  },
  "output": { "width": 1920, "height": 1080, "fps": 30 }
}
```

### Background Variants

| Variant | Style |
|---------|-------|
| `subtle` | Light gradient with soft floating shapes |
| `tech` | Dark grid with glowing accent lines |
| `warm` | Warm tones with organic shapes |
| `dark` | Deep dark with minimal decoration |

### Output Formats

- **Landscape**: 1920x1080 (default)
- **Vertical**: 1080x1920
- **Square**: 1080x1080
- **Subtitled**: adds auto-generated subtitle overlay
- **FPS**: 30 (default), configurable

---

## Project Structure

```
claude-code-video-toolkit/
├── app/                     # Web UI
│   ├── index.html           # Single-page form + gallery + player
│   ├── uploads/             # User-uploaded files
│   └── previews/            # Voice preview audio
│
├── lib/                     # Shared library (core engine)
│   ├── generator/           # Video generation pipeline
│   │   ├── schema.ts        # Config type definitions (VideoConfig, ResolvedConfig)
│   │   ├── defaults.ts      # Default durations, visual, audio settings
│   │   ├── resolve.ts       # Config resolver (fills defaults, calculates frames)
│   │   ├── compile.ts       # Remotion project compiler (generates TSX + JSON)
│   │   ├── assets.ts        # Audio generation (voiceover, music, SFX)
│   │   └── render.ts        # Remotion render + dependency install
│   │
│   ├── components/          # React components for video
│   │   ├── scenes/          # 13 scene type components
│   │   ├── AnimatedBackground.tsx  # 4 background variants
│   │   ├── Vignette.tsx     # Edge darkening overlay
│   │   ├── FilmGrain.tsx    # Cinematic grain effect
│   │   └── LogoWatermark.tsx # Corner logo branding
│   │
│   ├── transitions/         # 7 custom Remotion transitions
│   │   └── presentations/   # glitch, rgb-split, zoom-blur, light-leak,
│   │                        # clock-wipe, pixelate, checkerboard
│   │
│   ├── theme/               # ThemeProvider, useTheme, useIsRTL
│   ├── brand.ts             # Brand loader utilities
│   └── project/             # Multi-session project tracking
│
├── brands/                  # Brand profiles (colors, fonts, voice)
│   ├── default/
│   └── digital-samba/
│
├── templates/               # Remotion project templates
│   ├── product-demo/
│   ├── sprint-review/
│   └── sprint-review-v2/
│
├── tools/                   # CLI tools and server
│   ├── server.ts            # Express web server (port 3333)
│   ├── generate-video.ts    # CLI video generation
│   ├── voiceover.py         # TTS generation
│   ├── music.py             # Music generation (ElevenLabs)
│   ├── music_gen.py         # Music generation (ACE-Step)
│   ├── sfx.py               # Sound effects
│   ├── flux2.py             # FLUX.2 image generation
│   ├── ltx2.py              # LTX2 video generation
│   ├── image_edit.py        # AI image editing
│   ├── upscale.py           # AI upscaling
│   ├── sadtalker.py         # Avatar animation
│   ├── dewatermark.py       # Watermark removal
│   ├── redub.py             # Video redubbing
│   ├── chain_video.py       # Video concatenation
│   ├── sync_timing.py       # Audio-video sync
│   ├── addmusic.py          # Add music to video
│   ├── cloud_gpu.py         # Cloud GPU management
│   ├── file_transfer.py     # File transfer utilities
│   └── verify_setup.py      # Setup verification
│
├── docker/                  # Cloud GPU Docker configs (16 images)
│   ├── modal-flux2/         # Modal deployments (8)
│   ├── modal-music-gen/
│   ├── modal-qwen3-tts/
│   ├── runpod-flux2/        # RunPod deployments (8)
│   ├── runpod-acestep/
│   └── ...
│
├── examples/                # Example projects
│   ├── hello-world/         # Minimal beginner example
│   ├── digital-samba-skill-demo/
│   └── sprint-review-cho-oyu/
│
├── projects/                # Generated video projects (output)
├── showcase/                # Transition gallery demo
├── skills/                  # Claude Code skill definitions
├── docs/                    # Additional documentation
├── .github/workflows/       # CI/CD (Docker build, release, sync)
│
├── package.json
├── tsconfig.json
├── .env.example             # Environment variables template
├── .gitignore
├── CLAUDE.md                # Claude Code project instructions
├── SPEC.md                  # Project specification
├── CONTRIBUTING.md
├── CONTRIBUTORS.md
└── LICENSE                  # AGPL v3
```

---

## Examples

Example projects in `examples/`:

| Example | Level | Description |
| ------- | ----- | ----------- |
| `hello-world` | Beginner | Minimal 25-second video |
| `digital-samba-skill-demo` | Intermediate | Product demo with multiple scenes |
| `sprint-review-cho-oyu` | Intermediate | iOS sprint review format |

Each includes `project.json`, voiceover script, and asset requirements.

---

## Cloud GPU Tools (Optional)

8 AI tools run on cloud GPUs for advanced asset generation. **Not required for basic video creation.**

### Providers

| Provider | Setup | Cost |
|----------|-------|------|
| **Modal** (recommended) | `pip install modal && python3 -m modal setup` | $30/month free tier |
| **RunPod** (alternative) | API key from [runpod.io](https://runpod.io) | ~$0.44/hr GPU |

### Available Tools

| Tool | What It Does | Est. Cost/Run |
|------|-------------|---------------|
| `flux2` | Text-to-image generation (FLUX.2 Klein 4B) | ~$0.02 |
| `ltx2` | Text/image-to-video (LTX-2.3 22B) | ~$0.23 |
| `image_edit` | AI image editing & style transfer | ~$0.03 |
| `upscale` | AI upscaling 2x/4x (RealESRGAN) | ~$0.01 |
| `music_gen` | AI music (ACE-Step 1.5) | ~$0.05 |
| `qwen3_tts` | AI text-to-speech (9 speakers) | ~$0.01 |
| `sadtalker` | Talking avatar from portrait + audio | ~$0.10 |
| `dewatermark` | Video watermark removal (ProPainter) | ~$0.10 |

### Deploy to Modal

```bash
cd docker/modal-flux2
modal deploy app.py
# Copy the endpoint URL to .env
```

See [docs/modal-setup.md](docs/modal-setup.md) and [docs/runpod-setup.md](docs/runpod-setup.md) for details.

---

## Python Tools

Audio, video, and image tools in `tools/`:

```bash
# Voiceover
python tools/voiceover.py --script script.md --output voiceover.mp3
python tools/voiceover.py --provider qwen3 --speaker Ryan --scene-dir public/audio/scenes --json

# Music
python tools/music.py --prompt "Upbeat corporate" --duration 120 --output music.mp3
python tools/music_gen.py --preset corporate-bg --duration 120 --output music.mp3

# Image generation
python tools/flux2.py --prompt "A sunset over mountains" --cloud modal
python tools/flux2.py --preset title-bg --brand digital-samba --cloud modal

# Video generation
python tools/ltx2.py --prompt "A sunset over the ocean, cinematic" --cloud modal

# Image editing
python tools/image_edit.py --input photo.jpg --style cyberpunk --cloud modal

# Upscaling
python tools/upscale.py --input photo.jpg --output photo_4x.png --cloud modal

# Talking avatar
python tools/sadtalker.py --image portrait.png --audio voiceover.mp3 --output talking.mp4 --cloud modal

# Sound effects
python tools/sfx.py --preset whoosh --output sfx.mp3

# Redub video
python tools/redub.py --input video.mp4 --voice-id VOICE_ID --output dubbed.mp4

# Add music to video
python tools/addmusic.py --input video.mp4 --prompt "Subtle ambient" --output output.mp4
```

---

## Environment Variables

Copy `.env.example` to `.env` and uncomment the services you need:

```bash
# Cloudflare R2 (file transfer for cloud GPU)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=video-toolkit

# Modal endpoints (recommended cloud GPU)
MODAL_FLUX2_ENDPOINT_URL=
MODAL_QWEN3_TTS_ENDPOINT_URL=
MODAL_MUSIC_GEN_ENDPOINT_URL=
# ... see .env.example for all options

# RunPod (alternative cloud GPU)
RUNPOD_API_KEY=

# ElevenLabs (premium TTS, optional)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

All keys are **optional**. The toolkit works without any of them - basic video creation uses Edge TTS (free) and synthetic audio.

---

## Video Workflow

```
/video → Script → Assets → Scene Review → Design → Audio → Preview → Render
```

1. **Create project** - Run `/video`, choose template and brand
2. **Review script** - Edit voiceover script to plan content and assets
3. **Gather assets** - Record demos with `/record-demo` or upload media
4. **Scene review** - Run `/scene-review` to verify visuals in Remotion Studio
5. **Design refinement** - Use `/design` to improve visuals
6. **Generate audio** - AI voiceover with `/generate-voiceover`
7. **Preview** - `npm run studio` for live preview
8. **Iterate** - Adjust timing, styling, content
9. **Render** - `npm run render` for final MP4

---

## Project Management

Video projects are tracked through a multi-session lifecycle:

```
planning → assets → review → audio → editing → rendering → complete
```

Each project has a `project.json` that tracks scenes, audio status, work history, and current phase. The system reconciles intent with reality (what files actually exist) and generates context for resuming across sessions.

See [lib/project/README.md](lib/project/README.md) for schema details.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Filing issues and pull requests
- Adding new templates and scene types
- Adding new Claude Code skills
- Development setup

---

## License

[AGPL v3](LICENSE) (c) 2024-2026 [Studio Eylon](https://www.meylon.co.il). Originally based on [Digital Samba's claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit).

---

Built with [Claude Code](https://claude.ai/code) by Anthropic and [Remotion](https://www.remotion.dev/).
