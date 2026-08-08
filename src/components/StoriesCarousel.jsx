import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import animateScrollTo from '../lib/animateScrollTo';

const AUTOPLAY_MS = 3500;

/** How long one card takes to slide past. Native smooth scrolling is far
    quicker than this and offers no way to stretch it out. */
const SLIDE_MS = 1200;

/**
 * Horizontal story slider — one card at a time on a phone (with the next
 * peeking in), three across on desktop.
 *
 * The run advances on its own and wraps endlessly. Items are rendered twice:
 * once the scroll passes the end of the first copy we subtract exactly one
 * copy's width with no animation, and because copy two is identical the seam is
 * invisible — so "last → first" reads as one continuous cycle rather than a
 * rewind. Autoplay yields to reduced-motion preferences, pauses while the
 * pointer is over the track, and only runs while the track is on screen.
 */
export default function StoriesCarousel({ items }) {
  const trackRef = useRef(null);
  const cancelSlide = useRef(null);
  const loop = [...items, ...items];

  const stepWidth = () => {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!track || !card) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  };

  /** Distance from the first card to its duplicate — one full cycle. */
  const copyWidth = () => {
    const track = trackRef.current;
    const twin = track?.children[items.length];
    if (!track || !twin) return 0;
    return twin.offsetLeft - track.children[0].offsetLeft;
  };

  /*
    The track sets `scroll-behavior: smooth`, which animates plain scrollLeft
    assignments as well — so the wrap has to opt out explicitly, or the jump
    back reads as a visible rewind instead of a seamless cycle.
  */
  const jumpTo = (left) => {
    const track = trackRef.current;
    if (!track) return;
    const previous = track.style.scrollBehavior;
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = left;
    track.style.scrollBehavior = previous;
  };

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const copy = copyWidth();
    // Stepping back from the very start needs runway: hop forward one copy
    // first, so there is always something to scroll back into.
    if (direction < 0 && copy && track.scrollLeft < stepWidth()) jumpTo(track.scrollLeft + copy);

    cancelSlide.current?.(); // drop whatever is still mid-slide
    cancelSlide.current = animateScrollTo(
      track,
      track.scrollLeft + direction * stepWidth(),
      SLIDE_MS,
    );
  };

  // Rewind by one copy once scrolling settles, keeping scrollLeft in range.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let settle = 0;
    const onScroll = () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        const copy = copyWidth();
        if (copy && track.scrollLeft >= copy) jumpTo(track.scrollLeft - copy);
      }, 140);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      clearTimeout(settle);
    };
  }, [items.length]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const track = trackRef.current;
    if (!track) return;

    let timer = 0;
    let hovered = false;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (!hovered) scrollByCard(1);
      }, AUTOPLAY_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = 0;
    };

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), {
      threshold: 0,
    });
    io.observe(track);

    // A finger on the track outranks the animation — let go of it immediately
    // so a swipe is not fighting a slide already in flight.
    const release = () => cancelSlide.current?.();
    track.addEventListener('pointerdown', release);

    const pause = () => {
      hovered = true;
    };
    const resume = () => {
      hovered = false;
    };
    track.addEventListener('pointerenter', pause);
    track.addEventListener('pointerleave', resume);

    return () => {
      io.disconnect();
      stop();
      cancelSlide.current?.();
      track.removeEventListener('pointerdown', release);
      track.removeEventListener('pointerenter', pause);
      track.removeEventListener('pointerleave', resume);
    };
  }, [items.length]);

  return (
    <div className="relative w-full md:px-[3vw]">
      <ul
        ref={trackRef}
        className="hide-scrollbar flex snap-x snap-mandatory gap-[2.4vw] overflow-x-auto scroll-smooth py-2"
      >
        {loop.map((item, i) => (
          <li
            key={`${item.name}-${i}`}
            aria-hidden={i >= items.length ? 'true' : undefined}
            className="group relative w-[78%] shrink-0 snap-start overflow-hidden sm:w-[48%] md:w-[calc((107%-10vw)/3)]"
          >
            <img
              src={item.image}
              alt={i < items.length ? item.name : ''}
              loading="lazy"
              className="aspect-[1/1.45] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
            />

            {/* Hover caption */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-[1.6vw] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
              <span className="font-serif text-[calc(20*var(--sf)/1600)] uppercase tracking-[0.16em] text-white">
                {item.name}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Navigation — the source shows only the forward control on a phone. */}
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label="Previous stories"
        className="absolute left-[1%] top-1/2 z-10 hidden h-[2.8vw] min-h-[38px] w-[2.8vw] min-w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-all duration-200 hover:scale-105 hover:bg-white md:left-[-3vw] md:flex"
      >
        <ArrowLeft size={20} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label="Next stories"
        className="absolute right-[1%] top-1/2 z-10 flex h-[2.8vw] min-h-[38px] w-[2.8vw] min-w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-all duration-200 hover:scale-105 hover:bg-white md:right-[-2.5vw]"
      >
        <ArrowRight size={20} strokeWidth={1.5} />
      </button>
    </div>
  );
}
