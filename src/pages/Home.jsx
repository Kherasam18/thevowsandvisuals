import { useMemo } from 'react';
import Navbar from '../components/Navbar';
import BackgroundVideo from '../components/BackgroundVideo';
import Button from '../components/Button';
import YouTubeEmbed from '../components/YouTubeEmbed';
import StoriesCarousel from '../components/StoriesCarousel';
import TestimonialCarousel from '../components/TestimonialCarousel';
import SiteImage from '../content/SiteImage';
import { useContent } from '../content/ContentProvider';
import { largestUrl } from '../content/media';

import markScript from '../assets/brand/mark-script.png';

/*
  Layout for the three pillars, keyed to the content record.

  Measured off Home.mp4 at 1920px: the centre image is ~810px wide against
  ~476px for the outer two (roughly 1.7x), it sits higher and runs lower, and
  its label is about twice the size. The labels overlap the images rather than
  sitting beneath them. Only the photo behind each one is editable.
*/
const PILLAR_STYLE = {
  vibrant: { offset: 'mt-[7vw] md:mt-[9vw]', text: 'text-[11px] sm:text-[calc(59*var(--sf)/1600)]' },
  timeless: { offset: 'mt-0 md:mt-0', text: 'text-[20px] sm:text-[calc(118*var(--sf)/1600)]' },
  authentic: { offset: 'mt-[9vw] md:mt-[11vw]', text: 'text-[11px] sm:text-[calc(59*var(--sf)/1600)]' },
};

export default function Home() {
  const content = useContent();

  const view = useMemo(() => {
    if (!content) return null;
    const { media, home } = content;
    const pick = (id) => media[id] ?? null;

    return {
      heroPoster: pick(home.heroPosterId),
      heroVideoSrc: home.heroVideoSrc,
      grid: home.gridIds.map(pick).filter(Boolean),
      pillars: home.pillars.map((p) => ({ ...p, ...PILLAR_STYLE[p.key], media: pick(p.mediaId) })),
      // The client's rule: the strip mirrors the Stories page, one card each.
      stories: content.stories
        .map((s) => ({ name: s.name, slug: s.slug, media: pick(s.coverId) ?? pick(s.bannerId) }))
        .filter((s) => s.media),
      reels: content.films.filter((f) => f.showOnHome && f.youtubeId),
      testimonials: content.home.praise.map((p) => ({
        name: p.name,
        quote: p.quote,
        media: [pick(p.mediaIds[0]), pick(p.mediaIds[1])],
      })),
    };
  }, [content]);

  if (!view) return <div className="min-h-screen bg-cream" />;

  return (
    <>
      {/* ---------- Hero: full-viewport background video ---------- */}
      <section className="relative w-full">
        <BackgroundVideo
          src={view.heroVideoSrc}
          poster={view.heroPoster ? largestUrl(view.heroPoster, 'webp') : undefined}
          label="Khalyani & Aseem"
          className="h-screen w-full"
        />
        <Navbar overlay />
      </section>

      {/* ---------- Our Mission ---------- */}
      {/*
        Mobile paddings and gaps are traced off the source screenshot: it sets
        the copy in a narrower column (~9vw side padding), spaces the block far
        more generously, and leaves a deep run-out before the photo grid.
      */}
      <section className="w-full bg-cream px-[9vw] pb-[25vw] pt-[10vw] text-center md:px-[6vw] md:py-[5vw]">
        <h2 className="font-serif text-eyebrow uppercase leading-[1.4] tracking-[0.04em] text-black">
          Our Mission
        </h2>

        <h3 className="mx-auto mt-[4vw] max-w-[24ch] font-display-light text-h1 font-light leading-[1.2] text-ink md:mt-[1.6vw]">
          Where Every Frame
          <br />
          Tells a Love Story That
          <br />
          Lasts Forever
        </h3>

        <img
          src={markScript}
          alt=""
          aria-hidden="true"
          className="mx-auto mt-[7vw] h-[66px] w-auto md:mt-[1.8vw] md:h-[3.4vw] md:min-h-[34px]"
        />

        {/* A touch larger than the eyebrow token, which the source sizes separately. */}
        <p className="mx-auto mt-[5.5vw] max-w-[70ch] font-serif text-[16px] leading-[1.5] tracking-[0.08em] text-ink md:mt-[2vw] md:text-eyebrow">
          Through our lenses, we step beyond these limitations, honing in on the emotions that define
          your story.
          <br />
          We capture the essence of who you are, creating memories that go beyond labels and speak to
          the heart.
        </p>
      </section>

      {/* ---------- Photo grid (5 across) ---------- */}
      <section className="w-full bg-cream">
        {/* Source shows 3 across on a phone, not 2. */}
        <ul className="grid grid-cols-3 gap-[4px] md:grid-cols-5">
          {view.grid.map((media, i) => (
            <li key={media.id} className="overflow-hidden">
              <SiteImage
                media={media}
                loading={i < 5 ? 'eager' : 'lazy'}
                sizes="(max-width: 767px) 33vw, 20vw"
                className="aspect-square w-full object-cover transition-transform duration-[700ms] ease-out hover:scale-[0.97]"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Vibrant / Timeless / Authentic ---------- */}
      <section className="w-full bg-cream px-[2.5vw] py-[10vw]">
        {/* All three sit side by side at every width, as in the source. */}
        <ul className="grid grid-cols-[1fr_1.4fr_1fr] items-start gap-[1.6vw]">
          {view.pillars.map((pillar) => (
            <li key={pillar.key} className={`pillar-desat relative ${pillar.offset}`}>
              <SiteImage
                media={pillar.media}
                alt=""
                sizes="(max-width: 767px) 40vw, 30vw"
                className="aspect-[3/4] w-full object-cover"
              />
              <span
                className={`pointer-events-none absolute inset-x-0 bottom-[15%] text-center font-gloock leading-none text-white ${pillar.text}`}
              >
                {pillar.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- The Stories ---------- */}
      {/*
        Mobile reflows this section: heading, then the "Dreams painted…" line,
        then the carousel, then a centred button — and the hairline + tagline
        drop out entirely. `contents` at phone widths hoists the bottom row's
        two children up so the section's flex `order` can interleave them with
        the carousel; at md the row re-forms and every order resets.
      */}
      {/* Mobile: the carousel runs closer to the edge than the copy, so the
          section padding is shallow and the text blocks carry their own inset. */}
      <section className="flex w-full flex-col bg-band px-[3.5vw] py-[9vw] md:px-[9vw] md:py-[5.5vw]">
        <div className="order-1 flex items-baseline gap-[1.8vw] px-[2.8vw] md:order-none md:mb-[1.8vw] md:px-[2vw]">
          {/* Mobile borrows the mission headline's lighter display face: the
              source sets both in one high-contrast light serif, where Playfair
              at 400 reads heavier and wider. Desktop keeps its current face. */}
          <h2 className="shrink-0 font-display-light text-[37px] font-light leading-[1.2] text-black md:font-display md:text-[calc(50*var(--sf)/1600)] md:font-normal">
            <em className="italic">The</em> STORIES
          </h2>
          <span aria-hidden="true" className="hidden h-px flex-1 bg-ink/55 md:block" />
          <p className="hidden shrink-0 font-serif capitalize leading-[1.4] text-black md:block md:text-[calc(26*var(--sf)/1600)]">
            Where Every Frame Tells Infinite Stories
          </p>
        </div>

        <div className="order-3 md:order-none">
          <StoriesCarousel items={view.stories} />
        </div>

        <div className="contents md:mt-[2.6vw] md:flex md:flex-row md:items-end md:justify-between md:gap-[2vw] md:px-[2vw]">
          <p className="order-2 mb-[7.5vw] mt-[7.5vw] px-[2.8vw] font-serif text-[15px] capitalize leading-[1.6] tracking-[0.1em] text-black md:order-none md:mb-0 md:mt-0 md:max-w-[46ch] md:px-0 md:tracking-normal md:text-[calc(19*var(--sf)/1600)]">
            Dreams painted in the sky, hopes reflected in the stars. We frame them, making wishes last
            forever.
          </p>
          <Button
            to="/stories"
            aria-label="Explore All"
            className="order-4 mt-[10vw] self-center tracking-[0.1em] md:order-none md:mt-0 md:self-auto md:tracking-normal"
          >
            Explore All
          </Button>
        </div>
      </section >

      {/* ---------- Cinematic Journeys ---------- */}
      < section className="w-full bg-cream px-[6vw] pb-[9vw] pt-[5vw] text-center md:pb-[3vw]" >
        {/* Mobile takes the lighter display face used by the other headings;
            the source also sets "Journeys" upright there, not italic. */}
        <h2 className="font-display-light text-hero font-light uppercase leading-[1.3] text-black md:font-display md:font-normal">
          Cinematic <span className="normal-case md:italic">Journeys</span>
        </h2>
      </section >

      {/* ---------- Video band with angled edges ---------- */}
      < BackgroundVideo
        src={view.heroVideoSrc}
        poster={view.heroPoster ? largestUrl(view.heroPoster, 'webp') : undefined}
        label="Khalyani & Aseem"
        fixedBackdrop
        /* 57vw is far below the floor on a phone, so the mobile band is set by
           its min-height — traced at ~435px against the source. */
        className="clip-angled h-[57vw] min-h-[435px] w-full md:min-h-[260px]"
      >
        <p className="absolute bottom-[4.6vw] right-[4vw] font-serif text-lead capitalize leading-[1.4] text-white">
          Capturing Dreams, Freezing Moments
        </p>
      </BackgroundVideo >

      {/* ---------- Four reels ---------- */}
      < section className="w-full bg-cream px-[6vw] pb-[4vw] pt-[21vw] md:py-[4vw]" >
        <ul className="grid grid-cols-1 gap-[3vw] md:grid-cols-2">
          {view.reels.map((film) => (
            <li key={film.id}>
              <YouTubeEmbed id={film.youtubeId} title={film.title} />
            </li>
          ))}
        </ul>

        <div className="mt-[2.6vw] flex justify-center">
          <Button to="/films" aria-label="Explore All Wedding Films">
            Explore All Wedding Films
          </Button>
        </div>
      </section>

      {/* ---------- Client Praise ---------- */}
      {/*
        Desktop tucks the carousel up under the heading (-mt); the source does
        the opposite on a phone, leaving a deep gap below it. Mobile also uses
        the lighter display face and a wider side inset, matching the source.
      */}
      <section className="w-full bg-band px-[9.2vw] pb-[5vw] pt-[3vw] md:px-[6vw]">
        <h2 className="relative z-10 text-center font-display-light text-praise font-light leading-[1.1] text-ink md:font-display md:font-normal">
          <span className="italic md:font-serif">Client</span> PRAISE
        </h2>

        <div className="relative z-20 mt-[14vw] md:-mt-[2vw]">
          <TestimonialCarousel items={view.testimonials} />
        </div>
      </section>
    </>
  );
}
