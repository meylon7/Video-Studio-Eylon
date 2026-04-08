# SPEC.md — Studio Eylon Video Toolkit

## Project Name
Studio Eylon Video Toolkit

## Status
Active — Production-ready. Forked from `digitalsamba/claude-code-video-toolkit` and significantly extended.

## Repository
https://github.com/meylon7/Video-Studio-Eylon

## Overview

An AI-powered video creation toolkit built on [Remotion](https://www.remotion.dev/) and [Claude Code](https://claude.ai/code).
The toolkit generates production-quality MP4 videos from a JSON config, with a full Web UI,
13 animated scene types, config-driven pipeline, Hebrew/Arabic RTL support, image/video upload integration,
cloud GPU tools, and gallery management.

Designed for AI educators, marketers, and developers who need to produce branded video content
without a dedicated video production team.

---

## Evolution History

| Phase | What Was Built |
|-------|----------------|
| V1 | Single-file product demo, validated core workflow with `digitalsamba` base |
| V2 | Brand profiles, project lifecycle tracking, `product-demo` + `sprint-review` templates |
| V3 | Config-driven generation pipeline, JSON schema, `resolve.ts` / `compile.ts` / `render.ts` |
| V4 | Web UI (port 3333), form-based workflow, drag-and-drop uploads, gallery |
| V5 | 13 scene types with animated entrances, 7 custom cinematic transitions |
| V6 | Full RTL support (Hebrew + Arabic), `useIsRTL()` hook, mirrored layouts |
| V7 | Cloud GPU tools (Modal + RunPod), 8 AI tools (FLUX.2, LTX-2, ACE-Step, SadTalker, etc.) |
| V8 | Edge TTS + ElevenLabs + Qwen3-TTS audio pipeline, background music, SFX |
| V9 | 16 Docker images, CI/CD workflows, AGPL release, open-source contribution structure |

---

## Primary Deliverable

A fully rendered MP4 video, generated from a JSON config or Web UI form, with:
- Branded visual identity
- Animated scenes with transitions
- AI voiceover and background music
- RTL/LTR layout support

---

## Audiences

| Audience | Use Case |
|----------|----------|
| AI educators | Course intro/outro videos, webinar openers |
| Marketers | Product demos, launch announcements |
| Developers | Sprint review recaps, tool walkthroughs |
| Hebrew/Arabic content creators | RTL-native video production |

---

## Architecture

### Core Stack
- **Remotion** — React-based video rendering engine
- **TypeScript** — all generation pipeline code
- **Python** — audio, image, video AI tools
- **Express** — Web UI server (port 3333)
- **Docker** — cloud GPU deployments (Modal + RunPod)

### Generation Pipeline

```
Form / JSON Config
    → resolve.ts     (fill defaults, calculate frames)
    → compile.ts     (generate Remotion TSX + composition JSON)
    → assets.ts      (voiceover, music, SFX)
    → render.ts      (Remotion render → MP4)
```

### Directory Structure

```
├── app/              Web UI (HTML form, gallery, player)
├── lib/
│   ├── generator/    Pipeline: schema, defaults, resolve, compile, assets, render
│   ├── components/   React scene components + overlays
│   ├── transitions/  7 custom cinematic transitions
│   └── theme/        ThemeProvider, useTheme, useIsRTL
├── brands/           Brand profiles (colors, fonts, voice)
├── templates/        Remotion project templates
├── tools/            CLI tools, server, Python AI scripts
├── docker/           16 cloud GPU Docker images
├── skills/           Claude Code skill definitions
└── examples/         hello-world, product-demo, sprint-review
```

---

## Scene Types (13)

| Type | Purpose |
|------|---------|
| `title` | Opening scene with logo and headline |
| `problem` | Pain points with animated cards |
| `solution` | Solution reveal with highlight cards |
| `demo` | Video playback in browser/terminal chrome |
| `image` | Uploaded image (fullscreen / contain / split) |
| `stats` | Animated stat cards with icons |
| `spotlight` | Feature deep-dive with bullet points |
| `comparison` | Side-by-side feature comparison table |
| `testimonial` | Customer quote with word-by-word reveal |
| `infographic` | Animated counters, progress rings, bar charts |
| `cta` | Call-to-action with links and logo |
| `webinar-intro` | Webinar opening with animated particles |
| `webinar-outro` | Webinar closing with fade-out |

---

## Transitions (11)

7 custom cinematic: `glitch`, `rgbSplit`, `zoomBlur`, `lightLeak`, `clockWipe`, `pixelate`, `checkerboard`
4 official Remotion: `fade`, `slide`, `wipe`, `flip`

---

## Audio Pipeline

| Provider | Type | Cost |
|----------|------|------|
| Edge TTS | 24+ voices including Hebrew/Arabic | Free |
| ElevenLabs | Premium TTS + voice cloning | API key required |
| Qwen3-TTS | Self-hosted, 9 speakers | Cloud GPU |
| ACE-Step | AI music generation | Cloud GPU |
| Python SFX | Synthetic sound effects | Free |

---

## Cloud GPU Tools (Optional)

| Tool | What It Does |
|------|-------------|
| `flux2` | Text-to-image (FLUX.2 Klein 4B) |
| `ltx2` | Text/image-to-video (LTX-2.3 22B) |
| `image_edit` | AI image editing and style transfer |
| `upscale` | AI upscaling 2x/4x (RealESRGAN) |
| `music_gen` | AI music generation (ACE-Step 1.5) |
| `qwen3_tts` | Text-to-speech (9 speakers) |
| `sadtalker` | Talking avatar from portrait + audio |
| `dewatermark` | Video watermark removal (ProPainter) |

Providers: Modal (recommended, $30/month free tier), RunPod (~$0.44/hr GPU).

---

## RTL Support

- Set `direction: "rtl"` in config or Visual tab
- Auto-detected when selecting `he-*` or `ar-*` voices
- All scene components mirror: flex direction, margins, slide animations, accent positions
- Logo watermark and decorative elements reposition correctly
- `useIsRTL()` hook available for custom components

---

## Brand System

Each brand profile in `brands/` defines:
- `brand.json` — colors, fonts, typography
- `voice.json` — voice ID, rate, pitch
- `assets/` — logo, backgrounds

Included brands: `default`, `digital-samba` (Studio Eylon).
Custom brands created via `/brand` command or by adding files directly.

---

## Claude Code Commands

| Command | Description |
|---------|-------------|
| `/setup` | First-time setup (cloud GPU, voice, prerequisites) |
| `/video` | List, resume, or create video projects |
| `/scene-review` | Scene-by-scene review in Remotion Studio |
| `/design` | Focused design refinement for a scene |
| `/brand` | List, edit, or create brand profiles |
| `/template` | List or create templates |
| `/record-demo` | Record browser interactions with Playwright |
| `/generate-voiceover` | Generate AI voiceover from script |
| `/redub` | Redub existing video with a different voice |
| `/voice-clone` | Record, test, and save a cloned voice |

---

## Output Formats

| Format | Resolution |
|--------|-----------|
| Landscape (default) | 1920×1080 |
| Vertical | 1080×1920 |
| Square | 1080×1080 |

FPS: 30 (default), configurable. Subtitled variant supported.

---

## Web UI

Tabs: Project → Visual → Audio → Scenes → Media & Assets

Features:
- Drag-and-drop asset upload (logo, images, videos)
- 24+ voice selection with live preview
- Scene builder with type-specific fields
- Gallery with playback, download, and delete
- Generation progress polling via `/api/status/:jobId`

---

## Success Criteria (Current)

- A first-time user can generate a branded MP4 within 10 minutes using the Web UI without any API keys.
- All 13 scene types render cleanly in LTR and RTL layouts.
- The JSON config is the single source of truth — the same config produces the same video in any environment.
- Cloud GPU tools are optional and additive — the toolkit is fully functional without them.
- Generated projects are self-contained and can be re-rendered independently.

---

## Known Constraints

- Remotion rendering is CPU-bound locally; cloud GPU recommended for fast iteration at scale.
- `sadtalker` and `dewatermark` tools carry usage responsibilities — use responsibly and respect content ownership.
- ElevenLabs voice cloning requires explicit consent from the voice owner.
- Edge TTS requires Python 3.9+ and internet access at render time.

---

## Out of Scope (Current Version)

- Real-time collaborative editing
- Browser-based Remotion Studio (local only)
- Native mobile rendering
- Multi-language subtitle generation
- Complex 3D scene animation beyond current transitions

---

## Roadmap (V10+)

- [ ] Scene preview thumbnails in Web UI before render
- [ ] Template marketplace / community submissions
- [ ] One-click deploy to Cloudflare Pages or Vercel
- [ ] Subtitle export (SRT/VTT) from narration script
- [ ] Claude Code integration for scene suggestions mid-session

---

## License

AGPL v3 © 2024–2026 [Studio Eylon](https://www.meylon.co.il).
Originally based on [Digital Samba's claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit).
