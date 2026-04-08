/**
 * Video Generator Config Schema
 *
 * Defines the complete shape of a video.config.json file.
 * Every field except `type` and `content.scenes` is optional with smart defaults.
 */

// ============================================
// Scene Content Types
// ============================================

export interface TitleSceneContent {
  type: 'title';
  headline: string;
  subheadline?: string;
  logos?: Array<{ src: string; label?: string }>;
  duration?: number;
  narration?: string;
}

export interface ProblemSceneContent {
  type: 'problem';
  headline: string;
  problems?: Array<{ icon: string; text: string }>;
  bullets?: string[]; // shorthand for problems with auto icons
  codeExample?: string[];
  duration?: number;
  narration?: string;
}

export interface SolutionSceneContent {
  type: 'solution';
  headline: string;
  description?: string;
  highlights?: string[];
  duration?: number;
  narration?: string;
}

export interface DemoSceneContent {
  type: 'demo';
  demoType?: 'video' | 'browser' | 'terminal';
  videoFile?: string;
  label?: string;
  caption?: string;
  duration?: number;
  narration?: string;
}

export interface FeatureSceneContent {
  type: 'feature';
  headline: string;
  features: Array<{ icon?: string; title: string; description: string }>;
  duration?: number;
  narration?: string;
}

export interface StatsSceneContent {
  type: 'stats';
  headline?: string;
  stats: Array<{
    value: string;
    unit?: string;
    label: string;
    icon?: string;
    color?: string;
  }>;
  duration?: number;
  narration?: string;
}

export interface CTASceneContent {
  type: 'cta';
  headline: string;
  tagline?: string;
  url?: string; // shorthand — creates a website link
  links?: Array<{
    type: 'github' | 'website' | 'docs' | 'custom';
    label: string;
    url: string;
    icon?: string;
  }>;
  duration?: number;
  narration?: string;
}

export interface SpotlightSceneContent {
  type: 'spotlight';
  icon: string;
  feature: string;
  tagline: string;
  bullets: string[];
  accentColor?: string;
  duration?: number;
  narration?: string;
}

export interface ComparisonSceneContent {
  type: 'comparison';
  headline?: string;
  rows: Array<{
    feature: string;
    ours: string | boolean;
    others: string | boolean;
  }>;
  ourLabel?: string;
  theirLabel?: string;
  duration?: number;
  narration?: string;
}

export interface TestimonialSceneContent {
  type: 'testimonial';
  quote: string;
  author: string;
  role: string;
  company: string;
  rating?: number;
  duration?: number;
  narration?: string;
}

export interface InfographicSceneContent {
  type: 'infographic';
  headline?: string;
  counters?: Array<{
    label: string;
    value: number;
    suffix?: string;
    prefix?: string;
    description?: string;
    color?: string;
  }>;
  rings?: Array<{
    percentage: number;
    label: string;
    color?: string;
  }>;
  bars?: Array<{
    label: string;
    percentage: number;
    color?: string;
  }>;
  duration?: number;
  narration?: string;
}

export interface ImageSceneContent {
  type: 'image';
  imageSrc?: string;
  headline?: string;
  caption?: string;
  layout?: 'fullscreen' | 'contain' | 'split';
  duration?: number;
  narration?: string;
}

export interface WebinarIntroSceneContent {
  type: 'webinar-intro';
  brandName?: string;
  tagline?: string;
  duration?: number;
}

export interface WebinarOutroSceneContent {
  type: 'webinar-outro';
  headline?: string;
  url?: string;
  contacts?: string[];
  duration?: number;
}

export type SceneContent =
  | TitleSceneContent
  | ProblemSceneContent
  | SolutionSceneContent
  | DemoSceneContent
  | FeatureSceneContent
  | StatsSceneContent
  | CTASceneContent
  | SpotlightSceneContent
  | ComparisonSceneContent
  | TestimonialSceneContent
  | InfographicSceneContent
  | ImageSceneContent
  | WebinarIntroSceneContent
  | WebinarOutroSceneContent;

// ============================================
// Transition Config
// ============================================

export type TransitionType =
  | 'glitch' | 'rgb-split' | 'zoom-blur' | 'light-leak'
  | 'clock-wipe' | 'pixelate' | 'checkerboard'
  | 'fade' | 'slide' | 'wipe' | 'flip' | 'none';

export interface TransitionConfig {
  type: TransitionType;
  durationFrames?: number;
  props?: Record<string, any>;
}

// ============================================
// Visual Config
// ============================================

export type BackgroundVariant = 'subtle' | 'tech' | 'warm' | 'dark';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export interface VisualConfig {
  background?: BackgroundVariant;
  showGrid?: boolean;
  shapeCount?: number;
  animationSpeed?: AnimationSpeed;
  transition?: TransitionConfig;
  direction?: 'ltr' | 'rtl';
}

// ============================================
// Audio Config
// ============================================

export interface VoiceoverConfig {
  enabled?: boolean;
  voice?: string;       // e.g. 'en-GB-RyanNeural'
  rate?: string;        // e.g. '-5%'
  pitch?: string;       // e.g. '-2Hz'
}

export interface MusicConfig {
  enabled?: boolean;
  volume?: number;
  preset?: 'corporate' | 'ambient' | 'upbeat' | 'cinematic';
  customFile?: string;
}

export interface SFXConfig {
  enabled?: boolean;
  transitionSounds?: boolean;
}

export interface AudioConfig {
  voiceover?: VoiceoverConfig;
  music?: MusicConfig;
  sfx?: SFXConfig;
}

// ============================================
// Overlay Config
// ============================================

export interface VignetteConfig {
  enabled?: boolean;
  intensity?: number;
  centerSize?: number;
}

export interface FilmGrainConfig {
  enabled?: boolean;
  opacity?: number;
}

export interface LogoWatermarkConfig {
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: number;
  fadeInFrame?: number;
}

export interface OverlayConfig {
  vignette?: boolean | VignetteConfig;
  filmGrain?: boolean | FilmGrainConfig;
  logoWatermark?: boolean | LogoWatermarkConfig;
}

// ============================================
// Output Config
// ============================================

export type VariantType = 'subtitled' | 'vertical' | 'square';

export interface OutputConfig {
  width?: number;
  height?: number;
  fps?: number;
  format?: 'mp4' | 'webm';
}

// ============================================
// Root VideoConfig
// ============================================

export interface VideoConfig {
  /** Video type — determines default scene structure and styling */
  type: 'product-demo' | 'spotlight' | 'webinar' | 'infographic' | 'comparison' | 'testimonial';

  /** Brand profile name from brands/ directory */
  brand?: string;

  /** Product/brand info */
  product?: {
    name: string;
    tagline?: string;
    website?: string;
    logo?: string;
  };

  /** Scene definitions — the core content */
  scenes: SceneContent[];

  /** Visual styling */
  visual?: VisualConfig;

  /** Audio settings */
  audio?: AudioConfig;

  /** Overlay effects */
  overlays?: OverlayConfig;

  /** Output format */
  output?: OutputConfig;

  /** Additional render variants */
  variants?: VariantType[];
}

// ============================================
// Resolved Config (all defaults filled)
// ============================================

export interface ResolvedScene {
  type: SceneContent['type'];
  content: Record<string, any>;
  durationSeconds: number;
  durationFrames: number;
  startFrame: number;
  narration?: string;
  audioFile?: string;
  transition?: TransitionConfig;
}

export interface ResolvedConfig {
  type: VideoConfig['type'];
  projectName: string;
  brand: string;
  product: Required<NonNullable<VideoConfig['product']>>;
  scenes: ResolvedScene[];
  visual: Required<VisualConfig>;
  audio: {
    voiceover: Required<VoiceoverConfig>;
    music: Required<MusicConfig>;
    sfx: Required<SFXConfig>;
  };
  overlays: {
    vignette: Required<VignetteConfig>;
    filmGrain: Required<FilmGrainConfig>;
    logoWatermark: Required<LogoWatermarkConfig>;
  };
  output: Required<OutputConfig>;
  variants: VariantType[];
  totalDurationSeconds: number;
  totalFrames: number;
}
