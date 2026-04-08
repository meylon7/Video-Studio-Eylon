import React from 'react';
import type { SceneProps } from './types';
export type { SceneProps } from './types';

// Import all scenes
import { TitleScene } from './TitleScene';
import { ProblemScene } from './ProblemScene';
import { SolutionScene } from './SolutionScene';
import { DemoScene } from './DemoScene';
import { StatsScene } from './StatsScene';
import { CTAScene } from './CTAScene';
import { SpotlightScene } from './SpotlightScene';
import { ComparisonScene } from './ComparisonScene';
import { TestimonialScene } from './TestimonialScene';
import { InfographicScene } from './InfographicScene';
import { WebinarIntroScene } from './WebinarIntroScene';
import { WebinarOutroScene } from './WebinarOutroScene';
import { ImageScene } from './ImageScene';

// Re-export individual scenes
export {
  TitleScene,
  ProblemScene,
  SolutionScene,
  DemoScene,
  StatsScene,
  CTAScene,
  SpotlightScene,
  ComparisonScene,
  TestimonialScene,
  InfographicScene,
  WebinarIntroScene,
  WebinarOutroScene,
  ImageScene,
};

/**
 * Scene registry mapping scene type strings to their React components.
 * Used by the config-driven video generator to resolve scene types.
 */
export const SCENE_REGISTRY: Record<string, React.FC<SceneProps>> = {
  'title': TitleScene,
  'problem': ProblemScene,
  'solution': SolutionScene,
  'demo': DemoScene,
  'feature': StatsScene,       // alias: feature scenes use stats layout with different default styling
  'stats': StatsScene,
  'cta': CTAScene,
  'spotlight': SpotlightScene,
  'comparison': ComparisonScene,
  'testimonial': TestimonialScene,
  'infographic': InfographicScene,
  'webinar-intro': WebinarIntroScene,
  'webinar-outro': WebinarOutroScene,
  'image': ImageScene,
};
