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
import { useTheme } from '../../theme';
import type { SceneProps } from './types';

/**
 * WebinarIntroScene
 *
 * content: {
 *   brandName?: string;
 *   tagline?: string;
 *   logoSrc?: string;
 * }
 */
export const WebinarIntroScene: React.FC<SceneProps> = ({ content }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();

  // Logo entrance - dramatic spring
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 80 },
  });
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  // Brand name
  const nameOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' });
  const nameY = interpolate(frame, [15, 30], [15, 0], { extrapolateRight: 'clamp' });

  // Tagline
  const tagOpacity = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: 'clamp' });

  // "Starting soon" text
  const soonOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: 'clamp' });

  // Animated ring
  const ringRotation = frame * 0.8;
  const ringOpacity = interpolate(frame, [5, 20], [0, 0.3], { extrapolateRight: 'clamp' });

  // Particle dots
  const dots = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + frame * 0.02;
    const radius = 200 + Math.sin(frame * 0.03 + i) * 20;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: interpolate(frame, [10 + i * 5, 25 + i * 5], [0, 0.4], {
        extrapolateRight: 'clamp',
      }),
    };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgDark,
        fontFamily: theme.fonts.primary,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at 50% 50%, ${theme.colors.primary}12 0%, transparent 60%)`,
        }}
      />

      {/* Animated ring */}
      <div
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          border: `2px solid ${theme.colors.primary}`,
          borderRadius: '50%',
          opacity: ringOpacity,
          transform: `rotate(${ringRotation}deg)`,
          borderStyle: 'dashed',
        }}
      />

      {/* Particle dots */}
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(50% + ${dot.x}px)`,
            top: `calc(50% + ${dot.y}px)`,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.colors.primary,
            opacity: dot.opacity,
          }}
        />
      ))}

      {/* Content stack */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          zIndex: 1,
        }}
      >
        {/* Logo */}
        {content.logoSrc && (
          <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})` }}>
            <Img
              src={staticFile(content.logoSrc)}
              style={{ width: 120, height: 120, objectFit: 'contain' }}
            />
          </div>
        )}

        {/* Brand name */}
        {content.brandName && (
          <h1
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: theme.colors.textDark,
              margin: 0,
              opacity: nameOpacity,
              transform: `translateY(${nameY}px)`,
            }}
          >
            {content.brandName}
          </h1>
        )}

        {/* Tagline */}
        {content.tagline && (
          <p
            style={{
              fontSize: 28,
              color: theme.colors.textMedium,
              margin: 0,
              opacity: tagOpacity,
            }}
          >
            {content.tagline}
          </p>
        )}

        {/* Starting soon */}
        <div
          style={{
            marginTop: 30,
            opacity: soonOpacity,
            padding: '12px 32px',
            border: `1px solid ${theme.colors.primary}40`,
            borderRadius: 8,
            background: `${theme.colors.primary}10`,
          }}
        >
          <span style={{ fontSize: 22, color: theme.colors.primary, fontWeight: 600 }}>
            Starting Soon
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
