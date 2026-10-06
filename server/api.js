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
  mediaUsage,
  removeMediaReferences,
  restoreVersion,
  storageUsage,
  unusedMediaIds,
  validate,
  writeDraft,
} from './content.js';
import { seed } from './seed.js';
import { migrate } from './migrations.js';
import {
  SESSION_COOKIE,
  createLoginThrottle,
  createSession,
  parseCookies,
  readSession,
  serializeCookie,
  verifyPassword,
} from './auth.js';

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
export function createApi({ dataDir, projectRoot, log = console.log, auth = {}, storage: given }) {
  const storage = given ?? createFsStorage(dataDir);
  const throttle = createLoginThrottle();

  const { adminEmail, adminPasswordHash, sessionSecret, secureCookies = false } = auth;
  const authConfigured = Boolean(adminEmail && adminPasswordHash && sessionSecret);

  if (!authConfigured) {
    log(
      '[auth] ADMIN_EMAIL / ADMIN_PASSWORD_HASH / ADMIN_SESSION_SECRET are not all set — ' +
        'the admin is locked. Copy .env.example to .env and run `npm run admin:password`.',
    );
  }

  // One shared promise: concurrent first requests must not seed twice.
  let ready = null;
  const ensureSeeded = () => {
    ready ??= (async () => {
      if (!(await storage.get(PUBLISHED_KEY))) {
        log('[content] no content found — importing src/assets (one-off, ~1-2 min)…');
        await seed({ storage, projectRoot, log: (m) => log(`[content] ${m}`) });
      }
      // Content stored by an earlier build may predate newer sections.
      await migrate({ storage, log: (m) => log(`[content] ${m}`) });
    })();
    return ready;
  };

  /**
   * Is this request from someone signed in?
   *
   * When credentials are not configured this returns false rather than true:
   * a misconfigured deployment should lock the admin, not open it.
   */
  const signedInAs = (req) => {
    if (!authConfigured) return null;
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    const session = readSession(token, sessionSecret);
    return session?.email ?? null;
  };

  /**
   * Serve a stored file.
   *
   * Streams straight off disk when the store is a local folder, and falls back
   * to reading the bytes through the adapter otherwise — R2 has no file path to
   * stream from. This route is how the admin reaches the originals, which are
   * in the private bucket and have no public URL at all.
   */
  const serveFile = async (res, key, { immutable }) => {
    const ext = key.split('.').pop().toLowerCase();
    const headers = {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      // Variant keys contain the id, width and format, so a given URL's bytes
      // never change — the same header the R2 custom domain will send.
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    };

    const file = storage.pathFor?.(key);
    if (file) {
      let stat;
      try {
        stat = fs.statSync(file);
      } catch {
        send(res, 404, { error: 'Not found' });
        return;
      }
      res.writeHead(200, { ...headers, 'Content-Length': stat.size });
      fs.createReadStream(file).pipe(res);
      return;
    }

    const buf = await storage.get(key);
    if (!buf) {
      send(res, 404, { error: 'Not found' });
      return;
    }
    res.writeHead(200, { ...headers, 'Content-Length': buf.length });
    res.end(buf);
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
        await serveFile(res, key, { immutable: key.startsWith('media/variants/') });
        return true;
      }

      const route = pathname.slice('/api/'.length);

      // ---- sign in / out (the only routes reachable while signed out) ----
      if (route === 'auth/login' && method === 'POST') {
        if (!authConfigured) {
          send(res, 503, { error: 'Sign-in is not configured on this server.' });
          return true;
        }

        const who = req.socket?.remoteAddress ?? 'unknown';
        const gate = throttle.check(who);
        if (!gate.allowed) {
          send(res, 429, {
            error: `Too many attempts. Try again in ${Math.ceil(gate.retryAfterMs / 60000)} minutes.`,
          });
          return true;
        }

        const { email = '', password = '' } = (await readJson(req)) ?? {};
        const emailOk = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
        const passwordOk = verifyPassword(password, adminPasswordHash);

        // One message for both, so the response cannot be used to discover
        // which addresses exist.
        if (!emailOk || !passwordOk) {
          throttle.fail(who);
          send(res, 401, { error: 'That email and password do not match.' });
          return true;
        }

        throttle.succeed(who);
        const token = createSession(adminEmail, sessionSecret);
        send(res, 200, { email: adminEmail }, {
          'Set-Cookie': serializeCookie(SESSION_COOKIE, token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: secureCookies,
          }),
        });
        return true;
      }

      if (route === 'auth/logout' && method === 'POST') {
        send(res, 200, { ok: true }, {
          'Set-Cookie': serializeCookie(SESSION_COOKIE, '', { maxAge: 0, secure: secureCookies }),
        });
        return true;
      }

      if (route === 'auth/me' && method === 'GET') {
        const email = signedInAs(req);
        send(res, 200, { signedIn: Boolean(email), email, configured: authConfigured });
        return true;
      }

      // ---- everything else needs a session -------------------------------
      if (!signedInAs(req)) {
        send(res, 401, { error: 'Not signed in' });
        return true;
      }

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
          // Safe to delete only when neither the draft nor the live site points
          // at it: an image taken out of a draft is still on the published page
          // until that draft is published.
          unusedMediaIds: unusedMediaIds(draft).filter((id) =>
            unusedMediaIds(published).includes(id),
          ),
          warnings: validate(draft),
          storage: storageUsage(draft),
        });
        return true;
      }

      /*
        Delete several images outright.

        Usage is checked against the live site as well as the draft, because the
        files back both: an image dropped from a draft is still on the published
        page until that draft is published, and removing the file would break it.

        `force` deletes anyway and strips the references, so pages end up with
        an empty slot rather than pointing at a file that is gone.
      */
      if (route === 'media/bulk-delete' && method === 'POST') {
        const { ids = [], force = false } = (await readJson(req)) ?? {};
        if (!Array.isArray(ids) || ids.length === 0) {
          send(res, 400, { error: 'No images were selected.' });
          return true;
        }

        const draft = await readDraft(storage);
        const published = await readPublished(storage);

        const known = ids.filter((id) => draft.media[id]);
        const inUse = known
          .map((id) => ({
            id,
            filename: draft.media[id].filename,
            places: [...new Set([...mediaUsage(draft, id), ...mediaUsage(published, id)])],
          }))
          .filter((x) => x.places.length > 0);

        if (inUse.length && !force) {
          send(res, 409, {
            error: `${inUse.length} of the selected images are still used on the site.`,
            inUse,
          });
          return true;
        }

        let freed = 0;
        for (const id of known) {
          const media = draft.media[id];
          freed += media.bytes ?? 0;
          for (const byWidth of Object.values(media.variants ?? {})) {
            for (const v of Object.values(byWidth)) freed += v.bytes ?? 0;
          }
          for (const key of keysForMedia(media)) await storage.delete(key);
        }

        removeMediaReferences(draft, known);
        await writeDraft(storage, draft);

        send(res, 200, {
          deleted: known.length,
          freedBytes: freed,
          clearedFrom: inUse.flatMap((x) => x.places),
          missing: ids.filter((id) => !draft.media[id] && !known.includes(id)).length,
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
        // in the pages. Checked against the live site too: the file backs both.
        const published = await readPublished(storage);
        const places = [...new Set([...mediaUsage(draft, id), ...mediaUsage(published, id)])];
        if (places.length) {
          send(res, 409, {
            error: `This image is still used on the site (${places.join('; ')}). Remove it there first.`,
          });
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
