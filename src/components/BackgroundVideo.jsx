import { useEffect, useRef, useState } from 'react';

/**
 * Autoplaying, muted, looping background video layered over its poster.
 *
 * A <video> pointing at a missing file composites an opaque black box over the
 * poster, and a same-origin miss is answered by the single-page fallback with
 * 200 and HTML, so onError never fires. Probing the content-type first means
 * the element is only mounted when there is really a video, and the poster
 * shows cleanly until then.
 *
 * That probe is deliberately limited to same-origin sources. `fetch` obeys CORS
 * where a <video> element does not, so probing a video on the media domain made
 * playback depend on CORS headers surviving the CDN cache — which they did not:
 * a copy cached from a request carrying no Origin was replayed to browsers
 * without one, and the hero silently fell back to its poster. A cross-origin
 * source is mounted directly and left to the element's own error handling.
 */
const isSameOrigin = (src) => {
  if (typeof window === 'undefined') return true;
  try {
    return new URL(src, window.location.href).origin === window.location.origin;
  } catch {
    return true; // not a parsable URL: treat as a local path
  }
};
export default function BackgroundVideo({
  src,
  poster,
  label,
  className = '',
  children,
  fixedBackdrop = false,
}) {
  // A cross-origin source needs no probe, so it starts mounted.
  const [hasVideo, setHasVideo] = useState(() => Boolean(src) && !isSameOrigin(src));
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setHasVideo(false);
      return undefined;
    }

    if (!isSameOrigin(src)) {
      setHasVideo(true);
      return undefined;
    }

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
    Fixed backdrop — the footage holds still in the viewport while the band's
    angled window travels across it, so scrolling wipes the frame open rather
    than dragging the picture along. Opt-in via `fixedBackdrop`; the full-screen
    hero doesn't use it.

    The video is sized to the viewport and shifted back by the band's own offset
    (`-rect.top`), which parks its box at the top of the screen no matter where
    the band has scrolled to — the same result as `position: fixed`, but driven
    by a transform so it is unaffected by the containing-block and clipping rules
    that make fixed descendants unreliable inside a clip-path.

    A rAF loop reads the band's live position each frame while it is in view
    (gated by an IntersectionObserver). This is deliberately not a `scroll`
    listener — a page can be scrolled in ways that emit no scroll events, and
    reading position per-frame is robust to all of them. The sizing is applied
    here rather than in the JSX so that when this effect doesn't run (reduced
    motion, or poster-only), the video keeps its ordinary full-cover layout.
  */
  useEffect(() => {
    if (!fixedBackdrop || !hasVideo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    video.style.top = '0';
    video.style.bottom = 'auto';
    video.style.willChange = 'transform';

    let raf = 0;
    let visible = false;
    let lastY = null;
    let lastHeight = null;

    const apply = () => {
      // Measured rather than 100vh: mobile browsers resize the viewport as the
      // URL bar hides, and vh units would reflow the video mid-scroll.
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (vh !== lastHeight) {
        video.style.height = `${vh}px`;
        lastHeight = vh;
      }

      const y = -container.getBoundingClientRect().top;
      if (y !== lastY) {
        video.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
        lastY = y;
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
    apply(); // park it correctly on mount, before the first frame runs

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      video.style.transform = '';
      video.style.height = '';
      video.style.top = '';
      video.style.bottom = '';
      video.style.willChange = '';
    };
  }, [fixedBackdrop, hasVideo]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-cover bg-center bg-no-repeat ${
        /* Pins the poster the same way, so the fallback matches before the
           video mounts — background-attachment does natively for an image what
           the effect above does for the <video>. */
        fixedBackdrop ? 'bg-fixed' : ''
      } ${className}`}
      style={{ backgroundImage: `url(${poster})` }}
    >
      {hasVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
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
