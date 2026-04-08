/**
 * Config Resolver — Stage 1
 *
 * Takes a raw VideoConfig, loads brand, merges defaults,
 * and produces a fully-resolved config with zero optional fields.
 */

import type { VideoConfig, ResolvedConfig, ResolvedScene, SceneContent, ProblemSceneContent, CTASceneContent } from './schema';
import {
  getSceneDuration,
  DEFAULT_VISUAL,
  DEFAULT_AUDIO,
  DEFAULT_OVERLAYS,
  DEFAULT_OUTPUT,
  DEFAULT_PRODUCT,
  DEFAULT_PROBLEM_ICONS,
  DEFAULT_TRANSITION,
} from './defaults';

/** Resolve a raw config into a fully-populated ResolvedConfig */
export function resolveConfig(raw: VideoConfig, projectName: string): ResolvedConfig {
  const fps = raw.output?.fps || DEFAULT_OUTPUT.fps;

  // Resolve scenes with frame offsets
  let currentFrame = 0;
  const scenes: ResolvedScene[] = raw.scenes.map((scene, i) => {
    const durationSeconds = getSceneDuration(scene);
    const durationFrames = durationSeconds * fps;
    const startFrame = currentFrame;
    currentFrame += durationFrames;

    // Expand shorthand formats
    const content = expandSceneContent(scene);

    return {
      type: scene.type,
      content,
      durationSeconds,
      durationFrames,
      startFrame,
      narration: 'narration' in scene ? scene.narration : undefined,
      transition: i < raw.scenes.length - 1
        ? (raw.visual?.transition || DEFAULT_TRANSITION)
        : undefined,
    };
  });

  const totalFrames = currentFrame;
  const totalDurationSeconds = totalFrames / fps;

  // Resolve overlays (handle boolean shorthand)
  const vignetteRaw = raw.overlays?.vignette;
  const vignette = vignetteRaw === true
    ? DEFAULT_OVERLAYS.vignette
    : vignetteRaw === false
    ? { ...DEFAULT_OVERLAYS.vignette, enabled: false }
    : { ...DEFAULT_OVERLAYS.vignette, ...vignetteRaw };

  const grainRaw = raw.overlays?.filmGrain;
  const filmGrain = grainRaw === true
    ? { ...DEFAULT_OVERLAYS.filmGrain, enabled: true }
    : grainRaw === false
    ? DEFAULT_OVERLAYS.filmGrain
    : { ...DEFAULT_OVERLAYS.filmGrain, ...grainRaw };

  const watermarkRaw = raw.overlays?.logoWatermark;
  const logoWatermark = watermarkRaw === true
    ? { ...DEFAULT_OVERLAYS.logoWatermark, enabled: true }
    : watermarkRaw === false
    ? DEFAULT_OVERLAYS.logoWatermark
    : { ...DEFAULT_OVERLAYS.logoWatermark, ...watermarkRaw };

  // Auto-enable voiceover if any scene has narration
  const hasNarration = raw.scenes.some(s => 'narration' in s && s.narration);
  const voiceover = {
    ...DEFAULT_AUDIO.voiceover,
    ...raw.audio?.voiceover,
    enabled: raw.audio?.voiceover?.enabled ?? hasNarration,
  };

  // Auto-enable logo watermark if product has a logo
  if (raw.product?.logo && !raw.overlays?.logoWatermark) {
    logoWatermark.enabled = true;
  }

  return {
    type: raw.type,
    projectName,
    brand: raw.brand || 'default',
    product: {
      ...DEFAULT_PRODUCT,
      ...raw.product,
    },
    scenes,
    visual: {
      ...DEFAULT_VISUAL,
      ...raw.visual,
      transition: raw.visual?.transition || DEFAULT_TRANSITION,
    },
    audio: {
      voiceover,
      music: { ...DEFAULT_AUDIO.music, ...raw.audio?.music },
      sfx: { ...DEFAULT_AUDIO.sfx, ...raw.audio?.sfx },
    },
    overlays: { vignette, filmGrain, logoWatermark },
    output: { ...DEFAULT_OUTPUT, ...raw.output },
    variants: raw.variants || [],
    totalDurationSeconds,
    totalFrames,
  };
}

/** Expand shorthand scene content into full format */
function expandSceneContent(scene: SceneContent): Record<string, any> {
  const { type, duration, narration, ...content } = scene as any;

  // Problem: convert bullets[] shorthand to problems[]
  if (type === 'problem' && content.bullets && !content.problems) {
    content.problems = content.bullets.map((text: string, i: number) => ({
      icon: DEFAULT_PROBLEM_ICONS[i % DEFAULT_PROBLEM_ICONS.length],
      text,
    }));
    delete content.bullets;
  }

  // CTA: convert url shorthand to links[]
  if (type === 'cta' && content.url && !content.links) {
    content.links = [
      { type: 'website', label: 'Learn more', url: content.url },
    ];
    delete content.url;
  }

  return content;
}
