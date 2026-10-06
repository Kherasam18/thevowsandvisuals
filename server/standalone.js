import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from './api.js';
import { createStorageFromEnv } from './storage.js';

/*
  Serves the production build plus the admin API, for checking the built site
  locally. `npm run dev` does not use this — Vite mounts the same handler
  itself. Run `npm run build` first.
*/

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');
const port = Number(process.env.PORT ?? 4173);

// Vite loads .env for `npm run dev`; this server has to do it itself.
try {
  process.loadEnvFile(path.join(projectRoot, '.env'));
} catch {
  console.warn('No .env found — the admin will be locked. See .env.example.');
}

const dataDir = path.join(projectRoot, '.data');
const { storage, kind, detail } = createStorageFromEnv(process.env, { dataDir });
console.log(`Storage: ${kind === 'r2' ? `R2 bucket "${detail}"` : `local folder ${detail}`}`);

const handleApi = createApi({
  dataDir,
  projectRoot,
  storage,
  auth: {
    adminEmail: process.env.ADMIN_EMAIL,
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
    sessionSecret: process.env.ADMIN_SESSION_SECRET,
    // Set when this is served over https, so the cookie never crosses plain http.
    secureCookies: process.env.ADMIN_SECURE_COOKIES === 'true',
  },
});

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

/*
  On the admin host, send the bare root to the dashboard.

  This server carries the whole app, so without it admin.<domain>/ shows the
  public site and the dashboard hides at admin.<domain>/admin — an address
  nobody guesses and everybody mistypes. Off by default, because the same
  server is used locally to preview the public build.
*/
const rootRedirect = process.env.ADMIN_ROOT_REDIRECT;

http
  .createServer(async (req, res) => {
    if (await handleApi(req, res)) return;

    const url = new URL(req.url, 'http://localhost');

    if (rootRedirect && url.pathname === '/') {
      res.writeHead(302, { Location: rootRedirect });
      res.end();
      return;
    }
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
