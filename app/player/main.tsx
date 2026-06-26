/**
 * In-app Remotion Player entry.
 *
 * Bundled by tools/build-player.js into app/player/bundle.js and loaded by
 * app/index.html. Renders the ConfigVideo composition live inside the web UI
 * (branded, light theme) and exposes a small global API so the form can push
 * config updates and seek as the user edits.
 *
 * window.StudioPreview = {
 *   mount(selector),
 *   update(rawConfig),     // re-render with new config
 *   seekToFrame(frame),    // jump the playhead
 *   fps,                   // current fps
 * }
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Player, PlayerRef } from '@remotion/player';
import { ConfigVideo, previewMeta } from '../../lib/components/ConfigVideo';

const PLACEHOLDER = {
  type: 'product-demo',
  scenes: [{ type: 'title', headline: 'התצוגה תופיע כאן', subheadline: '', duration: 5 }],
  visual: { background: 'dark', transition: { type: 'fade', durationFrames: 15 }, animationSpeed: 'normal', direction: 'rtl' },
  overlays: {},
  output: { width: 1920, height: 1080, fps: 30 },
};

let externalUpdate: (cfg: any) => void = () => {};
let externalSeek: (frame: number) => void = () => {};
let currentFps = 30;

const PreviewApp: React.FC = () => {
  const [config, setConfig] = useState<any>((window as any).__PREVIEW_CONFIG__ || PLACEHOLDER);
  const playerRef = useRef<PlayerRef>(null);

  const meta = previewMeta(config);
  currentFps = meta.fps;

  useEffect(() => {
    externalUpdate = (cfg: any) => setConfig(cfg && cfg.scenes && cfg.scenes.length ? cfg : PLACEHOLDER);
    externalSeek = (frame: number) => { try { playerRef.current?.seekTo(Math.max(0, frame)); } catch {} };
  }, []);

  return (
    <Player
      ref={playerRef}
      component={ConfigVideo}
      inputProps={{ config }}
      durationInFrames={meta.durationInFrames}
      fps={meta.fps}
      compositionWidth={meta.width}
      compositionHeight={meta.height}
      style={{ width: '100%', height: '100%' }}
      controls
      loop
      acknowledgeRemotionLicense
    />
  );
};

(window as any).StudioPreview = {
  mount(selector: string) {
    const el = document.querySelector(selector);
    if (!el) return;
    createRoot(el as HTMLElement).render(<PreviewApp />);
  },
  update(cfg: any) { externalUpdate(cfg); },
  seekToFrame(frame: number) { externalSeek(frame); },
  get fps() { return currentFps; },
};
