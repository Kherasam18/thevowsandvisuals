import { useState } from 'react';
import SiteImage from '../content/SiteImage';

/**
 * "Where we shoot" — an index of destinations rather than a gallery of them.
 *
 * On a wide screen the names are the interface: running down them swaps the
 * photograph beside the list, so the section reads as one editorial spread
 * instead of a row of equal cards. The site already leans on carousels in three
 * places, and another one here would have read as more of the same.
 *
 * Hover cannot carry this on a phone, so the layout changes rather than
 * degrades: each destination becomes its own captioned photograph.
 */
export default function DestinationList({ places, media }) {
  const [active, setActive] = useState(0);
  if (!places.length) return null;

  return (
    <>
      {/* Wide screens: names on the left, one photograph on the right. */}
      <div className="hidden items-center gap-[5vw] md:grid md:grid-cols-[1.1fr_1fr]">
        <ul className="flex flex-col">
          {places.map((place, i) => {
            const on = i === active;
            return (
              <li key={place.id} className="border-b border-ink/15 first:border-t">
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-current={on || undefined}
                  className="group block w-full py-[1.6vw] text-left"
                >
                  <span
                    className={`block font-display text-h2 leading-[1.1] transition-colors duration-500 ${
                      on ? 'text-ink' : 'text-ink/30'
                    }`}
                  >
                    {place.name}
                  </span>
                  {place.note && (
                    <span
                      className={`mt-[0.4vw] block max-w-[42ch] font-serif text-copy leading-[1.5] transition-all duration-500 ${
                        on ? 'text-ink/70 opacity-100' : 'text-ink/40 opacity-60'
                      }`}
                    >
                      {place.note}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* All images stay mounted and cross-fade, so switching never flashes
            an empty frame while a file loads. */}
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          {places.map((place, i) => (
            <SiteImage
              key={place.id}
              media={media[place.mediaId]}
              alt={place.name}
              sizes="45vw"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
                i === active ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Phones: one captioned photograph per destination. */}
      <ul className="flex flex-col gap-[6vw] md:hidden">
        {places.map((place) => (
          <li key={place.id} className="relative overflow-hidden">
            <SiteImage
              media={media[place.mediaId]}
              alt={place.name}
              sizes="88vw"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-[5vw]">
              <h3 className="font-display text-[26px] leading-[1.1] text-white">{place.name}</h3>
              {place.note && (
                <p className="mt-[1.5vw] font-serif text-[13px] leading-[1.5] text-white/85">
                  {place.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
