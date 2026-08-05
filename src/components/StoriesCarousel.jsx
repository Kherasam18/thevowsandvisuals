import { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Horizontal story slider configured to show exactly 3 cards visible at a time on desktop.
 */
export default function StoriesCarousel({ items }) {
  const trackRef = useRef(null);

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild;
    if (!card) return;
    const gap = window.innerWidth * 0.018;
    const step = card.getBoundingClientRect().width + gap;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full px-[3vw]">
      <ul
        ref={trackRef}
        className="hide-scrollbar flex snap-x snap-mandatory gap-[2.4vw] overflow-x-auto scroll-smooth py-2"
      >
        {items.map((item) => (
          <li
            key={item.name}
            className="group relative w-[85%] shrink-0 snap-start overflow-hidden sm:w-[48%] md:w-[calc((107%-10vw)/3)]"
          >
            <img
              src={item.image}
              alt={item.name}
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

      {/* Navigation buttons */}
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label="Previous stories"
        className="absolute left-[-3vw] top-1/2 z-10 flex h-[2.8vw] min-h-[38px] w-[2.8vw] min-w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-all duration-200 hover:scale-105 hover:bg-white"
      >
        <ArrowLeft size={20} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label="Next stories"
        className="absolute right-[-2.5vw] top-1/2 z-10 flex h-[2.8vw] min-h-[38px] w-[2.8vw] min-w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-all duration-200 hover:scale-105 hover:bg-white"
      >
        <ArrowRight size={20} strokeWidth={1.5} />
      </button>
    </div>
  );
}
