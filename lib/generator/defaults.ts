/**
 * Smart Defaults for Video Generator
 *
 * Every config field has a sensible default so minimal configs
 * still produce good videos.
 */

import type {
  VideoConfig,
  SceneContent,
  TransitionConfig,
  VisualConfig,
  AudioConfig,
  OverlayConfig,
  OutputConfig,
} from './schema';

/** Default scene durations by type (seconds) */
export const DEFAULT_SCENE_DURATIONS: Record<string, number> = {
  'title': 5,
  'problem': 7,
  'solution': 6,
  'demo': 10,
  'feature': 8,
  'stats': 7,
  'cta': 5,
  'spotlight': 15,
  'comparison': 12,
  'testimonial': 10,
  'infographic': 20,
  'image': 6,
  'webinar-intro': 5,
  'webinar-outro': 5,
};

/** Auto-calculate duration from narration text */
export function estimateDurationFromText(text: string, minDuration: number = 4): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  // ~2.5 words per second for natural narration pace
  const estimated = Math.ceil(words / 2.5) + 1;
  return Math.max(minDuration, estimated);
}

/** Get scene duration: explicit > narration-based > type default */
export function getSceneDuration(scene: SceneContent): number {
  if (scene.duration) return scene.duration;
  if ('narration' in scene && scene.narration) {
    return estimateDurationFromText(scene.narration);
  }
  return DEFAULT_SCENE_DURATIONS[scene.type] || 6;
}

/** Default problem icons when user provides bullets shorthand */
export const DEFAULT_PROBLEM_ICONS = ['🔧', '🎨', '🔒', '📉', '⚙️', '💸', '🐛', '📊'];

/** Default transition between scenes */
export const DEFAULT_TRANSITION: TransitionConfig = {
  type: 'fade',
  durationFrames: 15,
};

/** Default visual config */
export const DEFAULT_VISUAL: Required<VisualConfig> = {
  background: 'dark',
  showGrid: false,
  shapeCount: 8,
  animationSpeed: 'normal',
  transition: DEFAULT_TRANSITION,
  direction: 'ltr',
};

/** Default audio config */
export const DEFAULT_AUDIO = {
  voiceover: {
    enabled: false,
    voice: 'en-GB-RyanNeural',
    rate: '-5%',
    pitch: '-2Hz',
  },
  music: {
    enabled: true,
    volume: 0.1,
    preset: 'corporate' as const,
    customFile: '',
  },
  sfx: {
    enabled: true,
    transitionSounds: true,
  },
};

/** Default overlay config */
export const DEFAULT_OVERLAYS = {
  vignette: { enabled: true, intensity: 0.4, centerSize: 50 },
  filmGrain: { enabled: false, opacity: 0.05 },
  logoWatermark: { enabled: false, position: 'bottom-right' as const, size: 36, fadeInFrame: 120 },
};

/** Default output config */
export const DEFAULT_OUTPUT: Required<OutputConfig> = {
  width: 1920,
  height: 1080,
  fps: 30,
  format: 'mp4',
};

/** Default product info */
export const DEFAULT_PRODUCT = {
  name: 'My Product',
  tagline: '',
  website: '',
  logo: '',
};

/** SFX files to use at scene transitions */
export const TRANSITION_SFX: Record<string, string> = {
  'title': 'sfx-boom.wav',
  'problem': 'sfx-whoosh.wav',
  'solution': 'sfx-reveal.wav',
  'stats': 'sfx-success.wav',
  'cta': 'sfx-click.wav',
  'spotlight': 'sfx-boom.wav',
  'comparison': 'sfx-whoosh.wav',
  'testimonial': 'sfx-reveal.wav',
  'infographic': 'sfx-boom.wav',
  'webinar-intro': 'sfx-boom.wav',
  'webinar-outro': 'sfx-success.wav',
};

/** Animation speed multipliers */
export const SPEED_MULTIPLIER: Record<string, number> = {
  'slow': 0.7,
  'normal': 1.0,
  'fast': 1.4,
};
