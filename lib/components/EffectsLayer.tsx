/**
 * EffectsLayer - Stack of full-frame cinematic effects
 *
 * Config-driven overlay effects rendered on top of the scenes. Every effect is
 * pure CSS/SVG (no extra dependencies) and fully deterministic per-frame, so it
 * renders identically in the Studio preview and the final MP4.
 *
 * Effects:
 *  - glow        soft bloom highlight (screen blend)
 *  - bloom       stronger multi-layer bloom
 *  - scanlines   CRT / retro horizontal lines
 *  - lightLeaks  animated warm light sweep (screen blend)
 *  - lightRays   diagonal god-rays drifting slowly
 *  - bokeh       floating blurred light particles
 *  - vhs         retro tracking bands + jitter
 *  - dust        film dust specks + scratches
 *  - colorWash   tinted color overlay with a chosen blend mode
 *  - letterbox   cinematic black bars (2.39 / 2.0 / 1.85)
 *
 * A master `intensity` (0-1.5) scales every effect's opacity at once.
 * Color grading (a CSS filter on the whole frame) is applied separately by the
 * generated video via `colorGradeFilter()`.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export interface ColorWashConfig {
  enabled?: boolean;
  color?: string;
  opacity?: number;
  blend?: string;
}

export interface LetterboxConfig {
  enabled?: boolean;
  ratio?: '2.39' | '2.0' | '1.85';
}

export interface EffectsConfig {
  /** Master multiplier for all effect opacities (0-1.5). Default 1 */
  intensity?: number;
  glow?: boolean;
  bloom?: boolean;
  scanlines?: boolean;
  lightLeaks?: boolean;
  lightRays?: boolean;
  bokeh?: boolean;
  vhs?: boolean;
  dust?: boolean;
  colorWash?: ColorWashConfig;
  letterbox?: LetterboxConfig;
}

const noPointer: React.CSSProperties = { pointerEvents: 'none' };

/** Deterministic pseudo-random in [0,1) from an integer seed. */
function rand(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Map a color-grade preset name to a CSS `filter` string. */
export function colorGradeFilter(preset?: string): string {
  switch (preset) {
    case 'cinematic':     return 'contrast(1.1) saturate(1.15) brightness(0.98)';
    case 'vibrant':       return 'saturate(1.45) contrast(1.06)';
    case 'teal-orange':   return 'contrast(1.12) saturate(1.3) sepia(0.1) hue-rotate(-8deg)';
    case 'bleach-bypass': return 'contrast(1.4) saturate(0.6) brightness(1.05)';
    case 'technicolor':   return 'saturate(1.8) contrast(1.15)';
    case 'infrared':      return 'hue-rotate(150deg) saturate(1.4) contrast(1.1)';
    case 'matrix':        return 'sepia(1) hue-rotate(60deg) saturate(2) contrast(1.1) brightness(0.9)';
    case 'noir':          return 'grayscale(1) contrast(1.2)';
    case 'warm':          return 'sepia(0.25) saturate(1.25) hue-rotate(-10deg)';
    case 'cold':          return 'saturate(1.1) hue-rotate(15deg) brightness(1.02)';
    case 'dreamy':        return 'contrast(0.95) saturate(1.2) brightness(1.05)';
    case 'vintage':       return 'sepia(0.4) contrast(1.1) saturate(0.9)';
    case 'sepia':         return 'sepia(0.7) contrast(1.05) saturate(1.1)';
    case 'polaroid':      return 'sepia(0.3) saturate(0.85) contrast(0.95) brightness(1.08)';
    case 'none':
    default:              return '';
  }
}

const LETTERBOX_PCT: Record<string, number> = { '2.39': 12, '2.0': 8, '1.85': 5 };

export const EffectsLayer: React.FC<{ effects?: EffectsConfig }> = ({ effects = {} }) => {
  const frame = useCurrentFrame();
  const k = effects.intensity ?? 1; // master intensity multiplier

  // Animated light leak — warm radial sweep drifting across the frame
  const leakX = interpolate(frame % 240, [0, 240], [-15, 115]);
  const leakO = (0.12 + 0.07 * Math.sin(frame / 22)) * k;

  // God-rays drift
  const rayShift = interpolate(frame % 300, [0, 300], [0, 100]);

  // VHS tracking band position
  const bandY = (frame * 2.5) % 108 - 4;

  return (
    <>
      {effects.glow && (
        <AbsoluteFill
          style={{
            ...noPointer,
            mixBlendMode: 'screen',
            opacity: k,
            background:
              'radial-gradient(60% 60% at 50% 38%, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)',
          }}
        />
      )}

      {effects.bloom && (
        <AbsoluteFill
          style={{
            ...noPointer,
            mixBlendMode: 'screen',
            opacity: 0.9 * k,
            background:
              'radial-gradient(40% 40% at 50% 45%, rgba(255,250,235,0.22), rgba(255,250,235,0) 70%),' +
              'radial-gradient(80% 80% at 50% 50%, rgba(255,255,255,0.10), rgba(255,255,255,0) 75%)',
            filter: 'blur(2px)',
          }}
        />
      )}

      {effects.lightRays && (
        <AbsoluteFill
          style={{
            ...noPointer,
            mixBlendMode: 'screen',
            opacity: 0.5 * k,
            background:
              `repeating-linear-gradient(115deg, rgba(255,240,200,0) ${rayShift}px, rgba(255,240,200,0.10) ${rayShift + 30}px, rgba(255,240,200,0) ${rayShift + 70}px)`,
          }}
        />
      )}

      {effects.colorWash?.enabled && (
        <AbsoluteFill
          style={{
            ...noPointer,
            mixBlendMode: (effects.colorWash.blend as any) || 'soft-light',
            background: effects.colorWash.color || '#ff7a18',
            opacity: (effects.colorWash.opacity ?? 0.25) * k,
          }}
        />
      )}

      {effects.lightLeaks && (
        <AbsoluteFill
          style={{
            ...noPointer,
            mixBlendMode: 'screen',
            background: `radial-gradient(45% 90% at ${leakX}% 28%, rgba(255,120,40,${leakO}), rgba(255,0,90,0) 60%)`,
          }}
        />
      )}

      {effects.bokeh && (
        <AbsoluteFill style={{ ...noPointer, mixBlendMode: 'screen' }}>
          {Array.from({ length: 16 }, (_, i) => {
            const x = rand(i) * 100;
            const size = 18 + rand(i + 10) * 90;
            const speed = 5 + rand(i + 20) * 12;
            const y = ((rand(i + 5) * 130 - frame * (speed / 60)) % 130 + 130) % 130 - 15;
            const o = (0.06 + rand(i + 30) * 0.14) * k;
            const hue = Math.floor(rand(i + 40) * 60) + 20; // warm-ish
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, hsla(${hue},90%,75%,${o}), hsla(${hue},90%,75%,0) 70%)`,
                  filter: 'blur(2px)',
                }}
              />
            );
          })}
        </AbsoluteFill>
      )}

      {effects.vhs && (
        <>
          <AbsoluteFill
            style={{
              ...noPointer,
              opacity: 0.5 * k,
              mixBlendMode: 'screen',
              background:
                'linear-gradient(90deg, rgba(255,0,80,0.05), rgba(0,255,180,0) 4%),' +
                'linear-gradient(270deg, rgba(0,180,255,0.05), rgba(0,255,180,0) 4%)',
            }}
          />
          <div
            style={{
              ...noPointer,
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${bandY}%`,
              height: '4%',
              background: 'rgba(255,255,255,0.10)',
              mixBlendMode: 'overlay',
              filter: 'blur(1px)',
              opacity: k,
            }}
          />
        </>
      )}

      {effects.dust && (
        <AbsoluteFill style={{ ...noPointer, mixBlendMode: 'screen' }}>
          {Array.from({ length: 10 }, (_, i) => {
            const tick = Math.floor(frame / 4);
            const seed = i + tick * 13;
            const visible = rand(seed) > 0.45;
            if (!visible) return null;
            const x = rand(seed + 1) * 100;
            const y = rand(seed + 2) * 100;
            const s = 1 + rand(seed + 3) * 3;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: s,
                  height: s,
                  borderRadius: '50%',
                  background: `rgba(255,255,255,${0.5 * k})`,
                }}
              />
            );
          })}
          {/* occasional vertical scratch */}
          {rand(Math.floor(frame / 18)) > 0.6 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${rand(Math.floor(frame / 18) + 7) * 100}%`,
                width: 1.5,
                background: `rgba(255,255,255,${0.25 * k})`,
              }}
            />
          )}
        </AbsoluteFill>
      )}

      {effects.scanlines && (
        <AbsoluteFill
          style={{
            ...noPointer,
            opacity: 0.18 * k,
            mixBlendMode: 'multiply',
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(0,0,0,0.65) 0px, rgba(0,0,0,0.65) 1px, transparent 1px, transparent 3px)',
          }}
        />
      )}

      {effects.letterbox?.enabled && (() => {
        const pct = LETTERBOX_PCT[effects.letterbox.ratio || '2.39'] || 12;
        return (
          <>
            <div style={{ ...noPointer, position: 'absolute', top: 0, left: 0, right: 0, height: `${pct}%`, background: '#000' }} />
            <div style={{ ...noPointer, position: 'absolute', bottom: 0, left: 0, right: 0, height: `${pct}%`, background: '#000' }} />
          </>
        );
      })()}
    </>
  );
};
