import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { useTheme } from '../../theme';
import type { SceneProps } from './types';

/**
 * MotionScene — prompt-driven kinetic-typography / motion-graphics scene.
 *
 * Shared by the live preview (ConfigVideo) and the final render (SCENE_REGISTRY),
 * so the in-app Motion tab and the rendered MP4 look identical.
 *
 * content: {
 *   text: string;        // the prompt text (newlines = separate lines)
 *   motion: string;      // motion preset key (see switch below)
 *   accent?: string;     // accent color
 *   fontSize?: number;
 * }
 */

const LETTER_MOTIONS = new Set(['kinetic', 'wave', 'typewriter', 'shimmer']);

function tokenStyle(
  motion: string,
  frame: number,
  delay: number,
  fps: number,
  accent: string,
): React.CSSProperties {
  const lf = Math.max(0, frame - delay);
  const started = frame >= delay;
  const ease = (a: number, b: number, from: number, to: number) =>
    interpolate(lf, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const base: React.CSSProperties = { display: 'inline-block', whiteSpace: 'pre' };
  const appear = started ? ease(0, 12, 0, 1) : 0;

  switch (motion) {
    case 'pop': {
      const s = started ? spring({ frame: lf, fps, config: { damping: 9, stiffness: 130, mass: 0.6 } }) : 0;
      return { ...base, opacity: ease(0, 5, 0, 1), transform: `scale(${s})` };
    }
    case 'slide-left':
      return { ...base, opacity: appear, transform: `translateX(${ease(0, 16, 120, 0)}px)` };
    case 'slide-right':
      return { ...base, opacity: appear, transform: `translateX(${ease(0, 16, -120, 0)}px)` };
    case 'drop-in': {
      const s = started ? spring({ frame: lf, fps, config: { damping: 11, stiffness: 90 } }) : 0;
      return { ...base, opacity: ease(0, 6, 0, 1), transform: `translateY(${interpolate(s, [0, 1], [-160, 0])}px)` };
    }
    case 'bounce': {
      const s = started ? spring({ frame: lf, fps, config: { damping: 6, stiffness: 120, mass: 0.7 } }) : 0;
      return { ...base, opacity: ease(0, 6, 0, 1), transform: `translateY(${interpolate(s, [0, 1], [80, 0])}px) scale(${interpolate(s, [0, 1], [0.6, 1])})` };
    }
    case 'blur-in':
      return { ...base, opacity: appear, filter: `blur(${ease(0, 18, 18, 0)}px)`, transform: `scale(${ease(0, 18, 1.15, 1)})` };
    case 'zoom-out':
      return { ...base, opacity: appear, transform: `scale(${ease(0, 16, 2.2, 1)})` };
    case 'rotate-3d':
      return { ...base, opacity: appear, transform: `perspective(800px) rotateX(${ease(0, 18, 90, 0)}deg)`, transformOrigin: 'center bottom' };
    case 'flip-in':
      return { ...base, opacity: appear, transform: `perspective(800px) rotateY(${ease(0, 18, 100, 0)}deg)` };
    case 'wave': {
      const yo = Math.sin((frame - delay) / 6) * (started ? 14 : 0);
      return { ...base, opacity: appear, transform: `translateY(${ease(0, 10, 26, 0) + yo}px)` };
    }
    case 'kinetic': {
      const s = started ? spring({ frame: lf, fps, config: { damping: 12, stiffness: 200, mass: 0.5 } }) : 0;
      return { ...base, opacity: ease(0, 4, 0, 1), transform: `translateY(${interpolate(s, [0, 1], [44, 0])}px) scale(${interpolate(s, [0, 1], [0.4, 1])})` };
    }
    case 'typewriter':
      // handled by visibility — each letter snaps in
      return { ...base, opacity: started ? 1 : 0 };
    case 'glitch': {
      const j = started ? (Math.sin((frame - delay) * 1.7) * 3 + Math.cos((frame - delay) * 0.9) * 2) : 0;
      const active = started && lf < 12;
      return {
        ...base,
        opacity: appear,
        transform: `translateX(${active ? j : 0}px)`,
        textShadow: active ? `${j}px 0 rgba(255,0,90,0.8), ${-j}px 0 rgba(0,200,255,0.8)` : 'none',
      };
    }
    case 'shimmer':
    case 'gradient': {
      const pos = interpolate((frame - delay) % 90, [0, 90], [0, 200]);
      return {
        ...base,
        opacity: appear,
        backgroundImage: `linear-gradient(100deg, ${accent} 0%, #ffffff 50%, ${accent} 100%)`,
        backgroundSize: '220% 100%',
        backgroundPositionX: `${pos}%`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      };
    }
    case 'neon': {
      const pulse = 0.6 + Math.sin(frame / 7) * 0.4;
      return {
        ...base,
        opacity: appear,
        color: '#fff',
        transform: `translateY(${ease(0, 14, 30, 0)}px)`,
        textShadow: `0 0 ${10 * pulse}px ${accent}, 0 0 ${26 * pulse}px ${accent}, 0 0 ${48 * pulse}px ${accent}`,
      };
    }
    case 'fade-up':
    default:
      return { ...base, opacity: appear, transform: `translateY(${ease(0, 14, 44, 0)}px)` };
  }
}

export const MotionScene: React.FC<SceneProps> = ({ content }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();

  const motion = content.motion || 'fade-up';
  const accent = content.accent || theme.colors.primary;
  // Explicit, background-aware text color (brand textDark can be dark navy and
  // would vanish on a dark background), falling back to the theme.
  const textColor = content.textColor || theme.colors.textDark;
  const text = (content.text || '').toString();
  const lines = text.split('\n').map((l: string) => l).filter((l: string) => l.trim().length > 0);
  const fontSize = content.fontSize || 96;
  const isLetter = LETTER_MOTIONS.has(motion);
  const stagger = motion === 'typewriter' ? 1.6 : isLetter ? 1.4 : 4;

  if (!lines.length) {
    return (
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', color: theme.colors.textLight, fontFamily: theme.fonts.primary, fontSize: 36 }}>
        כתוב טקסט כדי ליצור מושן גרפיקס
      </AbsoluteFill>
    );
  }

  let globalIdx = 0;
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6% 8%',
        flexDirection: 'column',
        gap: fontSize * 0.18,
        direction: (theme as any).direction || 'ltr',
      }}
    >
      {lines.map((line: string, li: number) => {
        const tokens = isLetter ? Array.from(line) : line.split(/(\s+)/);
        return (
          <div
            key={li}
            style={{
              fontSize,
              fontWeight: 800,
              lineHeight: 1.1,
              textAlign: 'center',
              color: textColor,
              fontFamily: theme.fonts.primary,
              letterSpacing: isLetter ? '0.01em' : undefined,
              maxWidth: '100%',
            }}
          >
            {tokens.map((tok: string, ti: number) => {
              if (/^\s+$/.test(tok)) return <span key={ti}>{tok}</span>;
              const delay = globalIdx * stagger;
              globalIdx += 1;
              return (
                <span key={ti} style={tokenStyle(motion, frame, delay, fps, accent)}>
                  {tok}
                </span>
              );
            })}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
