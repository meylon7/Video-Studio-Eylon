#!/usr/bin/env npx ts-node
/**
 * Video Generator CLI
 *
 * Usage:
 *   npx ts-node tools/generate-video.ts video.config.json [options]
 *
 * Options:
 *   --name <name>        Project name
 *   --no-audio           Skip audio generation
 *   --compile-only       Generate project without rendering
 *   --preview            Open Remotion Studio
 *   --render <comp,...>  Render specific compositions
 */

import * as path from 'path';
import { generateVideo } from '../lib/generator';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Video Generator — Create videos from config files

Usage:
  npx ts-node tools/generate-video.ts <config.json> [options]

Options:
  --name <name>        Project name (default: auto-generated)
  --no-audio           Skip audio generation
  --compile-only       Generate project without rendering
  --preview            Open Remotion Studio for preview
  --render <comps>     Render specific compositions (comma-separated)

Example:
  npx ts-node tools/generate-video.ts video.config.json --name my-demo
  npx ts-node tools/generate-video.ts video.config.json --preview
  npx ts-node tools/generate-video.ts video.config.json --compile-only --no-audio
`);
    process.exit(0);
  }

  // Parse arguments
  const configPath = path.resolve(args[0]);
  const options: any = {};

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--name':
        options.name = args[++i];
        break;
      case '--no-audio':
        options.noAudio = true;
        break;
      case '--compile-only':
        options.compileOnly = true;
        break;
      case '--preview':
        options.preview = true;
        break;
      case '--render':
        options.compositions = args[++i].split(',');
        break;
    }
  }

  try {
    const result = await generateVideo(configPath, options);
    console.log('\nDone!');
    process.exit(0);
  } catch (err: any) {
    console.error('\nError:', err.message);
    process.exit(1);
  }
}

main();
