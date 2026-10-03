import crypto from 'node:crypto';
import sharp from 'sharp';

/*
  Image processing for the admin.

  The rule this module exists to enforce: the upload is a master and is never
  rewritten. It is stored byte-for-byte and everything on the site is a derived
  copy, so the encoder settings below can change later and be re-run over the
  originals without the client re-uploading anything.

  Settings were measured on this site's own photos (SSIM against the source,
  no resize): WebP q92 ~0.992 and AVIF q75 ~0.996, the latter smaller than the
  source JPEG. q75-class WebP scored ~0.986 and visibly softened edge detail at
  3x, so it is deliberately not used.
*/

/** Widths the site is served at. Never upscaled past the original. */
export const LADDER = [480, 960, 1440, 2048, 3200];

/*
  AVIF's `effort` is a speed/size dial, but it shifts fidelity too, so the pair
  was measured rather than assumed. On a 3266x4898 master:

    q75 effort=4   793 KB   SSIM 0.99612   11.9 s
    q75 effort=2   882 KB   SSIM 0.99464    1.9 s   <- cheaper, visibly worse
    q85 effort=3   939 KB   SSIM 0.99630    2.2 s   <- chosen

  Raising quality while lowering effort buys the speed back without paying for
  it in fidelity: this is marginally *better* than the slow setting and encodes
  5x faster, for 18% more bytes. Storage is the cheap resource here — the
  studio waiting on an upload is not.
*/
const AVIF = { quality: 85, effort: 3, chromaSubsampling: '4:4:4' };
const WEBP = { quality: 92, effort: 4, smartSubsample: false };

/** Formats in the order a <picture> should prefer them. */
export const FORMATS = ['avif', 'webp'];

export function newMediaId() {
  return `img_${crypto.randomBytes(9).toString('hex')}`;
}

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/tiff': 'tif',
};

/**
 * Reads an upload, stores the untouched original, and writes the display
 * ladder beside it.
 *
 * Returns the media record the content model stores: dimensions (so the
 * masonry can lay out before anything downloads), the variant table, and a
 * tiny blurred placeholder to show while the real file arrives.
 */
export async function ingestImage({ storage, buffer, filename }) {
  const probe = sharp(buffer, { failOn: 'none' });
  const meta = await probe.metadata();

  if (!meta.width || !meta.height) throw new Error('Not a readable image');

  // EXIF orientation is applied to every derived copy, so width/height here
  // must be the *displayed* ones — a 90° rotated phone photo reports them
  // the other way round.
  const swapped = meta.orientation >= 5 && meta.orientation <= 8;
  const width = swapped ? meta.height : meta.width;
  const height = swapped ? meta.width : meta.height;

  const id = newMediaId();
  const ext = EXT_BY_TYPE[meta.format ? `image/${meta.format}` : ''] ?? 'bin';
  const originalKey = `media/originals/${id}.${ext}`;

  // Byte-for-byte: this is the master copy.
  await storage.put(originalKey, buffer);

  const widths = LADDER.filter((w) => w < width);
  // Always carry a copy at native size, so small uploads still get a variant
  // and large ones have a full-detail version for the lightbox.
  widths.push(Math.min(width, LADDER[LADDER.length - 1]));

  const sizes = [...new Set(widths)].sort((a, b) => a - b);

  const encode = async (format, w) => {
    const pipeline = sharp(buffer, { failOn: 'none' })
      .rotate() // bake EXIF orientation in; browsers disagree about honouring it
      .resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3', fit: 'inside' })
      // Keep the colour profile so wide-gamut reds and golds survive, but
      // drop EXIF — wedding photos routinely carry GPS coordinates.
      .keepIccProfile();

    const out = format === 'avif' ? pipeline.avif(AVIF) : pipeline.webp(WEBP);
    const { data, info } = await out.toBuffer({ resolveWithObject: true });
    await storage.put(`media/variants/${id}-${w}.${format}`, data);
    return { format, w, record: { bytes: data.length, width: info.width, height: info.height } };
  };

  // All ten encodes at once: libvips runs them off the main thread, so letting
  // them overlap uses every core instead of one. Measured ~4x faster than
  // running the ladder in sequence.
  const encoded = await Promise.all(FORMATS.flatMap((format) => sizes.map((w) => encode(format, w))));

  const variants = Object.fromEntries(FORMATS.map((f) => [f, {}]));
  for (const { format, w, record } of encoded) variants[format][w] = record;

  // ~20px blurred stand-in, inlined into the JSON so it paints with no request.
  const placeholderBuf = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: 20, withoutEnlargement: true })
    .webp({ quality: 45 })
    .toBuffer();

  return {
    id,
    filename,
    width,
    height,
    bytes: buffer.length,
    format: meta.format,
    hasIccProfile: Boolean(meta.icc),
    originalKey,
    variants,
    placeholder: `data:image/webp;base64,${placeholderBuf.toString('base64')}`,
    alt: '',
    focal: { x: 0.5, y: 0.5 },
    uploadedAt: new Date().toISOString(),
  };
}

/** Every stored key for a media item, for deletion. */
export function keysForMedia(media) {
  const keys = [media.originalKey];
  for (const [format, byWidth] of Object.entries(media.variants ?? {})) {
    for (const w of Object.keys(byWidth)) keys.push(`media/variants/${media.id}-${w}.${format}`);
  }
  return keys.filter(Boolean);
}
