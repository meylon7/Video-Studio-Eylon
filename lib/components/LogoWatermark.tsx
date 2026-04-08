/**
 * LogoWatermark - Corner logo branding overlay
 *
 * Displays a small logo with optional label in the corner of the video.
 * Fades in after a specified frame for subtle branding.
 */

import { useCurrentFrame, interpolate, Img, staticFile } from 'remotion';
import { useTheme } from '../theme';

export interface LogoWatermarkProps {
  /** Path to logo file (relative to public/) */
  logoSrc: string;
  /** Optional text label next to logo */
  label?: string;
  /** Frame at which to start fading in. Default: 240 (8s at 30fps) */
  fadeInFrame?: number;
  /** Duration of fade in frames. Default: 30 */
  fadeInDuration?: number;
  /** Final opacity. Default: 0.6 */
  maxOpacity?: number;
  /** Position in frame. Default: top-left */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Logo size in pixels. Default: 32 */
  size?: number;
}

export const LogoWatermark: React.FC<LogoWatermarkProps> = ({
  logoSrc,
  label,
  fadeInFrame = 240,
  fadeInDuration = 30,
  maxOpacity = 0.6,
  position = 'top-left',
  size = 32,
}) => {
  const frame = useCurrentFrame();
  const theme = useTheme();

  const opacity = interpolate(
    frame,
    [fadeInFrame, fadeInFrame + fadeInDuration],
    [0, maxOpacity],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 32, left: 32 },
    'top-right': { top: 32, right: 32 },
    'bottom-left': { bottom: 32, left: 32 },
    'bottom-right': { bottom: 32, right: 32 },
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        opacity,
      }}
    >
      {logoSrc && (
        <Img
          src={staticFile(logoSrc)}
          style={{
            height: size,
            maxWidth: size * 4,
            objectFit: 'contain',
          }}
        />
      )}
      {label && (
        <span
          style={{
            fontSize: Math.max(18, Math.round(size * 0.35)),
            fontWeight: 700,
            color: theme.colors.textLight,
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
