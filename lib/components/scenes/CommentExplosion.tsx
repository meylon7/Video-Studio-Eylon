import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  random,
} from 'remotion';
import { useTheme } from '../../theme';
import type { SceneProps } from './types';

/**
 * CommentExplosion — genuine-looking comment "screenshot" cards popping onto the
 * canvas, slow at first then accelerating, until they fill the frame. Each card
 * is a white rounded comment with avatar, name, text and like/dislike/reply
 * buttons. Shared by the live preview and the final render.
 *
 * content: {
 *   comments?: string[];   // comment texts (defaults to a positive set)
 *   accent?: string;
 *   count?: number;
 * }
 */

const DEFAULT_COMMENTS = [
  'I love this video! 😍',
  'This is a great video.',
  'Please post more videos like this 🙏',
  "You're the best tutor ever!",
  'So clear and helpful, thank you!',
  'This just made my day 🔥',
  'Finally understood it — thank you!',
  'Underrated channel, subscribed!',
  'Best explanation on the internet',
  '10/10 would watch again',
  'You explain better than my professor',
  'This deserves way more views',
  'Saved me hours, legend 🙌',
  'Crystal clear, keep it up!',
  'Instant subscribe 👏',
  'Pure gold, thank you!',
  'Wow, this is amazing work',
  'More content like this please!',
];

const NAMES = ['Maya R.', 'Jordan', 'Alex P.', 'Sam', 'Noa', 'Chris', 'Dana', 'Leo', 'Priya', 'Tom', 'Ava', 'Eli', 'Mia', 'Omar', 'Zoe', 'Ben', 'Lily', 'Max'];
const TIMES = ['just now', '2m', '5m', '12m', '34m', '1h', '2h', '5h', '1d'];
const AVATAR_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];

export const CommentExplosion: React.FC<SceneProps> = ({ content, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const theme = useTheme();
  const accent = content.accent || '#6366F1';

  const comments: string[] = (content.comments && content.comments.length)
    ? content.comments
    : DEFAULT_COMMENTS;

  const aspect = width / height;
  const cols = aspect > 1.4 ? 6 : aspect < 0.85 ? 3 : 4;
  const rows = aspect > 1.4 ? 4 : aspect < 0.85 ? 7 : 5;
  const N = Math.min(content.count || cols * rows, cols * rows);
  const total = durationInFrames || 240;
  const scaleUnit = width / 1920;

  // Deterministic appearance order (so it isn't a boring row-by-row fill)
  const order = Array.from({ length: N }, (_, i) => i)
    .sort((a, b) => random(`order-${a}`) - random(`order-${b}`));
  const rank: number[] = [];
  order.forEach((cellIdx, r) => { rank[cellIdx] = r; });

  const cards = Array.from({ length: N }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = 100 / cols;
    const cellH = 100 / rows;
    const jx = (random(`jx-${i}`) - 0.5) * cellW * 0.5;
    const jy = (random(`jy-${i}`) - 0.5) * cellH * 0.5;
    const x = (col + 0.5) * cellW + jx;
    const y = (row + 0.5) * cellH + jy;
    const rot = (random(`rot-${i}`) - 0.5) * 9;
    const cardW = Math.max(230, Math.min(440, (width * cellW / 100) * 1.35)) * 1;
    // Slow -> fast cadence: appear times bunch toward the end
    const p = rank[i] / Math.max(1, N - 1);
    const appear = Math.round(total * 0.9 * Math.pow(p, 1.8));
    const txt = comments[i % comments.length];
    const name = NAMES[i % NAMES.length];
    const time = TIMES[Math.floor(random(`t-${i}`) * TIMES.length)];
    const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
    const likes = 3 + Math.floor(random(`l-${i}`) * 240);
    return { i, x, y, rot, cardW, appear, txt, name, time, avatarColor, likes };
  });

  // Render later-appearing cards on top
  const ordered = [...cards].sort((a, b) => a.appear - b.appear);

  return (
    <AbsoluteFill style={{ fontFamily: theme.fonts.primary }}>
      {ordered.map((c) => {
        const lf = frame - c.appear;
        if (lf < 0) return null;
        const s = spring({ frame: lf, fps, config: { damping: 12, stiffness: 140, mass: 0.7 } });
        const opacity = interpolate(lf, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
        const fs = c.cardW;
        const pad = 16 * scaleUnit;
        const nameSize = Math.round(fs * 0.062);
        const textSize = Math.round(fs * 0.058);
        const metaSize = Math.round(fs * 0.045);
        return (
          <div
            key={c.i}
            style={{
              position: 'absolute',
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: c.cardW,
              transform: `translate(-50%, -50%) rotate(${c.rot}deg) scale(${s})`,
              opacity,
              background: '#ffffff',
              borderRadius: 18 * scaleUnit,
              boxShadow: '0 10px 30px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.18)',
              padding: pad,
              boxSizing: 'border-box',
              direction: 'ltr',
              textAlign: 'left',
            }}
          >
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 * scaleUnit, marginBottom: 8 * scaleUnit }}>
              <div style={{ width: 36 * scaleUnit, height: 36 * scaleUnit, borderRadius: '50%', background: c.avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: nameSize, flexShrink: 0 }}>
                {c.name.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontWeight: 700, fontSize: nameSize, color: '#0f172a' }}>{c.name}</span>
                <span style={{ fontSize: metaSize, color: '#94a3b8' }}>{c.time}</span>
              </div>
            </div>
            {/* comment text */}
            <div style={{ fontSize: textSize, color: '#1e293b', lineHeight: 1.35, marginBottom: 12 * scaleUnit }}>
              {c.txt}
            </div>
            {/* engagement buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 * scaleUnit, fontSize: metaSize, color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 * scaleUnit }}>👍 {c.likes}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 * scaleUnit }}>👎</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 * scaleUnit, color: accent, fontWeight: 600 }}>💬 Reply</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
