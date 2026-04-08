/**
 * Video Generator — Public API
 *
 * Usage:
 *   import { generateVideo } from './lib/generator';
 *   await generateVideo('video.config.json');
 */

import * as fs from 'fs';
import * as path from 'path';
import type { VideoConfig, ResolvedConfig } from './schema';
import { resolveConfig } from './resolve';
import { compileProject } from './compile';
import { generateAssets } from './assets';
import { installDependencies, renderProject } from './render';

export type { VideoConfig, ResolvedConfig } from './schema';
export { resolveConfig } from './resolve';
export { compileProject } from './compile';
export { generateAssets } from './assets';
export { installDependencies, renderProject } from './render';

export interface GenerateOptions {
  /** Project name (defaults to config type + timestamp) */
  name?: string;
  /** Output directory (defaults to projects/) */
  outputDir?: string;
  /** Skip audio generation */
  noAudio?: boolean;
  /** Only compile, don't render */
  compileOnly?: boolean;
  /** Open Remotion Studio for preview */
  preview?: boolean;
  /** Specific compositions to render */
  compositions?: string[];
}

/** Generate a complete video from a config file */
export async function generateVideo(
  configPath: string,
  options: GenerateOptions = {}
): Promise<{ projectDir: string; outputs: string[] }> {
  // 1. Load config
  console.log(`Loading config from ${configPath}...`);
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as VideoConfig;

  // 2. Resolve project name
  const projectName = options.name || raw.type + '-' + Date.now().toString(36);
  const projectsRoot = options.outputDir || path.resolve(__dirname, '../../projects');
  const projectDir = path.join(projectsRoot, projectName);

  // 3. Resolve config (merge defaults, load brand)
  console.log('Resolving config...');
  const config = resolveConfig(raw, projectName);

  // 4. Compile project
  console.log('Compiling project...');
  compileProject(config, projectDir);

  // 5. Generate assets (audio)
  if (!options.noAudio) {
    console.log('Generating audio assets...');
    await generateAssets(config, projectDir);

    // Re-compile with audio awareness (knows which files exist)
    console.log('Re-compiling with audio...');
    compileProject(config, projectDir);

    // Re-write video-data.json with updated audio paths
    const dataPath = path.join(projectDir, 'remotion', 'src', 'video-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(config, null, 2));
  }

  // 6. Install dependencies
  console.log('Installing dependencies...');
  installDependencies(projectDir);

  // 7. Render or preview
  let outputs: string[] = [];
  if (!options.compileOnly) {
    outputs = renderProject(config, projectDir, {
      preview: options.preview,
      compositions: options.compositions,
    });
  }

  console.log(`\nProject ready at: ${projectDir}`);
  if (outputs.length > 0) {
    console.log(`Rendered ${outputs.length} video(s):`);
    outputs.forEach(o => console.log(`  ${o}`));
  }

  return { projectDir, outputs };
}
