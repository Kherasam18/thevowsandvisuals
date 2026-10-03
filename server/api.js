import fs from 'node:fs';
import { createFsStorage } from './storage.js';
import { ingestImage, keysForMedia } from './images.js';
import {
  PUBLISHED_KEY,
  listVersions,
  normalise,
  publish,
  readDraft,
  readPublished,
  restoreVersion,
  unusedMediaIds,
  validate,
  writeDraft,
} from './content.js';
import { seed } from './seed.js';

const MAX_UPLOAD_BYTES = 80 * 1024 * 1024; // comfortably past a 45MP master

const MIME = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  tif: 'image/tiff',
};

const send = (res, status, body, headers = {}) => {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    ...headers,
  });
  res.end(payload);
};

const readBody = (req, limit) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Upload is too large.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const readJson = async (req) => {
  const buf = await readBody(req, 8 * 1024 * 1024);
  if (!buf.length) return null;
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch {
    throw Object.assign(new Error('Request body is not valid JSON.'), { statusCode: 400 });
  }
};

/**
 * The admin API, plus the two read-only routes the public site uses.
 *
 * Returns true when it handled the request, so a host (Vite's dev server, or
 * the standalone server) can fall through to its own handling otherwise.
 */
export function createApi({ dataDir, projectRoot, log = console.log }) {
  const storage = createFsStorage(dataDir);

  // One shared promise: concurrent first requests must not seed twice.
  let ready = null;
  const ensureSeeded = () => {
    ready ??= (async () => {
      if (await storage.get(PUBLISHED_KEY)) return;
      log('[content] no content found — importing src/assets (one-off, ~1-2 min)…');
      await seed({ storage, projectRoot, log: (m) => log(`[content] ${m}`) });
    })();
    return ready;
  };

  /*
    Local builds have no sign-in: the server is bound to this machine.
    In production this is where the Cloudflare Access token is checked —
    Access sitting in front of the Worker is not by itself sufficient, since
    the Worker's own hostname could be reached directly.
  */
  const requireAdmin = () => true;

  const serveFile = (res, key, { immutable }) => {
    const file = storage.pathFor(key);
    let stat;
    try {
      stat = fs.statSync(file);
    } catch {
      send(res, 404, { error: 'Not found' });
      return;
    }
    const ext = key.split('.').pop().toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Content-Length': stat.size,
      // Variant keys contain the id, width and format, so a given URL's bytes
      // never change — the same header the R2 custom domain will send.
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  };

  return async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const { pathname } = url;
    const method = req.method ?? 'GET';

    const isApi = pathname.startsWith('/api/');
    const isMedia = pathname.startsWith('/media/');
    const isContent = pathname === '/content/published.json';
    if (!isApi && !isMedia && !isContent) return false;

    try {
      await ensureSeeded();

      // ---- public reads -------------------------------------------------
      if (isContent) {
        const published = await readPublished(storage);
        send(res, 200, published, { 'Cache-Control': 'no-cache' });
        return true;
      }

      if (isMedia) {
        if (method !== 'GET' && method !== 'HEAD') {
          send(res, 405, { error: 'Method not allowed' });
          return true;
        }
        const key = decodeURIComponent(pathname.slice(1));
        if (!key.startsWith('media/')) {
          send(res, 400, { error: 'Bad media path' });
          return true;
        }
        serveFile(res, key, { immutable: key.startsWith('media/variants/') });
        return true;
      }

      // ---- admin --------------------------------------------------------
      if (!requireAdmin(req)) {
        send(res, 401, { error: 'Not signed in' });
        return true;
      }

      const route = pathname.slice('/api/'.length);

      if (route === 'content' && method === 'GET') {
        send(res, 200, await readDraft(storage));
        return true;
      }

      if (route === 'content' && method === 'PUT') {
        const body = await readJson(req);
        const next = await writeDraft(storage, body);
        send(res, 200, { content: next, warnings: validate(next) });
        return true;
      }

      if (route === 'publish' && method === 'POST') {
        send(res, 200, await publish(storage));
        return true;
      }

      if (route === 'versions' && method === 'GET') {
        send(res, 200, await listVersions(storage));
        return true;
      }

      if (route === 'versions/restore' && method === 'POST') {
        const { key } = (await readJson(req)) ?? {};
        send(res, 200, await restoreVersion(storage, key));
        return true;
      }

      if (route === 'status' && method === 'GET') {
        const [draft, published] = [await readDraft(storage), await readPublished(storage)];
        send(res, 200, {
          publishedVersion: published.version,
          draftUpdatedAt: draft.updatedAt,
          publishedUpdatedAt: published.updatedAt,
          // Compared without timestamps, which differ on every save.
          hasUnpublishedChanges: stripVolatile(draft) !== stripVolatile(published),
          mediaCount: Object.keys(draft.media).length,
          unusedMediaIds: unusedMediaIds(draft),
          warnings: validate(draft),
        });
        return true;
      }

      if (route === 'media' && method === 'POST') {
        const filename = decodeURIComponent(req.headers['x-filename'] ?? 'upload');
        const buffer = await readBody(req, MAX_UPLOAD_BYTES);
        if (!buffer.length) {
          send(res, 400, { error: 'Empty upload' });
          return true;
        }

        let media;
        try {
          media = await ingestImage({ storage, buffer, filename });
        } catch (err) {
          send(res, 415, { error: `${filename}: ${err.message}` });
          return true;
        }

        const draft = await readDraft(storage);
        draft.media[media.id] = media;
        await writeDraft(storage, draft);
        send(res, 201, media);
        return true;
      }

      const mediaMatch = /^media\/([\w-]+)$/.exec(route);
      if (mediaMatch && (method === 'PATCH' || method === 'DELETE')) {
        const id = mediaMatch[1];
        const draft = await readDraft(storage);
        const media = draft.media[id];
        if (!media) {
          send(res, 404, { error: 'No such image' });
          return true;
        }

        if (method === 'PATCH') {
          const patch = (await readJson(req)) ?? {};
          if (typeof patch.alt === 'string') media.alt = patch.alt;
          if (patch.focal) {
            const clamp = (n) => Math.min(1, Math.max(0, Number(n) || 0));
            media.focal = { x: clamp(patch.focal.x), y: clamp(patch.focal.y) };
          }
          await writeDraft(storage, draft);
          send(res, 200, media);
          return true;
        }

        // Refuse while anything still points at it, rather than leaving holes
        // in the pages; the admin shows where it is used.
        if (!unusedMediaIds(draft).includes(id)) {
          send(res, 409, { error: 'This image is still used on the site. Remove it there first.' });
          return true;
        }
        for (const key of keysForMedia(media)) await storage.delete(key);
        delete draft.media[id];
        await writeDraft(storage, draft);
        send(res, 200, { deleted: id });
        return true;
      }

      send(res, 404, { error: `No route for ${method} ${pathname}` });
      return true;
    } catch (err) {
      log(`[api] ${method} ${pathname} failed:`, err);
      if (!res.headersSent) send(res, err.statusCode ?? 500, { error: err.message ?? 'Server error' });
      else res.end();
      return true;
    }
  };
}

const stripVolatile = (content) => {
  const { updatedAt, version, ...rest } = normalise(content);
  return JSON.stringify(rest);
};
