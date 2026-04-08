import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Img,
  staticFile,
} from 'remotion';
import { useTheme } from '../../theme';
import type { SceneProps } from './types';

/**
 * ImageScene
 *
 * content: {
 *   imageSrc?: string;        // Path to image (relative to public/)
 *   headline?: string;
 *   caption?: string;
 *   layout?: 'fullscreen' | 'contain' | 'split';  // default: contain
 * }
 */
export const ImageScene: React.FC<SceneProps> = ({ content }) => {
  const frame = useCurrentFrame();
  const theme = useTheme();

  const layout = content.layout || 'contain';

  // Ken Burns effect (slow zoom + pan)
  const kenBurnsScale = interpolate(frame, [0, 300], [1, 1.08], {
    extrapolateRight: 'clamp',
  });
  const kenBurnsX = interpolate(frame, [0, 300], [0, -15], {
    extrapolateRight: 'clamp',
  });

  // Fade in
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Text overlay animations
  const textOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const textY = interpolate(frame, [20, 45], [20, 0], {
    extrapolateRight: 'clamp',
  });

  if (layout === 'fullscreen') {
    return (
      <AbsoluteFill style={{ opacity }}>
        {/* Fullscreen image with Ken Burns */}
        {content.imageSrc && (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Img
              src={staticFile(content.imageSrc)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${kenBurnsScale}) translateX(${kenBurnsX}px)`,
              }}
            />
          </div>
        )}
        {/* Dark overlay for text readability */}
        {(content.headline || content.caption) && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              padding: '80px 80px 60px',
              opacity: textOpacity,
              transform: `translateY(${textY}px)`,
            }}
          >
            {content.headline && (
              <h2
                style={{
                  fontSize: theme.typography.h2.size,
                  fontWeight: theme.typography.h2.weight,
                  fontFamily: theme.fonts.primary,
                  color: '#fff',
                  margin: 0,
                  marginBottom: content.caption ? 16 : 0,
                }}
              >
                {content.headline}
              </h2>
            )}
            {content.caption && (
              <p
                style={{
                  fontSize: theme.typography.body.size,
                  fontFamily: theme.fonts.primary,
                  color: 'rgba(255,255,255,0.8)',
                  margin: 0,
                }}
              >
                {content.caption}
              </p>
            )}
          </div>
        )}
      </AbsoluteFill>
    );
  }

  if (layout === 'split') {
    return (
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          opacity,
        }}
      >
        {/* Image side */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {content.imageSrc && (
            <Img
              src={staticFile(content.imageSrc)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${kenBurnsScale})`,
              }}
            />
          )}
        </div>
        {/* Text side */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 80px',
            gap: 24,
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
          }}
        >
          {content.headline && (
            <h2
              style={{
                fontSize: theme.typography.h2.size,
                fontWeight: theme.typography.h2.weight,
                fontFamily: theme.fonts.primary,
                color: theme.colors.textDark,
                margin: 0,
              }}
            >
              {content.headline}
            </h2>
          )}
          {content.caption && (
            <p
              style={{
                fontSize: theme.typography.body.size + 2,
                fontFamily: theme.fonts.primary,
                color: theme.colors.textMedium,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {content.caption}
            </p>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // Default: 'contain' — centered image with optional text
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        opacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          width: '100%',
        }}
      >
        {content.headline && (
          <h2
            style={{
              fontSize: theme.typography.h2.size,
              fontWeight: theme.typography.h2.weight,
              fontFamily: theme.fonts.primary,
              color: theme.colors.textDark,
              margin: 0,
              opacity: textOpacity,
              transform: `translateY(${textY}px)`,
              textAlign: 'center',
            }}
          >
            {content.headline}
          </h2>
        )}

        {content.imageSrc && (
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              maxWidth: 1400,
              maxHeight: 700,
              width: '100%',
            }}
          >
            <Img
              src={staticFile(content.imageSrc)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${kenBurnsScale})`,
              }}
            />
          </div>
        )}

        {content.caption && (
          <p
            style={{
              fontSize: theme.typography.body.size,
              fontFamily: theme.fonts.primary,
              color: theme.colors.textMedium,
              margin: 0,
              opacity: textOpacity,
            }}
          >
            {content.caption}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
