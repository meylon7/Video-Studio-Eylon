/**
 * Compile Pipeline — Stage 4
 *
 * Generates a complete Remotion project from a ResolvedConfig.
 * The generated project uses shared scene components from lib/components/scenes/
 * and reads content from video-data.json.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ResolvedConfig, TransitionConfig } from './schema';

/** Walk up from a starting dir until we find brands/ and templates/ */
function findRepoRoot(startDir: string): string {
  // Try walking up from startDir
  let dir = path.resolve(startDir);
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'brands')) && fs.existsSync(path.join(dir, 'templates'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Try walking up from cwd
  dir = path.resolve(process.cwd());
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'brands')) && fs.existsSync(path.join(dir, 'templates'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback
  return path.resolve(startDir, '../..');
}

/** Uploads info from the web form */
interface UploadsInfo {
  logo: string | null;
  images: string[];
  videos: string[];
}

/** Generate a complete Remotion project from resolved config */
export function compileProject(config: ResolvedConfig, outputDir: string, uploads?: UploadsInfo): void {
  const remotionDir = path.join(outputDir, 'remotion');
  const srcDir = path.join(remotionDir, 'src');
  const configDir = path.join(srcDir, 'config');
  const publicDir = path.join(remotionDir, 'public');

  // Create directories
  for (const dir of [srcDir, configDir, path.join(publicDir, 'audio'), path.join(publicDir, 'images'), path.join(publicDir, 'demos')]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Find repo root (where brands/ and templates/ live)
  const repoRoot = findRepoRoot(__dirname);
  console.log(`  Repo root: ${repoRoot} (from __dirname: ${__dirname})`);

  // Copy template infrastructure files
  const templateDir = path.join(repoRoot, 'templates', 'product-demo');
  for (const file of ['package.json', 'tsconfig.json', 'remotion.config.ts']) {
    const src = path.join(templateDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(remotionDir, file));
    }
  }

  // Always copy brand assets (logo, etc.)
  const brandAssetsDir = path.join(repoRoot, 'brands', config.brand, 'assets');
  if (fs.existsSync(brandAssetsDir)) {
    const files = fs.readdirSync(brandAssetsDir);
    for (const file of files) {
      fs.copyFileSync(path.join(brandAssetsDir, file), path.join(publicDir, 'images', file));
    }
    console.log(`  Copied ${files.length} brand assets`);
  }

  // Copy any uploaded files referenced in config
  const uploadsDir = path.join(repoRoot, 'app', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    // Copy uploaded logo if it's from uploads
    if (config.product.logo && config.product.logo.includes('/uploads/')) {
      const logoFilename = path.basename(config.product.logo);
      const src = path.join(uploadsDir, logoFilename);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(publicDir, 'images', logoFilename));
        config.product.logo = 'images/' + logoFilename;
        console.log(`  Copied uploaded logo: ${logoFilename}`);
      }
    }

    // Copy uploaded images
    if (uploads?.images?.length) {
      uploads.images.forEach((imgPath, i) => {
        const filename = path.basename(imgPath);
        const src = path.join(uploadsDir, filename);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(publicDir, 'images', filename));
          console.log(`  Copied uploaded image: ${filename}`);
        }
      });
    }

    // Copy uploaded videos and wire into demo scenes
    if (uploads?.videos?.length) {
      uploads.videos.forEach((vidPath, i) => {
        const filename = path.basename(vidPath);
        const src = path.join(uploadsDir, filename);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(publicDir, 'demos', filename));
          console.log(`  Copied uploaded video: ${filename}`);
        }
      });
      // Wire first uploaded video into demo scenes that lack a videoFile
      const firstVideoFilename = path.basename(uploads.videos[0]);
      let videoIdx = 0;
      config.scenes.forEach(scene => {
        if (scene.type === 'demo' && !scene.content.videoFile) {
          const vidFile = videoIdx < uploads.videos.length
            ? path.basename(uploads.videos[videoIdx++])
            : firstVideoFilename;
          scene.content.videoFile = 'demos/' + vidFile;
        }
      });
    }

    // Resolve any scene content that references /uploads/ paths
    config.scenes.forEach(scene => {
      // Image scenes: user-selected or auto-assign
      if (scene.type === 'image') {
        if (scene.content.imageSrc && scene.content.imageSrc.includes('/uploads/')) {
          const filename = path.basename(scene.content.imageSrc);
          const src = path.join(uploadsDir, filename);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(publicDir, 'images', filename));
          }
          scene.content.imageSrc = 'images/' + filename;
        }
      }
      // Demo scenes: user-selected or auto-assign
      if (scene.type === 'demo') {
        if (scene.content.videoFile && scene.content.videoFile.includes('/uploads/')) {
          const filename = path.basename(scene.content.videoFile);
          const src = path.join(uploadsDir, filename);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(publicDir, 'demos', filename));
          }
          scene.content.videoFile = 'demos/' + filename;
        }
      }
    });

    // Auto-wire remaining: images without imageSrc, demos without videoFile
    if (uploads?.images?.length) {
      let imgIdx = 0;
      config.scenes.forEach(scene => {
        if (scene.type === 'image' && !scene.content.imageSrc && imgIdx < uploads.images.length) {
          scene.content.imageSrc = 'images/' + path.basename(uploads.images[imgIdx++]);
        }
      });
    }
    if (uploads?.videos?.length) {
      let vidIdx = 0;
      config.scenes.forEach(scene => {
        if (scene.type === 'demo' && !scene.content.videoFile && vidIdx < uploads.videos.length) {
          scene.content.videoFile = 'demos/' + path.basename(uploads.videos[vidIdx++]);
        }
      });
    }

    // Copy uploaded background music -> public/audio/background-music.wav
    const customMusic = (config.audio as any)?.music?.customFile;
    if (customMusic && customMusic.includes('/uploads/')) {
      const src = path.join(uploadsDir, path.basename(customMusic));
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(publicDir, 'audio', 'background-music.wav'));
        console.log('  Copied uploaded background music');
      }
    }

    // Copy uploaded background image -> public/images
    const bgImg = (config.visual as any)?.backgroundImage;
    if (bgImg && bgImg.includes('/uploads/')) {
      const fn = path.basename(bgImg);
      const src = path.join(uploadsDir, fn);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(publicDir, 'images', fn));
        (config.visual as any).backgroundImage = 'images/' + fn;
        console.log('  Copied uploaded background image');
      }
    }
  }

  // Generate video-data.json
  fs.writeFileSync(
    path.join(srcDir, 'video-data.json'),
    JSON.stringify(config, null, 2)
  );

  // Generate brand.ts
  fs.writeFileSync(path.join(configDir, 'brand.ts'), generateBrandTS(config));

  // Generate theme.ts
  fs.writeFileSync(path.join(configDir, 'theme.ts'), generateThemeTS());

  // Check which audio files actually exist
  const audioDir = path.join(publicDir, 'audio');
  const hasMusicFile = fs.existsSync(path.join(audioDir, 'background-music.wav'));
  const hasVoiceover = config.scenes.some(s => s.audioFile && fs.existsSync(path.join(publicDir, s.audioFile)));

  // Generate ConfigDrivenVideo.tsx
  fs.writeFileSync(path.join(srcDir, 'ConfigDrivenVideo.tsx'), generateConfigDrivenVideo(config, hasMusicFile));

  // Generate SubtitledVideo.tsx if needed
  if (config.variants.includes('subtitled')) {
    fs.writeFileSync(path.join(srcDir, 'SubtitledVideo.tsx'), generateSubtitledVideo(config));
  }

  // Generate Root.tsx
  fs.writeFileSync(path.join(srcDir, 'Root.tsx'), generateRootTSX(config));

  // Generate index.ts
  fs.writeFileSync(path.join(srcDir, 'index.ts'), [
    "import { registerRoot } from 'remotion';",
    "import { RemotionRoot } from './Root';",
    "registerRoot(RemotionRoot);",
    "",
  ].join('\n'));
}

function generateBrandTS(config: ResolvedConfig): string {
  const repoRoot = findRepoRoot(__dirname);
  const brandJsonPath = path.join(repoRoot, 'brands', config.brand, 'brand.json');
  let brandData: any;

  if (fs.existsSync(brandJsonPath)) {
    brandData = JSON.parse(fs.readFileSync(brandJsonPath, 'utf-8'));
  } else {
    // Use defaults from config visual
    brandData = {
      colors: {
        primary: '#ea580c', primaryLight: '#fb923c', accent: '#3771e0',
        textDark: '#ffffff', textMedium: '#94a3b8', textLight: '#64748b',
        bgLight: '#0f172a', bgDark: '#020617',
        bgOverlay: 'rgba(255,255,255,0.05)', divider: '#1e293b', shadow: 'rgba(0,0,0,0.4)',
      },
      fonts: { primary: 'Inter, system-ui, sans-serif', mono: 'JetBrains Mono, monospace' },
      spacing: { xs: 8, sm: 16, md: 24, lg: 48, xl: 80, xxl: 120 },
      borderRadius: { sm: 6, md: 10, lg: 16 },
      typography: {
        h1: { size: 72, weight: 700 }, h2: { size: 56, weight: 700 },
        h3: { size: 40, weight: 600 }, body: { size: 28, weight: 400 },
        label: { size: 18, weight: 600, letterSpacing: 2 },
      },
    };
  }

  // Calculate depth from project to lib
  // projects/{name}/remotion/src/config/ -> need to go up to digitalsamba root
  const libPath = '../../../../../lib/theme';

  return `import type { Theme } from '${libPath}';

export const brandName = '${config.brand}';

export const brand = ${JSON.stringify(brandData, null, 2)};

export const brandTheme: Theme = {
  colors: brand.colors,
  fonts: brand.fonts,
  spacing: brand.spacing,
  borderRadius: brand.borderRadius,
  typography: brand.typography,
};
`;
}

function generateThemeTS(): string {
  const libPath = '../../../../../lib/theme';
  return `import { ThemeProvider, useTheme } from '${libPath}';
import type { Theme } from '${libPath}';
import { brandTheme } from './brand';

export const defaultTheme: Theme = brandTheme;
export { ThemeProvider, useTheme };
export type { Theme };
`;
}

function depthToLib(fromSrc: boolean = true): string {
  // from projects/{name}/remotion/src/ to lib/
  return fromSrc ? '../../../../lib' : '../../../../../lib';
}

function generateConfigDrivenVideo(config: ResolvedConfig, hasMusicFile: boolean = false): string {
  const libBase = depthToLib(true);

  // The composition is props-driven: `visual` and `overlays` come from props
  // (with a zod schema in Root.tsx) so they are live-editable in Remotion Studio,
  // falling back to the baked video-data.json. All transitions are imported so
  // the transition can be switched live.
  return `import React from 'react';
import { AbsoluteFill, Audio, staticFile, Sequence, Img, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { glitch } from '${libBase}/transitions/presentations/glitch';
import { rgbSplit } from '${libBase}/transitions/presentations/rgb-split';
import { zoomBlur } from '${libBase}/transitions/presentations/zoom-blur';
import { lightLeak } from '${libBase}/transitions/presentations/light-leak';
import { clockWipe } from '${libBase}/transitions/presentations/clock-wipe';
import { pixelate } from '${libBase}/transitions/presentations/pixelate';
import { checkerboard } from '${libBase}/transitions/presentations/checkerboard';
import { ThemeProvider, defaultTheme } from './config/theme';
import { SCENE_REGISTRY } from '${libBase}/components/scenes';
import { AnimatedBackground } from '${libBase}/components/AnimatedBackground';
import { Vignette } from '${libBase}/components/Vignette';
import { LogoWatermark } from '${libBase}/components/LogoWatermark';
import { FilmGrain } from '${libBase}/components/FilmGrain';
import { EffectsLayer, colorGradeFilter } from '${libBase}/components/EffectsLayer';
import videoData from './video-data.json';

function resolveTransition(type: string, props: any = {}) {
  switch (type) {
    case 'fade': return fade(props);
    case 'slide': return slide(props);
    case 'wipe': return wipe(props);
    case 'flip': return flip(props);
    case 'glitch': return glitch(props);
    case 'rgb-split': return rgbSplit(props);
    case 'zoom-blur': return zoomBlur(props);
    case 'light-leak': return lightLeak(props);
    case 'clock-wipe': return clockWipe(props);
    case 'pixelate': return pixelate(props);
    case 'checkerboard': return checkerboard(props);
    default: return fade();
  }
}

// Bottom caption bar built from each scene's narration.
const CaptionTrack: React.FC<{ scenes: any[]; caps: any; direction: string }> = ({ scenes, caps, direction }) => {
  const frame = useCurrentFrame();
  let text = '';
  for (const s of scenes) {
    const start = s.startFrame + 8;
    const end = s.startFrame + s.durationFrames - 6;
    if (s.narration && frame >= start && frame <= end) { text = s.narration; break; }
  }
  if (!text) return null;
  const bg = caps.background !== false;
  const color = caps.color || '#ffffff';
  const size = caps.size || 34;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, ...(caps.position === 'top' ? { top: 80 } : { bottom: 80 }), display: 'flex', justifyContent: 'center', zIndex: 120, padding: '0 8%' }}>
      <div style={{ background: bg ? 'rgba(8,12,24,0.78)' : 'transparent', borderRadius: 14, padding: bg ? '14px 30px' : 0, maxWidth: '88%' }}>
        <span style={{ color, fontSize: size, fontWeight: 600, lineHeight: 1.35, fontFamily: defaultTheme.fonts.primary, textAlign: 'center', display: 'block', direction: direction as any, textShadow: bg ? undefined : '0 2px 10px rgba(0,0,0,0.85)' }}>{text}</span>
      </div>
    </div>
  );
};

export const ConfigDrivenVideo: React.FC<{ visual?: any; overlays?: any }> = (props) => {
  const data = videoData as any;
  // Props (editable live in Studio) merged over the baked config
  const visual = { ...data.visual, ...(props.visual || {}) };
  const overlays = { ...data.overlays, ...(props.overlays || {}) };
  const { scenes, audio, product, output } = data;
  const fps = output.fps;
  const gradeFilter = colorGradeFilter(overlays.colorGrade && overlays.colorGrade.preset);
  const baseIntensity = (overlays.effects && overlays.effects.intensity) || 1;
  const captionsOn = overlays.captions && overlays.captions.enabled;
  const LIGHT_BG: any = { light: ['#ffffff', '#eef2f7'], paper: ['#f7f1e6', '#ece2cf'], sky: ['#eef5fd', '#d6e7fb'] };
  const lightPair = LIGHT_BG[visual.background];
  const bgDark = !lightPair && (visual.background === 'dark' || visual.background === 'tech');
  const colorOverride: any = lightPair ? { textDark: '#0f172a', textMedium: '#475569', textLight: '#94a3b8', bgLight: lightPair[0], bgDark: lightPair[0], bgOverlay: 'rgba(15,23,42,0.05)', divider: '#e2e8f0', shadow: 'rgba(15,23,42,0.12)' } : {};
  if (visual.titleColor) colorOverride.textDark = visual.titleColor;
  if (visual.accentColor) { colorOverride.primary = visual.accentColor; colorOverride.accent = visual.accentColor; }

  return (
    <ThemeProvider theme={{...defaultTheme, direction: visual.direction || 'ltr', colors: {...defaultTheme.colors, ...colorOverride}}}>
      <AbsoluteFill
        style={{
          backgroundColor: lightPair ? lightPair[0] : (bgDark ? defaultTheme.colors.bgDark : defaultTheme.colors.bgLight),
          fontFamily: defaultTheme.fonts.primary,
          direction: visual.direction || 'ltr',
          textAlign: visual.direction === 'rtl' ? 'right' : 'left',
          filter: gradeFilter || undefined,
        }}
      >
        {lightPair ? (
          <AbsoluteFill style={{ background: \`radial-gradient(120% 120% at 80% 10%, \${lightPair[1]}, \${lightPair[0]})\` }} />
        ) : (
          <AnimatedBackground variant={visual.background as any} />
        )}
        {visual.backgroundImage && (
          <AbsoluteFill>
            <Img src={staticFile(visual.backgroundImage)} style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute'}} />
            <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)'}} />
          </AbsoluteFill>
        )}

${hasMusicFile ? `        {/* Background Music */}
        <Audio src={staticFile('audio/background-music.wav')} volume={audio.music?.volume || 0.1} />` : '        {/* No music file generated */}'}

        {/* Per-scene voiceover */}
        {scenes.map((scene: any, i: number) =>
          scene.audioFile ? (
            <Sequence key={\`vo-\${i}\`} from={scene.startFrame + 15}>
              <Audio src={staticFile(scene.audioFile)} volume={0.9} />
            </Sequence>
          ) : null
        )}

        {/* Overlays */}
        {overlays.vignette.enabled && (
          <Vignette intensity={overlays.vignette.intensity} />
        )}
        {overlays.logoWatermark.enabled && (product.logo || product.name) && (
          <LogoWatermark
            logoSrc={product.logo || ''}
            label={product.logo ? undefined : product.name}
            fadeInFrame={30}
            size={80}
            maxOpacity={0.9}
          />
        )}

        {/* Scenes */}
        <TransitionSeries>
          {scenes.map((scene: any, i: number) => {
            const SceneComponent = (SCENE_REGISTRY as any)[scene.type];
            if (!SceneComponent) return null;
            const fx = scene.fx;
            const sceneGrade = fx && fx.colorGrade ? colorGradeFilter(fx.colorGrade) : '';
            const t = scene.transition || visual.transition || { type: 'none', durationFrames: 15 };

            return (
              <React.Fragment key={i}>
                <TransitionSeries.Sequence durationInFrames={scene.durationFrames}>
                  <AbsoluteFill style={{ filter: sceneGrade || undefined }}>
                    {scene.content.backgroundImage && (
                      <AbsoluteFill>
                        <Img src={staticFile(scene.content.backgroundImage)} style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute'}} />
                        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.55)'}} />
                      </AbsoluteFill>
                    )}
                    <SceneComponent content={scene.content} durationInFrames={scene.durationFrames} />
                    {fx && <EffectsLayer effects={{ intensity: baseIntensity, ...fx }} />}
                  </AbsoluteFill>
                </TransitionSeries.Sequence>
                {i < scenes.length - 1 && t.type !== 'none' && (
                  <TransitionSeries.Transition
                    presentation={resolveTransition(t.type)}
                    timing={linearTiming({ durationInFrames: t.durationFrames || 15 })}
                  />
                )}
              </React.Fragment>
            );
          })}
        </TransitionSeries>

        {/* Post-effects — rendered on top of all scenes */}
        {overlays.filmGrain && overlays.filmGrain.enabled && (
          <FilmGrain opacity={overlays.filmGrain.opacity} />
        )}
        {overlays.effects && (
          <EffectsLayer effects={overlays.effects} />
        )}
        {captionsOn && (
          <CaptionTrack scenes={scenes} caps={overlays.captions} direction={visual.direction || 'ltr'} />
        )}
      </AbsoluteFill>
    </ThemeProvider>
  );
};
`;
}

function generateSubtitledVideo(config: ResolvedConfig): string {
  const libBase = depthToLib(true);

  // Auto-generate subtitle entries from scene narration
  const entries = config.scenes
    .filter(s => s.narration)
    .map(s => ({
      text: s.narration!,
      startFrame: s.startFrame + 20,
      endFrame: s.startFrame + s.durationFrames - 10,
    }));

  return `import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { ConfigDrivenVideo } from './ConfigDrivenVideo';

const subtitleEntries = ${JSON.stringify(entries, null, 2)};

const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const current = subtitleEntries.find(
    (e: any) => frame >= e.startFrame && frame <= e.endFrame
  );
  if (!current) return null;

  const fadeIn = interpolate(frame, [current.startFrame, current.startFrame + 8], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [current.endFrame - 8, current.endFrame], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <div style={{
      position: 'absolute', bottom: 80, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(fadeIn, fadeOut), zIndex: 100,
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        borderRadius: 12, padding: '14px 36px', maxWidth: width * 0.8,
      }}>
        <span style={{
          color: '#fff', fontSize: 32, fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500, textAlign: 'center', lineHeight: 1.4,
        }}>{current.text}</span>
      </div>
    </div>
  );
};

export const SubtitledVideo: React.FC = () => (
  <AbsoluteFill>
    <ConfigDrivenVideo />
    <Subtitles />
  </AbsoluteFill>
);
`;
}

function generateRootTSX(config: ResolvedConfig): string {
  const compositions: string[] = [];
  const imports: string[] = [
    "import { Composition } from 'remotion';",
    "import { z } from 'zod';",
    "import { zColor } from '@remotion/zod-types';",
    "import { ConfigDrivenVideo } from './ConfigDrivenVideo';",
  ];

  // Default props for the live-editable knobs (subset of the resolved config).
  // Emitted as a literal so Studio's schema editor has valid initial values.
  const studioDefaults = {
    visual: {
      background: config.visual.background,
      animationSpeed: config.visual.animationSpeed,
      direction: config.visual.direction,
      transition: {
        type: config.visual.transition.type,
        durationFrames: config.visual.transition.durationFrames,
      },
    },
    overlays: {
      vignette: config.overlays.vignette,
      filmGrain: config.overlays.filmGrain,
      colorGrade: config.overlays.colorGrade,
      effects: config.overlays.effects,
      captions: config.overlays.captions,
    },
  };
  const defaultPropsLiteral = JSON.stringify(studioDefaults, null, 2)
    .split('\n').join('\n');

  const studioProps = `        schema={videoSchema}
        defaultProps={studioDefaultProps}`;

  // Main composition
  compositions.push(`      <Composition
        id="Main"
        component={ConfigDrivenVideo}
${studioProps}
        durationInFrames={${config.totalFrames}}
        fps={${config.output.fps}}
        width={${config.output.width}}
        height={${config.output.height}}
      />`);

  // Subtitled variant
  if (config.variants.includes('subtitled')) {
    imports.push("import { SubtitledVideo } from './SubtitledVideo';");
    compositions.push(`      <Composition
        id="Subtitled"
        component={SubtitledVideo}
        durationInFrames={${config.totalFrames}}
        fps={${config.output.fps}}
        width={${config.output.width}}
        height={${config.output.height}}
      />`);
  }

  // Vertical variant
  if (config.variants.includes('vertical')) {
    compositions.push(`      <Composition
        id="Vertical"
        component={ConfigDrivenVideo}
${studioProps}
        durationInFrames={${config.totalFrames}}
        fps={${config.output.fps}}
        width={1080}
        height={1920}
      />`);
  }

  // Square variant
  if (config.variants.includes('square')) {
    compositions.push(`      <Composition
        id="Square"
        component={ConfigDrivenVideo}
${studioProps}
        durationInFrames={${config.totalFrames}}
        fps={${config.output.fps}}
        width={1080}
        height={1080}
      />`);
  }

  return `${imports.join('\n')}

// Live-editable schema for Remotion Studio's props panel.
export const videoSchema = z.object({
  visual: z.object({
    background: z.enum(['dark', 'tech', 'warm', 'subtle']),
    animationSpeed: z.enum(['slow', 'normal', 'fast']),
    direction: z.enum(['ltr', 'rtl']),
    transition: z.object({
      type: z.enum(['fade', 'slide', 'wipe', 'flip', 'clock-wipe', 'checkerboard', 'zoom-blur', 'glitch', 'rgb-split', 'light-leak', 'pixelate', 'none']),
      durationFrames: z.number().int().min(0).max(120),
    }),
  }),
  overlays: z.object({
    vignette: z.object({
      enabled: z.boolean(),
      intensity: z.number().min(0).max(1),
      centerSize: z.number().min(0).max(100),
    }),
    filmGrain: z.object({
      enabled: z.boolean(),
      opacity: z.number().min(0).max(1),
    }),
    colorGrade: z.object({
      preset: z.enum(['none', 'cinematic', 'vibrant', 'teal-orange', 'bleach-bypass', 'technicolor', 'infrared', 'matrix', 'noir', 'warm', 'cold', 'dreamy', 'vintage', 'sepia', 'polaroid']),
    }),
    effects: z.object({
      intensity: z.number().min(0).max(1.5),
      glow: z.boolean(),
      bloom: z.boolean(),
      scanlines: z.boolean(),
      lightLeaks: z.boolean(),
      lightRays: z.boolean(),
      bokeh: z.boolean(),
      vhs: z.boolean(),
      dust: z.boolean(),
      colorWash: z.object({
        enabled: z.boolean(),
        color: zColor(),
        opacity: z.number().min(0).max(1),
        blend: z.string(),
      }),
      letterbox: z.object({
        enabled: z.boolean(),
        ratio: z.enum(['2.39', '2.0', '1.85']),
      }),
    }),
    captions: z.object({
      enabled: z.boolean(),
      position: z.enum(['bottom', 'top']),
    }),
  }),
});

const studioDefaultProps = ${defaultPropsLiteral} as z.infer<typeof videoSchema>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
${compositions.join('\n')}
    </>
  );
};
`;
}
