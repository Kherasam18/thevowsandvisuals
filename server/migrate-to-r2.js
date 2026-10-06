import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createR2Storage, isPublicKey } from './storage-r2.js';

/*
  Uploads the local .data store into R2.

  Resumable: anything already present with a matching size is skipped, so an
  interrupted run can simply be repeated. Nothing is deleted at either end —
  the local store stays as it is until the migration has been verified.

  Run:
    npm run r2:migrate -- --dry-run     see what would be uploaded
    npm run r2:migrate                  do it
*/

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(projectRoot, '.data');

try {
  process.loadEnvFile(path.join(projectRoot, '.env'));
} catch {
  /* variables may come from the real environment instead */
}

const dryRun = process.argv.includes('--dry-run');
const CONCURRENCY = 8;

const env = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  publicBucket: process.env.R2_BUCKET,
  privateBucket: process.env.R2_BUCKET_ORIGINALS,
};

const missing = Object.entries(env)
  .filter(([k, v]) => !v && k !== 'privateBucket')
  .map(([k]) => k);
if (missing.length) {
  console.error(`Missing in .env: ${missing.join(', ')}`);
  console.error('See .env.example for the names.');
  process.exit(1);
}
if (!env.privateBucket) {
  console.warn('R2_BUCKET_ORIGINALS is not set — originals will go into the PUBLIC bucket.\n');
}

const storage = createR2Storage(env);
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey },
});

/** Every file under .data, as the storage keys they will become. */
const collect = (dir, base = dataDir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collect(full, base);
    return [{ key: path.relative(base, full).replace(/\\/g, '/'), full, size: fs.statSync(full).size }];
  });
};

// Must match the adapter exactly, or the check for "already uploaded" would
// look in the wrong bucket and re-upload everything.
const bucketFor = (key) => (isPublicKey(key) ? env.publicBucket : (env.privateBucket ?? env.publicBucket));

const alreadyThere = async (key, size) => {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucketFor(key), Key: key }));
    return head.ContentLength === size;
  } catch {
    return false;
  }
};

const mb = (n) => `${(n / 1024 ** 2).toFixed(1)} MB`;

const files = collect(dataDir);
if (!files.length) {
  console.error(`Nothing found in ${dataDir}`);
  process.exit(1);
}

const totalBytes = files.reduce((s, f) => s + f.size, 0);
console.log(`${files.length} files, ${mb(totalBytes)} in ${dataDir}`);
console.log(`  public bucket  : ${env.publicBucket}`);
console.log(`  private bucket : ${env.privateBucket ?? '(none — using public)'}`);
console.log(dryRun ? '\nDRY RUN — nothing will be uploaded.\n' : '');

let uploaded = 0;
let skipped = 0;
let failed = 0;
let bytesDone = 0;
let nextIndex = 0;

const worker = async () => {
  while (nextIndex < files.length) {
    const file = files[nextIndex++];
    const n = nextIndex;

    try {
      if (await alreadyThere(file.key, file.size)) {
        skipped += 1;
      } else if (dryRun) {
        uploaded += 1;
      } else {
        await storage.put(file.key, fs.readFileSync(file.full));
        uploaded += 1;
      }
      bytesDone += file.size;
    } catch (err) {
      failed += 1;
      console.error(`  FAILED ${file.key}: ${err.message}`);
    }

    if (n % 50 === 0 || n === files.length) {
      const pct = Math.round((bytesDone / totalBytes) * 100);
      console.log(`  ${n}/${files.length}  ${pct}%  (${uploaded} uploaded, ${skipped} already there)`);
    }
  }
};

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log('');
console.log(dryRun ? 'Would upload:' : 'Done:');
console.log(`  uploaded     : ${uploaded}`);
console.log(`  already there: ${skipped}`);
console.log(`  failed       : ${failed}`);
if (failed) console.log('\nRe-run to retry the failures — finished files are skipped.');
