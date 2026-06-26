/**
 * Bundles the in-app Remotion Player (app/player/main.tsx) into
 * app/player/bundle.js.
 *
 * The player needs react / remotion / @remotion/player / esbuild. Those live in
 * a Remotion project's node_modules (projects/ is gitignored), so this script
 * auto-discovers a usable node_modules instead of hardcoding one path:
 *   1. projects/my-studio/remotion/node_modules (the canonical scratch project)
 *   2. any projects/<name>/remotion/node_modules that has esbuild + remotion
 *   3. the repo root node_modules (if player deps were installed there)
 *
 * On a fresh machine, render one video from the web UI first (that installs a
 * project's Remotion deps), then re-run this. The committed app/player/bundle.js
 * means the live preview already works without rebuilding.
 *
 * Usage: node tools/build-player.js
 */
const fs = require('fs');
const path = require('path');

function hasDeps(nm) {
  return fs.existsSync(path.join(nm, 'esbuild')) && fs.existsSync(path.join(nm, 'remotion'));
}

function findNodeModules() {
  const preferred = path.resolve(__dirname, '../projects/my-studio/remotion/node_modules');
  if (hasDeps(preferred)) return preferred;

  const candidates = [];
  const projectsDir = path.resolve(__dirname, '../projects');
  if (fs.existsSync(projectsDir)) {
    for (const name of fs.readdirSync(projectsDir)) {
      const nm = path.join(projectsDir, name, 'remotion', 'node_modules');
      if (hasDeps(nm)) candidates.push(nm);
    }
  }
  const rootNm = path.resolve(__dirname, '../node_modules');
  if (hasDeps(rootNm)) candidates.push(rootNm);

  return candidates[0] || null;
}

const projNodeModules = findNodeModules();
if (!projNodeModules) {
  console.error(
    '\n  Could not find Remotion build deps (esbuild + remotion).\n' +
    '  The committed app/player/bundle.js still works — you only need this to\n' +
    '  REBUILD the live-preview bundle after editing lib/components.\n\n' +
    "  Fix: generate one video from the web UI first (that installs a project's\n" +
    '  Remotion deps), then re-run: npm run build:player\n'
  );
  process.exit(1);
}
console.log(`  Using deps from: ${path.relative(path.resolve(__dirname, '..'), projNodeModules)}`);

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
