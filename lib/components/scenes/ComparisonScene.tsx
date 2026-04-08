import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';
import { useTheme, useIsRTL } from '../../theme';
import type { SceneProps } from './types';

// Check icon SVG
const CheckIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill={`${color}20`} />
    <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Cross icon SVG
const CrossIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="rgba(239,68,68,0.15)" />
    <path d="M9 9l6 6M15 9l-6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Cell content renderer
const CellContent: React.FC<{ value: string | boolean; isOurs?: boolean; primaryColor: string }> = ({
  value,
  isOurs,
  primaryColor,
}) => {
  if (typeof value === 'boolean') {
    return value ? <CheckIcon color={isOurs ? '#10b981' : '#10b981'} /> : <CrossIcon />;
  }
  return (
    <span style={{ fontSize: 22, color: isOurs ? primaryColor : '#94a3b8' }}>
      {value}
    </span>
  );
};

/**
 * ComparisonScene
 *
 * content: {
 *   headline?: string;
 *   rows: Array<{ feature: string; ours: string | boolean; others: string | boolean }>;
 *   ourLabel?: string;
 *   theirLabel?: string;
 *   logoSrc?: string;
 * }
 */
export const ComparisonScene: React.FC<SceneProps> = ({ content, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const isRTL = useIsRTL();
  const dir = isRTL ? -1 : 1;

  const rows = (content.rows || []) as Array<{
    feature: string;
    ours: string | boolean;
    others: string | boolean;
  }>;
  const ourLabel = content.ourLabel || 'Ours';
  const theirLabel = content.theirLabel || 'Others';

  // Title
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: 'clamp' });

  // Table header
  const headerOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

  // Row animations (staggered)
  const rowAnims = rows.map((_, i) => ({
    opacity: interpolate(frame, [40 + i * 12, 55 + i * 12], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    x: interpolate(frame, [40 + i * 12, 55 + i * 12], [30 * dir, 0], {
      extrapolateRight: 'clamp',
    }),
  }));

  // Bottom CTA
  const ctaOpacity = interpolate(
    frame,
    [Math.max(0, durationInFrames - 60), Math.max(0, durationInFrames - 30)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Accent line
  const lineWidth = interpolate(frame, [10, 30], [0, 250], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgDark,
        fontFamily: theme.fonts.primary,
        padding: '50px 80px',
      }}
    >
      {/* Title */}
      {content.headline && (
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, marginBottom: 30 }}>
          <h1 style={{ fontSize: 52, fontWeight: 700, color: theme.colors.textDark, margin: 0 }}>
            {content.headline}
          </h1>
          <div
            style={{
              width: lineWidth,
              height: 4,
              background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primaryLight})`,
              borderRadius: 2,
              marginTop: 12,
            }}
          />
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            opacity: headerOpacity,
            padding: '16px 0',
            borderBottom: `2px solid ${theme.colors.divider}`,
            marginBottom: 8,
          }}
        >
          <div style={{ flex: 2, fontSize: 18, color: theme.colors.textLight, textTransform: 'uppercase' as const, letterSpacing: 2 }}>
            Feature
          </div>
          <div style={{ flex: 1, textAlign: 'center' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {content.logoSrc && (
              <Img src={staticFile(content.logoSrc)} style={{ width: 28, height: 28, objectFit: 'contain' as const }} />
            )}
            <span style={{ fontSize: 20, color: theme.colors.primary, fontWeight: 600 }}>{ourLabel}</span>
          </div>
          <div style={{ flex: 1, textAlign: 'center' as const, fontSize: 20, color: theme.colors.textMedium }}>
            {theirLabel}
          </div>
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 0',
              borderBottom: `1px solid ${theme.colors.divider}40`,
              opacity: rowAnims[i].opacity,
              transform: `translateX(${rowAnims[i].x}px)`,
              backgroundColor: i % 2 === 0 ? 'transparent' : theme.colors.bgOverlay,
            }}
          >
            <div style={{ flex: 2, fontSize: 24, color: theme.colors.textDark }}>
              {row.feature}
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <CellContent value={row.ours} isOurs primaryColor={theme.colors.primary} />
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <CellContent value={row.others} primaryColor={theme.colors.primary} />
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ opacity: ctaOpacity, textAlign: 'center' as const, paddingTop: 20 }}>
        <span style={{ fontSize: 28, color: theme.colors.primary, fontWeight: 600 }}>
          {content.ctaText || (isRTL ? '\u2190 למידע נוסף' : 'Learn More \u2192')}
        </span>
        {content.ctaUrl && (
          <span style={{ fontSize: 22, color: theme.colors.textMedium, ...(isRTL ? { marginRight: 20 } : { marginLeft: 20 }) }}>
            {content.ctaUrl}
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};
