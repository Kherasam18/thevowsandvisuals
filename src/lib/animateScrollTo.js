/**
 * Scrolls an element horizontally to `left` over `duration`, easing in and out.
 *
 * Native smooth scrolling — `scroll-behavior: smooth` or `behavior: 'smooth'` —
 * runs at a speed the browser chooses and exposes no way to slow it down, so a
 * longer, gentler slide has to be animated by hand.
 *
 * Two things are suspended for the duration:
 *   • scroll snapping, which would otherwise yank the position to the nearest
 *     snap point on every frame and swallow the animation whole;
 *   • the element's own smooth scroll-behavior, so each frame lands exactly
 *     where it is put rather than easing toward it a second time.
 * Both are restored at the end, leaving touch swipes to snap as before.
 *
 * Returns a cancel function. Calling it stops the animation where it stands,
 * which is what a fresh arrow press or a manual swipe needs.
 */
export default function animateScrollTo(element, left, duration = 1200) {
  if (!element) return () => {};

  const start = element.scrollLeft;
  const distance = left - start;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!distance || reducedMotion || duration <= 0) {
    const previousBehavior = element.style.scrollBehavior;
    element.style.scrollBehavior = 'auto';
    element.scrollLeft = left;
    element.style.scrollBehavior = previousBehavior;
    return () => {};
  }

  const previousSnap = element.style.scrollSnapType;
  const previousBehavior = element.style.scrollBehavior;
  element.style.scrollSnapType = 'none';
  element.style.scrollBehavior = 'auto';

  const restore = () => {
    element.style.scrollSnapType = previousSnap;
    element.style.scrollBehavior = previousBehavior;
  };

  // easeInOutCubic — slow at both ends, so the slide settles instead of stopping.
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const startedAt = performance.now();
  let raf = 0;
  let cancelled = false;

  const step = (now) => {
    if (cancelled) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    element.scrollLeft = start + distance * ease(progress);

    if (progress < 1) {
      raf = requestAnimationFrame(step);
    } else {
      raf = 0;
      restore();
    }
  };

  raf = requestAnimationFrame(step);

  return () => {
    if (cancelled) return;
    cancelled = true;
    if (raf) cancelAnimationFrame(raf);
    restore();
  };
}
