import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from './api.js';

/*
  Serves the production build plus the admin API, for checking the built site
  locally. `npm run dev` does not use this — Vite mounts the same handler
  itself. Run `npm run build` first.
*/

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');
const port = Number(process.env.PORT ?? 4173);

const handleApi = createApi({ dataDir: path.join(projectRoot, '.data'), projectRoot });

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
};

if (!fs.existsSync(distDir)) {
  console.error('dist/ is missing — run `npm run build` first.');
  process.exit(1);
}

http
  .createServer(async (req, res) => {
    if (await handleApi(req, res)) return;

    const url = new URL(req.url, 'http://localhost');
    const rel = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = path.join(distDir, rel);

    // Unknown paths fall back to index.html so client-side routes work on reload.
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(distDir, 'index.html');

    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': file.includes(`${path.sep}assets${path.sep}`)
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`Serving dist/ + admin API on http://localhost:${port}`));
