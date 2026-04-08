/**
 * Shared video components
 *
 * These components are building blocks for video templates.
 * Import into templates via: import { ComponentName } from '../../../lib/components';
 */

// Backgrounds
export { AnimatedBackground } from './AnimatedBackground';
export type { AnimatedBackgroundProps, BackgroundVariant } from './AnimatedBackground';

// Overlays
export { Vignette } from './Vignette';
export type { VignetteProps } from './Vignette';

export { FilmGrain } from './FilmGrain';
export type { FilmGrainProps } from './FilmGrain';

export { LogoWatermark } from './LogoWatermark';
export type { LogoWatermarkProps } from './LogoWatermark';

// Utilities
export { hexToRgba, SIZE_PRESETS, POSITION_PRESETS } from './utils';
export type { SizePreset, PositionPreset } from './utils';
