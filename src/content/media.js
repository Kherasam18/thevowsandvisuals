import { MEDIA_BASE } from './ContentProvider';

/*
  URL building for stored media.

  Variant keys carry the id, width and format, so every URL is immutable and
  can be cached forever — changing an image produces a new id, never new bytes
  at an old address.
*/

export const variantUrl = (media, width, format) =>
  `${MEDIA_BASE}/media/variants/${media.id}-${width}.${format}`;

/**
 * The untouched master.
 *
 * Deliberately same-origin rather than on the media domain: originals live in
 * a private bucket and are only reachable through the admin API, which is what
 * keeps full-resolution files from being downloadable by anyone who guesses a
 * key. Only the admin ever links to these.
 */
export const originalUrl = (media) => `/${media.originalKey}`;

/** Widths actually generated for this image, ascending. */
export function widthsFor(media, format = 'webp') {
  const table = media?.variants?.[format];
  if (!table) return [];
  return Object.keys(table)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
}

export function srcSetFor(media, format) {
  return widthsFor(media, format)
    .map((w) => `${variantUrl(media, w, format)} ${w}w`)
    .join(', ');
}

/** Largest available variant — what the <img> falls back to. */
export function largestUrl(media, format = 'webp') {
  const widths = widthsFor(media, format);
  if (!widths.length) return '';
  return variantUrl(media, widths[widths.length - 1], format);
}

/** `object-position` honouring the focal point set in the admin. */
export function focalStyle(media) {
  const { x = 0.5, y = 0.5 } = media?.focal ?? {};
  if (x === 0.5 && y === 0.5) return undefined;
  return { objectPosition: `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%` };
}
