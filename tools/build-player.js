/**
 * Bundles the in-app Remotion Player (app/player/main.tsx) into
 * app/player/bundle.js. Resolves react / remotion / @remotion/player from the
 * project's node_modules (projects/my-studio/remotion) so the root repo needs
 * no extra dependencies.
 *
 * Usage: node tools/build-player.js
 */
const path = require('path');
const projNodeModules = path.resolve(__dirname, '../projects/my-studio/remotion/node_modules');
const esbuild = require(path.join(projNodeModules, 'esbuild'));

esbuild.build({
  entryPoints: [path.resolve(__dirname, '../app/player/main.tsx')],
  outfile: path.resolve(__dirname, '../app/player/bundle.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  nodePaths: [projNodeModules],
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: 'window.process=window.process||{env:{NODE_ENV:"production"}};' },
  logLevel: 'info',
  minify: true,
}).then(() => {
  console.log('Player bundle built -> app/player/bundle.js');
}).catch((e) => {
  console.error('Build failed:', e.message);
  process.exit(1);
});
