import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'vite';
import { createRequire } from 'node:module';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.prerender-build');
if (!outDir.startsWith(root + path.sep)) throw Error('Prerender output must stay in workspace.');
process.env.CREATIVA_PRERENDER = '1';
await build({
  root,
  publicDir: false,
  logLevel: 'error',
  build: { ssr: 'src/prerender.mjs', outDir, emptyOutDir: true, manifest: false, rollupOptions: { input: 'src/prerender.mjs' } },
});
const { renderLogin } = await import(pathToFileURL(path.join(outDir, 'prerender.js')));
const shell = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const markup = renderLogin();
if (!markup.includes('id="email"') || !markup.includes('id="password"')) throw Error('Prerendered login form missing.');
const require = createRequire(import.meta.url);
const theme = require('../tailwind.config.cjs');
const critical = await postcss([tailwindcss({ ...theme, content: [{ raw: markup, extension: 'html' }, path.join(root, 'src/pages/Login.jsx')] })])
  .process(fs.readFileSync(path.join(root, 'src/index.css'), 'utf8'), { from: undefined });
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'dist/.vite/manifest.json'), 'utf8'));
const loginEntry = manifest['src/login-entry.js'];
if (!loginEntry?.isEntry) throw Error('Public login entry missing.');
const html = shell
  .replace(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/g, `<script type="module" src="/${loginEntry.file}"></script>`)
  .replace(/<link rel="modulepreload"[^>]*>/g, '')
  .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
  .replace(/(<button[^>]+type="submit")/, '$1 disabled')
  .replace(/<link rel="stylesheet"([^>]+)>/g, `<link rel="stylesheet" media="print" onload="this.media='all';this.onload=null"$1>`)
  .replace('</head>', `<style id="login-critical-css">${critical.css}</style></head>`);
if (html === shell) throw Error('Production root placeholder missing.');
fs.writeFileSync(path.join(root, 'dist/login.html'), html);
console.log('Public login HTML prerendered; private SPA shell preserved.');
