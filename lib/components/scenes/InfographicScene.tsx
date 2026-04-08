import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  useVideoConfig,
} from 'remotion';
import { useTheme, useIsRTL } from '../../theme';
import type { SceneProps } from './types';

/**
 * AnimatedCounter - counts up from 0 to target value
 */
const AnimatedCounter: React.FC<{
  value: number;
  suffix?: string;
  prefix?: string;
  startFrame: number;
  duration?: number;
  color: string;
  size?: number;
  fontFamily: string;
}> = ({ value, suffix = '', prefix = '', startFrame, duration = 40, color, size = 80, fontFamily }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Ease out
  const eased = 1 - Math.pow(1 - progress, 3);
  const display = Math.round(value * eased);

  return (
    <span style={{ fontSize: size, fontWeight: 700, color, fontFamily }}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
};

/**
 * AnimatedBar - grows horizontally
 */
const AnimatedBar: React.FC<{
  percentage: number;
  color: string;
  startFrame: number;
  width: number;
  height?: number;
}> = ({ percentage, color, startFrame, width, height = 16 }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eased = 1 - Math.pow(1 - progress, 2);

  return (
    <div
      style={{
        width,
        height,
        borderRadius: height / 2,
        backgroundColor: `${color}20`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: width * (percentage / 100) * eased,
          height: '100%',
          borderRadius: height / 2,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        }}
      />
    </div>
  );
};

/**
 * CircularProgress - animated ring
 */
const CircularProgress: React.FC<{
  percentage: number;
  color: string;
  startFrame: number;
  size: number;
  label: string;
  fontFamily: string;
  textColor: string;
}> = ({ percentage, color, startFrame, size, label, fontFamily, textColor }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eased = 1 - Math.pow(1 - progress, 3);
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (percentage / 100) * eased);

  const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`${color}20`} strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', marginTop: size / 2 - 16 }}>
        <AnimatedCounter value={percentage} suffix="%" startFrame={startFrame} color={color} size={36} fontFamily={fontFamily} />
      </div>
      <span style={{ fontSize: 18, color: textColor, fontWeight: 500, marginTop: -8 }}>
        {label}
      </span>
    </div>
  );
};

/**
 * InfographicScene
 *
 * content: {
 *   headline?: string;
 *   counters?: Array<{
 *     label: string;
 *     value: number;
 *     suffix?: string;
 *     prefix?: string;
 *     description?: string;
 *     color?: string;
 *     startFrame?: number;
 *   }>;
 *   rings?: Array<{
 *     percentage: number;
 *     color?: string;
 *     label: string;
 *     startFrame?: number;
 *   }>;
 *   bars?: Array<{
 *     label: string;
 *     percentage: number;
 *     color?: string;
 *     startFrame?: number;
 *   }>;
 * }
 */
export const InfographicScene: React.FC<SceneProps> = ({ content }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const isRTL = useIsRTL();

  const counters = (content.counters || []) as Array<{
    label: string;
    value: number;
    suffix?: string;
    prefix?: string;
    description?: string;
    color?: string;
    startFrame?: number;
  }>;

  const rings = (content.rings || []) as Array<{
    percentage: number;
    color?: string;
    label: string;
    startFrame?: number;
  }>;

  const bars = (content.bars || []) as Array<{
    label: string;
    percentage: number;
    color?: string;
    startFrame?: number;
  }>;

  // Title
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: 'clamp' });

  // Section opacities
  const section1 = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });
  const section2 = interpolate(frame, [fps * 5, fps * 5 + 15], [0, 1], { extrapolateRight: 'clamp' });
  const section3 = interpolate(frame, [fps * 10, fps * 10 + 15], [0, 1], { extrapolateRight: 'clamp' });

  // Gradient line under title
  const gradientLineWidth = interpolate(frame, [10, 35], [0, 300], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgDark,
        fontFamily: theme.fonts.primary,
        padding: '60px 80px',
      }}
    >
      {/* Title */}
      {content.headline && (
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, marginBottom: 40 }}>
          <h1 style={{ fontSize: 56, fontWeight: 700, color: theme.colors.textDark, margin: 0 }}>
            {content.headline}
          </h1>
          <div
            style={{
              width: gradientLineWidth,
              height: 4,
              background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primaryLight})`,
              borderRadius: 2,
              marginTop: 16,
            }}
          />
        </div>
      )}

      {/* Grid layout */}
      <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', gap: 60, flex: 1 }}>
        {/* Left column - Big counters */}
        {counters.length > 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 40 }}>
            {counters.map((counter, i) => {
              const sectionOpacity = i < 2 ? section1 : section2;
              const counterStartFrame = counter.startFrame ?? (30 + i * 20);
              const counterColor = counter.color || theme.colors.primary;

              return (
                <div key={i} style={{ opacity: sectionOpacity }}>
                  <div style={{ fontSize: 16, color: theme.colors.textLight, textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 8 }}>
                    {counter.label}
                  </div>
                  <AnimatedCounter
                    value={counter.value}
                    suffix={counter.suffix}
                    prefix={counter.prefix}
                    startFrame={counterStartFrame}
                    color={counterColor}
                    size={72}
                    fontFamily={theme.fonts.mono}
                  />
                  {counter.description && (
                    <div style={{ fontSize: 22, color: theme.colors.textMedium, marginTop: 4 }}>
                      {counter.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Right column - Progress rings + bars */}
        {(rings.length > 0 || bars.length > 0) && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Circular progress rings */}
            {rings.length > 0 && (
              <div style={{ display: 'flex', gap: 40, justifyContent: 'center', opacity: section2 }}>
                {rings.map((ring, i) => {
                  const ringColor = ring.color || theme.colors.primary;
                  const ringStartFrame = ring.startFrame ?? (fps * 6 + i * fps);

                  return (
                    <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <CircularProgress
                        percentage={ring.percentage}
                        color={ringColor}
                        startFrame={ringStartFrame}
                        size={130}
                        label={ring.label}
                        fontFamily={theme.fonts.mono}
                        textColor={theme.colors.textMedium}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bar charts */}
            {bars.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, opacity: section3 }}>
                <div style={{ fontSize: 16, color: theme.colors.textLight, textTransform: 'uppercase' as const, letterSpacing: 2 }}>
                  {content.barsLabel || 'Metrics'}
                </div>
                {bars.map((bar, i) => {
                  const barColor = bar.color || theme.colors.primary;
                  const barStartFrame = bar.startFrame ?? (fps * 10 + i * 12);

                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: 18, color: theme.colors.textMedium, width: 140 }}>{bar.label}</span>
                      <AnimatedBar percentage={bar.percentage} color={barColor} startFrame={barStartFrame} width={400} />
                      <span style={{ fontSize: 16, color: theme.colors.textLight, width: 50 }}>
                        {bar.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
