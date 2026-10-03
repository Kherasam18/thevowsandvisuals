import { useEffect, useRef } from 'react';
import animateScrollTo from '../lib/animateScrollTo';
import SiteImage from '../content/SiteImage';

const AUTOPLAY_MS = 5000;

/** How long one testimonial takes to slide past. A full-width slide reads
    better a touch slower than the narrower story cards. */
const SLIDE_MS = 1400;

/**
 * "Client PRAISE" slider — paired portraits, the couple's name, then the quote,
 * with arrows centred beneath.
 *
 * Uses the same mechanism as StoriesCarousel so both sections slide alike: a
 * snap-scrolling track rather than a swap, with the list rendered twice so the
 * run wraps endlessly. Once the scroll passes the end of the first copy we
 * subtract exactly one copy's width with no animation, and because copy two is
 * identical the seam is invisible. Autoplay yields to reduced-motion
 * preferences, pauses under the pointer, and only runs while on screen.
 */
export default function TestimonialCarousel({ items }) {
  const trackRef = useRef(null);
  const cancelSlide = useRef(null);
  const loop = [...items, ...items];

  const stepWidth = () => {
    const track = trackRef.current;
    const slide = track?.firstElementChild;
    if (!track || !slide) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return slide.getBoundingClientRect().width + gap;
  };

  /** Distance from the first slide to its duplicate — one full cycle. */
  const copyWidth = () => {
    const track = trackRef.current;
    const twin = track?.children[items.length];
    if (!track || !twin) return 0;
    return twin.offsetLeft - track.children[0].offsetLeft;
  };

  /* The track scrolls smoothly by default, which would animate plain scrollLeft
     assignments too — the wrap has to opt out or it reads as a rewind. */
  const jumpTo = (left) => {
    const track = trackRef.current;
    if (!track) return;
    const previous = track.style.scrollBehavior;
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = left;
    track.style.scrollBehavior = previous;
  };

  const scrollBySlide = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const copy = copyWidth();
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
        if (!hovered) scrollBySlide(1);
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
    <div className="flex flex-col items-center">
      <ul
        ref={trackRef}
        className="hide-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {loop.map((item, i) => (
          <li
            key={`${item.name}-${i}`}
            aria-hidden={i >= items.length ? 'true' : undefined}
            className="flex w-full shrink-0 snap-start flex-col items-center"
          >
            <div className="flex w-full max-w-[36rem] justify-center gap-[19px] md:gap-[1.2vw]">
              {item.media.map((media, slot) => (
                <SiteImage
                  key={media?.id ?? slot}
                  media={media}
                  alt=""
                  aria-hidden="true"
                  sizes="(max-width: 767px) 46vw, 18rem"
                  /* w-1/2 + gap overflows the row; subtract the gap so the pair fits. */
                  className="aspect-[3/4] w-[calc((100%-19px)/2)] object-cover md:w-1/2"
                />
              ))}
            </div>

            <h3 className="mt-[7vw] font-display-light text-[29px] font-light uppercase tracking-[0.02em] text-ink md:mt-[2vw] md:font-serif md:text-[calc(22*var(--sf)/1600)] md:font-normal md:tracking-[0.16em]">
              {item.name}
            </h3>

            <p className="mt-[3vw] w-full max-w-[56ch] text-left font-serif text-[14.5px] leading-[1.75] text-ink md:mt-[1.2vw] md:text-center md:text-[calc(18.5*var(--sf)/1600)]">
              {item.quote}
            </p>
          </li>
        ))}
      </ul>

      {/* The track is now one uniform height (tallest quote), so shorter
          testimonials carry their own slack above the arrows. */}
      <div className="mt-[9vw] flex items-center gap-[11vw] md:mt-[2vw] md:gap-[2.5vw]">
        <button
          type="button"
          onClick={() => scrollBySlide(-1)}
          aria-label="Previous testimonial"
          className="text-ink transition-opacity duration-200 hover:opacity-55"
        >
          <svg viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[17px] w-[48px] md:h-[14px] md:w-[40px]">
            <path d="M40 7H1M1 7L7 1M1 7L7 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scrollBySlide(1)}
          aria-label="Next testimonial"
          className="text-ink transition-opacity duration-200 hover:opacity-55"
        >
          <svg viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[17px] w-[48px] md:h-[14px] md:w-[40px]">
            <path d="M0 7H39M39 7L33 1M39 7L33 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
