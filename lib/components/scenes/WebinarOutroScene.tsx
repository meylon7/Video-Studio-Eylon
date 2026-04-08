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
 * WebinarOutroScene
 *
 * content: {
 *   headline?: string;
 *   url?: string;
 *   contacts?: Array<string>;
 *   logoSrc?: string;
 * }
 */
export const WebinarOutroScene: React.FC<SceneProps> = ({ content, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();

  const contacts = (content.contacts || []) as string[];

  // Logo
  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Headline (default: "Thank You!")
  const thankOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' });
  const thankY = interpolate(frame, [15, 30], [20, 0], { extrapolateRight: 'clamp' });

  // Gradient divider
  const dividerWidth = interpolate(frame, [30, 50], [0, 200], { extrapolateRight: 'clamp' });

  // URL
  const urlOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });

  // Contact info
  const socialOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [Math.max(0, durationInFrames - 30), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgDark,
        fontFamily: theme.fonts.primary,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at 50% 40%, ${theme.colors.accent || theme.colors.primaryLight}10 0%, transparent 50%)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          zIndex: 1,
        }}
      >
        {/* Logo */}
        {content.logoSrc && (
          <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})` }}>
            <Img
              src={staticFile(content.logoSrc)}
              style={{ width: 100, height: 100, objectFit: 'contain' }}
            />
          </div>
        )}

        {/* Headline */}
        <h1
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: theme.colors.textDark,
            margin: 0,
            opacity: thankOpacity,
            transform: `translateY(${thankY}px)`,
          }}
        >
          {content.headline || 'Thank You!'}
        </h1>

        {/* Gradient divider */}
        <div
          style={{
            width: dividerWidth,
            height: 3,
            background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primaryLight})`,
            borderRadius: 2,
          }}
        />

        {/* URL */}
        {content.url && (
          <div style={{ opacity: urlOpacity }}>
            <span
              style={{
                fontSize: 32,
                fontFamily: theme.fonts.mono,
                color: theme.colors.primary,
                fontWeight: 600,
              }}
            >
              {content.url}
            </span>
          </div>
        )}

        {/* Contact info */}
        {contacts.length > 0 && (
          <div
            style={{
              opacity: socialOpacity,
              display: 'flex',
              gap: 40,
              marginTop: 10,
            }}
          >
            {contacts.map((text, i) => (
              <span
                key={i}
                style={{
                  fontSize: 20,
                  color: theme.colors.textLight,
                }}
              >
                {text}
              </span>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
