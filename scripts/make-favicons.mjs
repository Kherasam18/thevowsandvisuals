import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/*
  Generates the browser tab icons from the brand badge.

  Run by hand when the logo changes, not on every build:
    node scripts/make-favicons.mjs

  The output goes into public/, which Vite copies to the site root untouched.
  They must exist as real files: the single-page-application fallback answers
  any unknown path with the app's HTML, so without them a browser asking for
  /favicon.ico is handed a web page and falls back to the generic globe.

  Why the badge sits on a cream disc: the logo is dark ink on transparency, so
  on a dark browser theme it renders as nothing at all. Giving it its own
  background is what makes it visible to everyone, and a disc rather than a
  square keeps the shape of the mark.
*/

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(projectRoot, 'src/assets/brand/logo-badge.png');
const OUT = path.join(projectRoot, 'public');

const CREAM = { r: 248, g: 247, b: 243 };
const MASTER = 512;

// The badge sits slightly inside the disc, so a thin cream rim separates the
// logo's own ring from whatever is behind it.
const LOGO_SCALE = 0.86;

const circleMask = Buffer.from(
  `<svg width="${MASTER}" height="${MASTER}"><circle cx="${MASTER / 2}" cy="${MASTER / 2}" r="${MASTER / 2}" fill="#fff"/></svg>`,
);

/** The badge centred on a cream disc, transparent outside it. */
const master = await sharp({
  create: { width: MASTER, height: MASTER, channels: 4, background: { ...CREAM, alpha: 1 } },
})
  .composite([
    {
      input: await sharp(SRC)
        .resize(Math.round(MASTER * LOGO_SCALE), Math.round(MASTER * LOGO_SCALE), {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer(),
      gravity: 'center',
    },
    // Applied last so it clips the badge and the backdrop together.
    { input: circleMask, blend: 'dest-in' },
  ])
  .png()
  .toBuffer();

/*
  Apple's home-screen icon is the exception: iOS composites it onto black and
  applies its own rounded corners, so a transparent disc would come out as a
  cream circle floating on a black square. It gets a filled tile instead.
*/
const appleTile = await sharp({
  create: { width: 180, height: 180, channels: 3, background: CREAM },
})
  .composite([{ input: await sharp(SRC).resize(150).png().toBuffer(), gravity: 'center' }])
  .png()
  .toBuffer();

const png = (size) => sharp(master).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/**
 * Packs PNGs into an .ico.
 *
 * sharp cannot write the format, but it is only a small header plus the PNG
 * bytes, which every browser since IE11 accepts inside an icon file.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // 0 means 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette colours
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

fs.mkdirSync(OUT, { recursive: true });

const ico = buildIco([
  { size: 16, data: await png(16) },
  { size: 32, data: await png(32) },
  { size: 48, data: await png(48) },
]);
fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico);

// Google wants at least 48px and a multiple of 48 to show an icon in results.
for (const size of [96, 192, 512]) {
  fs.writeFileSync(path.join(OUT, `favicon-${size}.png`), await png(size));
}
fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), appleTile);

console.log('written to public/:');
for (const f of ['favicon.ico', 'favicon-96.png', 'favicon-192.png', 'favicon-512.png', 'apple-touch-icon.png']) {
  const p = path.join(OUT, f);
  console.log(`  ${f.padEnd(24)} ${Math.round(fs.statSync(p).size / 1024)} KB`);
}
