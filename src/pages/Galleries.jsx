import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import Lightbox from '../components/Lightbox';
import MasonryGrid from '../components/MasonryGrid';
import hero1 from '../assets/galleries/hero-01.jpg';
import hero2 from '../assets/galleries/hero-02.jpg';
import hero3 from '../assets/galleries/hero-03.jpg';

/**
 * Hero slideshow.
 *
 * Each repeater item in the source holds three 1844x781 images: 554-min.jpg
 * (a London-bridge frame, repeated as the item background) plus one distinct
 * banner. The distinct banners are what cycle:
 *   AVI05393-min -> snow mountain, 545-min -> vintage car, HSP_7749 -> confetti
 *
 * The "ICONIC WORK" heading is NOT part of the repeater — it lives in the
 * following section (comp-m8hhmpve) and stays put while the images change.
 * The repeater's own "Iconic/WORK" and "Client/PRAISE" labels are leftover
 * Wix template fields that never render.
 *
 * Galleries.mp4 opens on the vintage car (slide 2), so the source may
 * auto-advance or start at a different index; the arrows are the only
 * navigation actually observed, so this is manual-only.
 */
const SLIDES = [hero1, hero2, hero3];

// 25 masonry images, ordered by filename to match source DOM order.
const GRID = Object.entries(
  import.meta.glob('../assets/galleries/grid-*.jpg', { eager: true, import: 'default' })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src]) => src);

export default function Galleries() {
  const [slide, setSlide] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const prev = () => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setSlide((s) => (s + 1) % SLIDES.length);

  return (
    <>
      {/*
        Mobile reorders the page: the source runs the intro copy and Enquire
        button first and only then the ICONIC WORK title, where desktop laps the
        title over the hero's lower edge. Ordering the flex column swaps those
        two blocks without duplicating the heading into the markup twice.
      */}
      <div className="flex flex-col">
        {/* Hero slideshow */}
        <section className="relative order-1 w-full">
          <div className="relative h-[34vw] min-h-[258px] w-full overflow-hidden md:min-h-[240px]">
            {SLIDES.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                aria-hidden={i !== slide}
                className={
                  'absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ' +
                  (i === slide ? 'opacity-100' : 'opacity-0')
                }
              />
            ))}

            {/* The source shows no slide controls on a phone. */}
            <div className="absolute bottom-[1.4vw] right-[3vw] hidden items-center gap-[3vw] md:flex">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="text-white/90 transition-opacity duration-200 hover:opacity-70"
              >
                <ArrowLeft size={30} strokeWidth={1} />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="text-white/90 transition-opacity duration-200 hover:opacity-70"
              >
                <ArrowRight size={30} strokeWidth={1} />
              </button>
            </div>
          </div>

        </section>

        {/* The source leaves ~32vw above the title on a phone; pulled in to
            sit closer to the Enquire button. */}
        <h1 className="pointer-events-none relative z-10 order-3 mb-[5vw] mt-[22vw] text-center font-display text-[calc(142*var(--sf)/1600)] uppercase leading-[1] text-black md:order-2 md:mb-0 md:-mt-[2vw]">
          Iconic Work
        </h1>

        {/* Intro copy */}
        {/* Narrower gutter on a phone — at 6vw the third heading line wraps,
          where the source keeps it on one. */}
        <section className="order-2 w-full bg-cream px-[4vw] pt-[10vw] md:order-3 md:px-[6vw] md:pt-[5vw]">
          <p className="text-center font-serif text-[19px] uppercase leading-[1.55] tracking-[0.01em] text-ink md:text-[calc(30*var(--sf)/1600)]">
            Step into a world where
            <br />
            love twirls in slow motion,
            <br />
            trapped in the misty haze of time.
          </p>

          <div className="mx-auto mt-[15vw] max-w-[46rem] md:mt-[3.4vw]">
            {/*
            Decorative drop cap — rendered with ::first-letter in the source.
            Tailwind's `first-letter:` variant is the direct equivalent.
          */}
            <p
              /* The source centres this copy on a phone and only ranges it left
                 once the column is wide enough for the ragged edge to read. */
              className="text-center font-serif text-[15px] leading-[1.42] text-ink
              first-letter:float-left first-letter:mr-[0.06em] first-letter:mt-[0.06em]
              first-letter:font-display first-letter:text-[3.9em] first-letter:leading-[0.78]
              md:text-left md:text-[calc(22*var(--sf)/1600)]"
            >
              These pictures? oh, they’re more than just pixels—each grin and teardrop whispers of
              mysteries untold. we wield our cameras like enchanted wands, capturing fleeting moments
              before they vanish into the void. for the couples, the wedding is a whirlwind of joy. for
              us, it’s an endless maze of tiny stories, waiting to be plucked from the air and sealed
              forever.
            </p>

            <div className="mt-[6vw] flex justify-center md:mt-[1.6vw] md:justify-end">
              <Button to="/enquiry" className="h-[47px] w-[244px] md:h-auto md:w-auto">
                Enquire
              </Button>
            </div>
          </div>
        </section>

        {/* Masonry photo wall */}
        <section className="order-4 w-full bg-cream pb-[4vw] pt-[3vw]">
          <div className="px-[10px]">
            <MasonryGrid
              images={GRID}
              renderItem={(src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Open image ${i + 1} of ${GRID.length}`}
                  /* Inset outline: the cell clips overflow on hover, so an outset
                     ring would be cut off. */
                  className="block w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-maroon"
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="w-full transition-transform duration-[600ms] ease-out hover:scale-[1.04]"
                  />
                </button>
              )}
            />
          </div>
        </section>
      </div>

      <Lightbox
        images={GRID}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
