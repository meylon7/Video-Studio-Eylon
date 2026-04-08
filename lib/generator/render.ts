/**
 * Render Pipeline — Stage 5
 *
 * Installs dependencies and renders the Remotion project.
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import type { ResolvedConfig } from './schema';

export interface RenderOptions {
  preview?: boolean;
  compositions?: string[];
}

/** Install npm dependencies in the generated project */
export function installDependencies(projectDir: string): void {
  const remotionDir = path.join(projectDir, 'remotion');
  console.log('Installing dependencies...');
  execSync('npm install', { cwd: remotionDir, stdio: 'inherit', timeout: 120000 });
}

/** Render all compositions */
export function renderProject(config: ResolvedConfig, projectDir: string, options: RenderOptions = {}): string[] {
  const remotionDir = path.join(projectDir, 'remotion');
  const outDir = path.join(remotionDir, 'out');
  fs.mkdirSync(outDir, { recursive: true });

  if (options.preview) {
    console.log('Opening Remotion Studio...');
    execSync('npx remotion studio', { cwd: remotionDir, stdio: 'inherit' });
    return [];
  }

  const compositions = options.compositions || getCompositions(config);
  const outputs: string[] = [];

  for (const comp of compositions) {
    const outputFile = path.join(outDir, `${config.projectName}-${comp.toLowerCase()}.mp4`);
    console.log(`Rendering ${comp}...`);
    try {
      execSync(`npx remotion render ${comp} --output "${outputFile}"`, {
        cwd: remotionDir,
        stdio: 'inherit',
        timeout: 600000,
      });
      outputs.push(outputFile);
      console.log(`  -> ${outputFile}`);
    } catch (err) {
      console.error(`  Failed to render ${comp}`);
    }
  }

  return outputs;
}

/** Get list of compositions to render */
function getCompositions(config: ResolvedConfig): string[] {
  const comps = ['Main'];
  if (config.variants.includes('subtitled')) comps.push('Subtitled');
  if (config.variants.includes('vertical')) comps.push('Vertical');
  if (config.variants.includes('square')) comps.push('Square');
  return comps;
}
