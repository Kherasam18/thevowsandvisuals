import { focalStyle, largestUrl, srcSetFor } from './media';

/*
  One stored image, served responsively.

  Browsers pick the smallest file that still covers the slot, preferring AVIF
  and falling back to WebP, so a phone never downloads a 3200px master. The
  <picture> wrapper is display:contents, which keeps it out of layout entirely:
  the <img> stays the flex/grid item its parent expects, so adding this to an
  existing page cannot move anything.

  Intrinsic width/height come from the content record, letting the browser
  reserve the right space before the file arrives. Tailwind's preflight sets
  `height: auto` on images, so these attributes fix the aspect ratio without
  fighting the CSS that sizes the element.
*/
export default function SiteImage({
  media,
  className = '',
  sizes = '100vw',
  loading = 'lazy',
  alt,
  style,
  ...rest
}) {
  if (!media) return null;

  const text = alt ?? media.alt ?? '';
  const avif = srcSetFor(media, 'avif');
  const webp = srcSetFor(media, 'webp');
  const fallback = largestUrl(media, 'webp');

  // A blurred stand-in behind the image, so the slot is never a blank hole on a
  // slow connection. Only for JPEGs: behind a transparent PNG it would show through.
  const placeholder =
    media.placeholder && media.format === 'jpeg'
      ? {
          backgroundImage: `url("${media.placeholder}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : undefined;

  return (
    <picture style={{ display: 'contents' }}>
      {avif && <source type="image/avif" srcSet={avif} sizes={sizes} />}
      {webp && <source type="image/webp" srcSet={webp} sizes={sizes} />}
      <img
        src={fallback}
        alt={text}
        width={media.width}
        height={media.height}
        loading={loading}
        decoding="async"
        className={className}
        style={{ ...placeholder, ...focalStyle(media), ...style }}
        {...rest}
      />
    </picture>
  );
}
