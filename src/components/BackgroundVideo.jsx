import { useEffect, useRef, useState } from 'react';

/**
 * Autoplaying, muted, looping background video layered over its poster.
 *
 * The source .mp4 files aren't part of the capture (see public/video/README.md).
 * A <video> pointing at a missing file composites an opaque black box over the
 * poster — and under Vite's dev server the SPA fallback answers 200 with HTML,
 * so a plain onError/onCanPlay guard never fires. Probing the content-type
 * first means the element is only mounted when there is a real video to play,
 * and the poster shows cleanly until then.
 */
export default function BackgroundVideo({
  src,
  poster,
  label,
  className = '',
  children,
  parallax = false,
}) {
  const [hasVideo, setHasVideo] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    fetch(src, { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') || '';
        if (!cancelled && res.ok && type.startsWith('video/')) setHasVideo(true);
      })
      .catch(() => {
        /* no video available — poster stands in */
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  /*
    Parallax — as the band travels through the viewport, translate the video a
    little slower than the page so its content drifts within the (angled) frame.
    Opt-in via the `parallax` prop; the full-screen hero doesn't use it. The
    video is rendered 140% tall (see JSX below) so there's vertical overflow to
    move into without exposing an edge.

    Driven by a rAF loop that runs *only while the band is in view* (gated by an
    IntersectionObserver), reading the band's live position each frame. This is
    deliberately not a `scroll` listener — a page can be scrolled in ways that
    don't emit window scroll events, and reading position per-frame is robust to
    all of them. Disabled for reduced-motion users and when no <video> is mounted
    (poster-only fallback).
  */
  useEffect(() => {
    if (!parallax || !hasVideo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    let raf = 0;
    let visible = false;
    let last = null;

    const apply = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const centerOffset = rect.top + rect.height / 2 - vh / 2;
      const maxShift = rect.height * 0.18; // stay inside the 20% vertical overflow
      const shift = Math.max(-maxShift, Math.min(maxShift, centerOffset * -0.12));
      if (shift !== last) {
        video.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
        last = shift;
      }
    };

    const loop = () => {
      apply();
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(loop);
      },
      { threshold: 0 },
    );

    io.observe(container);
    apply(); // position correctly on mount, before the first frame runs

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [parallax, hasVideo]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-cover bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: `url(${poster})` }}
    >
      {hasVideo && (
        <video
          ref={videoRef}
          className={
            parallax
              ? 'absolute left-0 w-full object-cover'
              : 'absolute inset-0 h-full w-full object-cover'
          }
          style={parallax ? { top: '-20%', height: '140%', willChange: 'transform' } : undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label={label}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}

      {children}
    </div>
  );
}
