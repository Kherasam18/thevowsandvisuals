import { useState } from 'react';

/**
 * "Client PRAISE" slider. One testimonial at a time — paired portraits, the
 * couple's name, the quote, then arrows centred beneath.
 */
export default function TestimonialCarousel({ items }) {
  const [index, setIndex] = useState(0);
  const active = items[index];

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  return (
    <div className="flex flex-col items-center">
      <div key={active.name} className="flex w-full max-w-[36rem] justify-center gap-4 md:gap-[1.2vw]">
        <img
          src={active.images[0]}
          alt=""
          aria-hidden="true"
          className="aspect-[3/4] w-1/2 object-cover"
        />
        <img
          src={active.images[1]}
          alt=""
          aria-hidden="true"
          className="aspect-[3/4] w-1/2 object-cover"
        />
      </div>

      <h3 className="mt-[5vw] font-serif text-[17px] uppercase tracking-[0.16em] text-ink md:mt-[2vw] md:text-[calc(22*var(--sf)/1600)]">
        {active.name}
      </h3>

      <p
        aria-live="polite"
        className="mt-[3vw] max-w-[56ch] text-center font-serif text-[12.5px] leading-[1.75] text-ink md:mt-[1.2vw] md:text-[calc(18.5*var(--sf)/1600)]"
      >
        {active.quote}
      </p>

      <div className="mt-[6vw] flex items-center gap-[9vw] md:mt-[2vw] md:gap-[2.5vw]">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous testimonial"
          className="text-ink transition-opacity duration-200 hover:opacity-55"
        >
          <svg width="40" height="14" viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 7H1M1 7L7 1M1 7L7 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next testimonial"
          className="text-ink transition-opacity duration-200 hover:opacity-55"
        >
          <svg width="40" height="14" viewBox="0 0 40 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 7H39M39 7L33 1M39 7L33 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
