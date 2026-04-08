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
 * TestimonialScene
 *
 * content: {
 *   quote: string;
 *   author: string;
 *   role: string;
 *   company: string;
 *   rating?: number;  // 1-5 stars
 *   logoSrc?: string;
 * }
 */
export const TestimonialScene: React.FC<SceneProps> = ({ content }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const isRTL = useIsRTL();

  // Big quote mark
  const quoteMarkScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const quoteMarkOpacity = interpolate(frame, [0, 15], [0, 0.15], { extrapolateRight: 'clamp' });

  // Quote text - word by word reveal
  const words = (content.quote || '').split(' ');
  const wordAnims = words.map((_, i) => ({
    opacity: interpolate(frame, [15 + i * 3, 20 + i * 3], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  }));

  // Stars
  const starsStart = 15 + words.length * 3 + 10;
  const starsOpacity = interpolate(frame, [starsStart, starsStart + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Author info
  const authorOpacity = interpolate(frame, [starsStart + 15, starsStart + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const authorY = interpolate(frame, [starsStart + 15, starsStart + 30], [15, 0], {
    extrapolateRight: 'clamp',
  });

  // Logo
  const logoOpacity = interpolate(frame, [starsStart + 30, starsStart + 40], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Decorative accent line
  const lineWidth = interpolate(frame, [10, 40], [0, 120], { extrapolateRight: 'clamp' });

  const rating = content.rating as number | undefined;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgDark,
        fontFamily: theme.fonts.primary,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background accent glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          ...(isRTL ? { right: '20%' } : { left: '20%' }),
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.colors.primary}08 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* Big decorative quote mark */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          ...(isRTL ? { right: 120 } : { left: 120 }),
          fontSize: 300,
          color: theme.colors.primary,
          opacity: quoteMarkOpacity,
          transform: `scale(${quoteMarkScale})`,
          fontFamily: 'Georgia, serif',
          lineHeight: 1,
        }}
      >
        {'\u201C'}
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 1400,
          padding: '0 120px',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 4,
            backgroundColor: theme.colors.primary,
            borderRadius: 2,
          }}
        />

        {/* Quote */}
        <p
          style={{
            fontSize: 44,
            fontWeight: 500,
            color: theme.colors.textDark,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {words.map((word, i) => (
            <span key={i} style={{ opacity: wordAnims[i].opacity }}>
              {word}{' '}
            </span>
          ))}
        </p>

        {/* Stars */}
        {rating && rating > 0 && (
          <div style={{ opacity: starsOpacity, display: 'flex', gap: 8 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                style={{
                  fontSize: 32,
                  color: i < rating ? '#f59e0b' : theme.colors.divider,
                }}
              >
                {'\u2605'}
              </span>
            ))}
          </div>
        )}

        {/* Author */}
        <div
          style={{
            opacity: authorOpacity,
            transform: `translateY(${authorY}px)`,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textDark }}>
            {content.author}
          </span>
          <span style={{ fontSize: 22, color: theme.colors.textMedium }}>
            {content.role}{content.company ? ` \u00B7 ${content.company}` : ''}
          </span>
        </div>
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
            gap: 10,
          }}
        >
          <Img
            src={staticFile(content.logoSrc)}
            style={{ width: 32, height: 32, objectFit: 'contain' }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
