import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';
import { useTheme, useIsRTL } from '../../theme';
import type { SceneProps } from './types';

/**
 * SpotlightScene
 *
 * content: {
 *   icon: string;
 *   feature: string;
 *   tagline: string;
 *   bullets: string[];
 *   accentColor?: string;
 *   logoSrc?: string;
 * }
 */
export const SpotlightScene: React.FC<SceneProps> = ({ content, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const isRTL = useIsRTL();
  const dir = isRTL ? -1 : 1;

  const bullets = (content.bullets || []) as string[];
  const accent = content.accentColor || theme.colors.primary;

  // Icon entrance
  const iconScale = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const iconOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  // Feature name
  const titleOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });
  const titleX = interpolate(frame, [10, 25], [-40 * dir, 0], { extrapolateRight: 'clamp' });

  // Tagline
  const tagOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

  // Bullets stagger
  const bulletAnims = bullets.map((_, i) => ({
    opacity: interpolate(frame, [30 + i * 15, 45 + i * 15], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    x: interpolate(frame, [30 + i * 15, 45 + i * 15], [30 * dir, 0], {
      extrapolateRight: 'clamp',
    }),
  }));

  // Accent bar animation
  const barWidth = interpolate(frame, [5, 30], [0, 200], { extrapolateRight: 'clamp' });

  // Logo fade in at end
  const logoOpacity = interpolate(
    frame,
    [Math.max(0, durationInFrames - 60), Math.max(0, durationInFrames - 30)],
    [0, 0.6],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Background glow pulse
  const glowSize = 300 + Math.sin(frame * 0.04) * 50;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgDark,
        fontFamily: theme.fonts.primary,
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          ...(isRTL ? { right: '15%' } : { left: '15%' }),
          width: glowSize,
          height: glowSize,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 120px',
          height: '100%',
          gap: 24,
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: 80,
            opacity: iconOpacity,
            transform: `scale(${iconScale})`,
          }}
        >
          {content.icon}
        </div>

        {/* Accent bar */}
        <div
          style={{
            width: barWidth,
            height: 4,
            background: `linear-gradient(90deg, ${accent}, ${theme.colors.accent || theme.colors.primaryLight})`,
            borderRadius: 2,
          }}
        />

        {/* Feature name */}
        <h1
          style={{
            fontSize: theme.typography.h1.size,
            fontWeight: 700,
            color: theme.colors.textDark,
            margin: 0,
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
          }}
        >
          {content.feature}
        </h1>

        {/* Tagline */}
        {content.tagline && (
          <p
            style={{
              fontSize: theme.typography.h3.size,
              color: theme.colors.textMedium,
              margin: 0,
              opacity: tagOpacity,
            }}
          >
            {content.tagline}
          </p>
        )}

        {/* Bullets */}
        {bullets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {bullets.map((bullet, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  opacity: bulletAnims[i].opacity,
                  transform: `translateX(${bulletAnims[i].x}px)`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: accent,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: theme.typography.body.size,
                    color: theme.colors.textDark,
                  }}
                >
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom-right logo */}
      {content.logoSrc && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            ...(isRTL ? { left: 60 } : { right: 60 }),
            opacity: logoOpacity,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Img
            src={staticFile(content.logoSrc)}
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
