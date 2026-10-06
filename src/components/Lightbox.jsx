import { useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import SiteImage from '../content/SiteImage';

/**
 * Fullscreen image viewer for the Galleries grid.
 * Matches the Wix Pro Gallery viewer seen in Galleries.mp4: white backdrop,
 * close at top-right, expand at top-left, chevrons at the vertical centre,
 * image contained rather than cropped. Wraps around at both ends.
 *
 * `images` are media records. This is the one place that asks for the full
 * ladder — it is the only view where a photo fills a 4K screen.
 */
export default function Lightbox({ images, index, onClose, onNavigate }) {
  const open = index !== null && index >= 0;

  const prev = useCallback(
    () => onNavigate((index - 1 + images.length) % images.length),
    [index, images.length, onNavigate]
  );
  const next = useCallback(
    () => onNavigate((index + 1) % images.length),
    [index, images.length, onNavigate]
  );

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, prev, next]);

  if (!open) return null;

  const media = images[index];
  if (!media) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Expand"
        onClick={(e) => {
          e.stopPropagation();
          const el = document.getElementById('lightbox-image');
          if (el?.requestFullscreen) el.requestFullscreen();
        }}
        className="absolute left-5 top-5 z-10 p-2 text-black/70 transition-colors hover:text-black"
      >
        <Maximize2 size={20} strokeWidth={1.25} />
      </button>

      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-5 top-5 z-10 p-2 text-black/70 transition-colors hover:text-black"
      >
        <X size={22} strokeWidth={1.25} />
      </button>

      <button
        type="button"
        aria-label="Previous image"
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 p-3 text-black/70 transition-colors hover:text-black"
      >
        <ChevronLeft size={30} strokeWidth={1.25} />
      </button>

      <button
        type="button"
        aria-label="Next image"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 p-3 text-black/70 transition-colors hover:text-black"
      >
        <ChevronRight size={30} strokeWidth={1.25} />
      </button>

      <SiteImage
        id="lightbox-image"
        key={media.id}
        media={media}
        alt={media.alt || `Gallery image ${index + 1} of ${images.length}`}
        loading="eager"
        sizes="(max-width: 767px) 92vw, 74vw"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[82vh] max-w-[74vw] object-contain"
      />
    </div>
  );
}
