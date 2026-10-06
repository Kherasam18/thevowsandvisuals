import fs from 'node:fs/promises';
import path from 'node:path';
import { createR2Storage } from './storage-r2.js';

/**
 * Picks the store from the environment.
 *
 * R2 when it is fully configured, the local folder otherwise. Half-configured
 * counts as not configured: falling back silently with, say, a missing secret
 * would write to the wrong place without anyone noticing.
 */
export function createStorageFromEnv(env, { dataDir }) {
  const r2 = {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    publicBucket: env.R2_BUCKET,
    privateBucket: env.R2_BUCKET_ORIGINALS,
  };

  const given = ['accountId', 'accessKeyId', 'secretAccessKey', 'publicBucket'].filter((k) => r2[k]);

  if (given.length === 4) {
    return { storage: createR2Storage(r2), kind: 'r2', detail: r2.publicBucket };
  }
  if (given.length > 0) {
    throw new Error(
      `R2 is only half configured (${given.length} of 4 values set). ` +
        'Set all of R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET, or none of them.',
    );
  }
  return { storage: createFsStorage(dataDir), kind: 'local', detail: dataDir };
}

/**
 * Object storage, modelled on the subset of the R2 API this project uses.
 *
 * Everything the admin writes goes through here, so swapping this one module
 * for an R2 binding is the whole of the migration. That is why the methods are
 * key/value over flat string keys ("media/originals/img_x.jpg") rather than
 * paths — R2 has no directories, and code that assumes them would not port.
 *
 * Keys are validated rather than trusted: they arrive from HTTP routes, and on
 * a filesystem (unlike R2) "../" would escape the data directory.
 */
export function createFsStorage(rootDir) {
  const resolve = (key) => {
    if (typeof key !== 'string' || key.length === 0) throw new Error('storage: empty key');
    if (key.includes('\0')) throw new Error('storage: invalid key');

    // Normalise to POSIX-style, then verify the result stays inside rootDir.
    const full = path.resolve(rootDir, key.replace(/\\/g, '/'));
    const rel = path.relative(rootDir, full);
    if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`storage: key escapes root: ${key}`);
    return full;
  };

  return {
    /** Raw bytes, or null when absent — mirrors R2's null-on-miss. */
    async get(key) {
      try {
        return await fs.readFile(resolve(key));
      } catch (err) {
        if (err.code === 'ENOENT') return null;
        throw err;
      }
    },

    async getText(key) {
      const buf = await this.get(key);
      return buf === null ? null : buf.toString('utf8');
    },

    async getJson(key) {
      const text = await this.getText(key);
      if (text === null) return null;
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`storage: ${key} is not valid JSON`);
      }
    },

    async put(key, body) {
      const full = resolve(key);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, body);
    },

    async putJson(key, value) {
      await this.put(key, JSON.stringify(value, null, 2));
    },

    async delete(key) {
      try {
        await fs.unlink(resolve(key));
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    },

    /** Keys under a prefix, sorted. R2 returns these flat, so this does too. */
    async list(prefix = '') {
      const base = resolve(prefix);
      const walk = async (dir) => {
        let entries;
        try {
          entries = await fs.readdir(dir, { withFileTypes: true });
        } catch (err) {
          if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return [];
          throw err;
        }
        const out = await Promise.all(
          entries.map((e) => {
            const full = path.join(dir, e.name);
            return e.isDirectory() ? walk(full) : [path.relative(rootDir, full).replace(/\\/g, '/')];
          }),
        );
        return out.flat();
      };
      return (await walk(base)).sort();
    },

    /** Local-only: absolute path, for streaming a file off disk. */
    pathFor(key) {
      return resolve(key);
    },
  };
}
