import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

/*
  R2 storage, behind the same interface as the local filesystem adapter.

  Two buckets, because a public R2 bucket is public in its entirety: there is
  no way to expose the display copies over a custom domain while keeping
  everything else unreachable within one bucket.

    public   media/variants/*, content/published.json
    private  media/originals/*, content/draft.json, content/versions/*

  Public is an allow-list, not a deny-list. The masters are full-resolution
  files a studio sells, and the draft is unpublished work — both would be
  readable by anyone who guessed the key if the default were the other way
  round, and a new kind of object added later would silently be exposed.
*/

/** The only things the media domain is allowed to serve. */
export function isPublicKey(key) {
  return key.startsWith('media/variants/') || key === 'content/published.json';
}

const MIME = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  tif: 'image/tiff',
  json: 'application/json; charset=utf-8',
};

const contentTypeFor = (key) => MIME[key.split('.').pop()?.toLowerCase()] ?? 'application/octet-stream';

/**
 * Cache headers per kind of object.
 *
 * Variant keys carry the id, width and format, so those bytes never change and
 * can be cached forever. The content document changes on every publish and must
 * not be, or the site would keep serving an old version.
 */
const cacheControlFor = (key) =>
  key.startsWith('media/variants/')
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=0, must-revalidate';

const streamToBuffer = async (body) => {
  if (!body) return null;
  if (typeof body.transformToByteArray === 'function') {
    return Buffer.from(await body.transformToByteArray());
  }
  const chunks = [];
  for await (const chunk of body) chunks.push(chunk);
  return Buffer.concat(chunks);
};

export function createR2Storage({ accountId, accessKeyId, secretAccessKey, publicBucket, privateBucket }) {
  if (!accountId || !accessKeyId || !secretAccessKey || !publicBucket) {
    throw new Error('R2 storage needs accountId, accessKeyId, secretAccessKey and publicBucket.');
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const bucketFor = (key) => (isPublicKey(key) ? publicBucket : (privateBucket ?? publicBucket));

  const assertKey = (key) => {
    if (typeof key !== 'string' || !key || key.includes('\0')) throw new Error('storage: invalid key');
    return key.replace(/\\/g, '/');
  };

  const storage = {
    async get(rawKey) {
      const key = assertKey(rawKey);
      try {
        const out = await client.send(new GetObjectCommand({ Bucket: bucketFor(key), Key: key }));
        return await streamToBuffer(out.Body);
      } catch (err) {
        // R2 reports a miss as NoSuchKey/404; anything else is a real failure.
        if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) return null;
        throw err;
      }
    },

    async getText(key) {
      const buf = await storage.get(key);
      return buf === null ? null : buf.toString('utf8');
    },

    async getJson(key) {
      const text = await storage.getText(key);
      if (text === null) return null;
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`storage: ${key} is not valid JSON`);
      }
    },

    async put(rawKey, body) {
      const key = assertKey(rawKey);
      await client.send(
        new PutObjectCommand({
          Bucket: bucketFor(key),
          Key: key,
          Body: body,
          ContentType: contentTypeFor(key),
          CacheControl: cacheControlFor(key),
        }),
      );
    },

    async putJson(key, value) {
      await storage.put(key, JSON.stringify(value, null, 2));
    },

    async delete(rawKey) {
      const key = assertKey(rawKey);
      // R2 treats deleting an absent key as success, which is what we want.
      await client.send(new DeleteObjectCommand({ Bucket: bucketFor(key), Key: key }));
    },

    async list(prefix = '') {
      const keys = [];
      // A prefix can span both buckets — "content/" holds the published
      // document in one and the draft and history in the other — so ask both.
      const buckets = new Set([publicBucket, privateBucket ?? publicBucket]);

      for (const Bucket of buckets) {
        let ContinuationToken;
        do {
          const page = await client.send(
            new ListObjectsV2Command({ Bucket, Prefix: prefix, ContinuationToken }),
          );
          for (const obj of page.Contents ?? []) keys.push(obj.Key);
          ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
        } while (ContinuationToken);
      }

      return [...new Set(keys)].sort();
    },

    /** Local-only concept; nothing streams off disk here. */
    pathFor() {
      return null;
    },
  };

  return storage;
}
