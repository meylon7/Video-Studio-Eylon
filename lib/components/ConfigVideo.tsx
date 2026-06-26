/**
 * ConfigVideo — self-contained, props-driven composition for the in-app
 * Remotion Player. Takes a RAW config (the same shape the web form's
 * buildConfig() produces), resolves it, and renders the full video:
 * animated background, color grade, overlays, scenes with PER-SCENE
 * transitions and PER-SCENE effects, film grain, the cinematic effects
 * layer, and a styleable on-screen caption track built from narration.
 *
 * Driven entirely by its `config` prop so it updates live as the user edits.
 * If anything throws, the error is shown ON the frame (not a black screen) and
 * logged to the console, so failures are debuggable instead of invisible.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { glitch } from '../transitions/presentations/glitch';
import { rgbSplit } from '../transitions/presentations/rgb-split';
import { zoomBlur } from '../transitions/presentations/zoom-blur';
import { lightLeak } from '../transitions/presentations/light-leak';
import { clockWipe } from '../transitions/presentations/clock-wipe';
import { pixelate } from '../transitions/presentations/pixelate';
import { checkerboard } from '../transitions/presentations/checkerboard';
import { ThemeProvider, defaultThemeValues } from '../theme';
import { SCENE_REGISTRY } from './scenes';
import { AnimatedBackground } from './AnimatedBackground';
import { Vignette } from './Vignette';
import { LogoWatermark } from './LogoWatermark';
import { FilmGrain } from './FilmGrain';
import { EffectsLayer, colorGradeFilter } from './EffectsLayer';
import { resolveConfig } from '../generator/resolve';

function resolveTransition(type: string, props: any = {}) {
  switch (type) {
    case 'fade': return fade(props);
    case 'slide': return slide(props);
    case 'wipe': return wipe(props);
    case 'flip': return flip(props);
    case 'glitch': return glitch(props);
    case 'rgb-split': return rgbSplit(props);
    case 'zoom-blur': return zoomBlur(props);
    case 'light-leak': return lightLeak(props);
    case 'clock-wipe': return clockWipe(props);
    case 'pixelate': return pixelate(props);
    case 'checkerboard': return checkerboard(props);
    default: return fade();
  }
}

/** Strip media srcs that can't resolve in the preview (no public dir yet). */
function stripMedia(content: Record<string, any>): Record<string, any> {
  const c = { ...content };
  delete c.imageSrc;
  delete c.videoFile;
  delete c.backgroundImage;
  return c;
}

/** Visible error panel — used instead of a silent black screen. */
const ErrorFill: React.FC<{ msg: string }> = ({ msg }) => (
  <AbsoluteFill style={{ background: '#1a0b0b', color: '#fca5a5', padding: 48, fontFamily: 'monospace', fontSize: 22, overflow: 'auto', alignItems: 'flex-start', justifyContent: 'center' }}>
    <div>
      <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 14 }}>שגיאת תצוגה מקדימה</div>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg}</div>
    </div>
  </AbsoluteFill>
);

/** Catches a throwing scene so one bad scene can't black out the whole preview. */
class SceneBoundary extends React.Component<{ label: string; children: React.ReactNode }, { failed: boolean }> {
  constructor(props: any) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'sans-serif', fontSize: 28 }}>
          {this.props.label}
        </AbsoluteFill>
      );
    }
    return this.props.children as any;
  }
}

/** Soft placeholder shown in the live preview for media scenes (image/video). */
const MediaPlaceholder: React.FC<{ kind: 'image' | 'video'; label?: string }> = ({ kind, label }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 80 }}>
    <div style={{
      width: '78%', maxWidth: 1300, aspectRatio: '16 / 9', borderRadius: 18,
      border: '2px dashed rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{ fontSize: 64, opacity: 0.85 }}>{kind === 'video' ? '🎬' : '🖼️'}</div>
      {label ? <div style={{ color: '#e2e8f0', fontFamily: 'sans-serif', fontSize: 34, fontWeight: 700 }}>{label}</div> : null}
      <div style={{ color: '#94a3b8', fontFamily: 'sans-serif', fontSize: 22 }}>
        {kind === 'video' ? 'הוידאו יופיע ברינדור הסופי' : 'התמונה תופיע ברינדור הסופי'}
      </div>
    </div>
  </AbsoluteFill>
);

export interface CaptionStyle {
  position: 'bottom' | 'top';
  color: string;
  size: number;
  background: boolean;
  direction: string;
}

/** Bottom (or top) caption bar driven by the active scene's narration. */
const CaptionTrack: React.FC<{ scenes: any[]; style: CaptionStyle }> = ({ scenes, style }) => {
  const frame = useCurrentFrame();
  let text = '';
  for (const s of scenes) {
    const start = s.startFrame + 8;
    const end = s.startFrame + s.durationFrames - 6;
    if (s.narration && frame >= start && frame <= end) { text = s.narration; break; }
  }
  if (!text) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0,
      ...(style.position === 'top' ? { top: 64 } : { bottom: 72 }),
      display: 'flex', justifyContent: 'center', zIndex: 120, padding: '0 8%',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: style.background ? 'rgba(8,12,24,0.78)' : 'transparent',
        backdropFilter: style.background ? 'blur(6px)' : undefined,
        borderRadius: 14, padding: style.background ? '14px 30px' : 0, maxWidth: '88%',
      }}>
        <span style={{
          color: style.color, fontSize: style.size, fontWeight: 600, lineHeight: 1.35,
          fontFamily: defaultThemeValues.fonts.primary, textAlign: 'center', display: 'block',
          direction: style.direction as any,
          textShadow: style.background ? undefined : '0 2px 10px rgba(0,0,0,0.85)',
        }}>{text}</span>
      </div>
    </div>
  );
};

export interface ConfigVideoProps {
  config: any;
}

/** Resolve a raw config and return Player metadata (safe defaults on failure). */
export function previewMeta(config: any) {
  try {
    const r = resolveConfig(config, 'preview');
    return {
      durationInFrames: Math.max(1, r.totalFrames || 1),
      fps: r.output.fps || 30,
      width: r.output.width || 1920,
      height: r.output.height || 1080,
    };
  } catch (e) {
    console.error('[preview] previewMeta resolve failed:', e);
    return { durationInFrames: 1, fps: 30, width: 1920, height: 1080 };
  }
}

const PLACEHOLDER_BG = '#0B1020';

export const ConfigVideo: React.FC<ConfigVideoProps> = ({ config }) => {
  try {
    const resolved = resolveConfig(config, 'preview');
    const { scenes, visual, overlays, product } = resolved;

    if (!scenes || !scenes.length) {
      return (
        <AbsoluteFill style={{ background: PLACEHOLDER_BG, color: '#64748b', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', fontSize: 30 }}>
          הוסף סצנה כדי לראות תצוגה מקדימה
        </AbsoluteFill>
      );
    }

    const gradeFilter = colorGradeFilter(overlays.colorGrade && overlays.colorGrade.preset);
    const direction = visual.direction || 'ltr';
    const captionsOn = overlays.captions && overlays.captions.enabled;
    const baseIntensity = (overlays.effects && overlays.effects.intensity) || 1;

    // Light backgrounds: [base, tint] for a soft gradient + a dark-text palette.
    const LIGHT_BG: Record<string, [string, string]> = {
      light: ['#ffffff', '#eef2f7'], paper: ['#f7f1e6', '#ece2cf'], sky: ['#eef5fd', '#d6e7fb'],
    };
    const lightPair = LIGHT_BG[visual.background as string];
    const bgDark = !lightPair && (visual.background === 'dark' || visual.background === 'tech');
    const lightPalette: Record<string, string> = lightPair ? {
      textDark: '#0f172a', textMedium: '#475569', textLight: '#94a3b8',
      bgLight: lightPair[0], bgDark: lightPair[0],
      bgOverlay: 'rgba(15,23,42,0.05)', divider: '#e2e8f0', shadow: 'rgba(15,23,42,0.12)',
    } : {};

    // Title/accent color overrides restyle every scene's headings.
    const colorOverride: Record<string, string> = {};
    if (visual.titleColor) colorOverride.textDark = visual.titleColor;
    if (visual.accentColor) { colorOverride.primary = visual.accentColor; colorOverride.accent = visual.accentColor; }
    const theme = { ...defaultThemeValues, direction, colors: { ...defaultThemeValues.colors, ...lightPalette, ...colorOverride } };

    const capStyle: CaptionStyle = {
      position: (overlays.captions && overlays.captions.position) || 'bottom',
      color: (overlays.captions && overlays.captions.color) || '#ffffff',
      size: (overlays.captions && overlays.captions.size) || 34,
      background: overlays.captions ? overlays.captions.background !== false : true,
      direction,
    };

    return (
      <ThemeProvider theme={theme as any}>
        <AbsoluteFill
          style={{
            backgroundColor: lightPair ? lightPair[0] : (bgDark ? defaultThemeValues.colors.bgDark : defaultThemeValues.colors.bgLight),
            fontFamily: defaultThemeValues.fonts.primary,
            direction: direction as any,
            textAlign: direction === 'rtl' ? 'right' : 'left',
            filter: gradeFilter || undefined,
          }}
        >
          {lightPair ? (
            <AbsoluteFill style={{ background: `radial-gradient(120% 120% at 80% 10%, ${lightPair[1]}, ${lightPair[0]})` }} />
          ) : (
            <AnimatedBackground variant={visual.background as any} />
          )}
          {visual.backgroundImage && (
            <AbsoluteFill>
              <img src={visual.backgroundImage} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
            </AbsoluteFill>
          )}

          {overlays.vignette.enabled && <Vignette intensity={overlays.vignette.intensity} />}
          {overlays.logoWatermark.enabled && product.name && (
            <LogoWatermark logoSrc="" label={product.name} fadeInFrame={30} size={80} maxOpacity={0.9} />
          )}

          <TransitionSeries>
            {scenes.map((scene: any, i: number) => {
              const SceneComponent = (SCENE_REGISTRY as any)[scene.type];
              const isMedia = scene.type === 'demo' || scene.type === 'image';
              const fx = scene.fx;
              const sceneGrade = fx && fx.colorGrade ? colorGradeFilter(fx.colorGrade) : '';
              const txn = scene.transition;

              const body = !SceneComponent ? (
                <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  {scene.type}
                </AbsoluteFill>
              ) : isMedia ? (
                <MediaPlaceholder kind={scene.type === 'demo' ? 'video' : 'image'} label={scene.content.label || scene.content.headline} />
              ) : (
                <SceneComponent content={stripMedia(scene.content)} durationInFrames={scene.durationFrames} />
              );

              return (
                <React.Fragment key={i}>
                  <TransitionSeries.Sequence durationInFrames={scene.durationFrames}>
                    <SceneBoundary label={scene.type}>
                      <AbsoluteFill style={{ filter: sceneGrade || undefined }}>
                        {body}
                        {fx && <EffectsLayer effects={{ intensity: baseIntensity, ...fx }} />}
                      </AbsoluteFill>
                    </SceneBoundary>
                  </TransitionSeries.Sequence>
                  {i < scenes.length - 1 && txn && txn.type !== 'none' && (
                    <TransitionSeries.Transition
                      presentation={resolveTransition(txn.type)}
                      timing={linearTiming({ durationInFrames: txn.durationFrames || 15 })}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </TransitionSeries>

          {overlays.filmGrain && overlays.filmGrain.enabled && <FilmGrain opacity={overlays.filmGrain.opacity} />}
          {overlays.effects && <EffectsLayer effects={overlays.effects} />}
          {captionsOn && <CaptionTrack scenes={scenes} style={capStyle} />}
        </AbsoluteFill>
      </ThemeProvider>
    );
  } catch (e: any) {
    console.error('[preview] ConfigVideo render failed:', e);
    return <ErrorFill msg={(e && (e.stack || e.message)) || String(e)} />;
  }
};
