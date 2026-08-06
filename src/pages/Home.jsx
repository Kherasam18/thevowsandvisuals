import Navbar from '../components/Navbar';
import BackgroundVideo from '../components/BackgroundVideo';
import Button from '../components/Button';
import YouTubeEmbed from '../components/YouTubeEmbed';
import StoriesCarousel from '../components/StoriesCarousel';
import TestimonialCarousel from '../components/TestimonialCarousel';

import heroPoster from '../assets/home/hero-poster.jpg';
import markScript from '../assets/brand/mark-script.png';
import vibrant from '../assets/home/vibrant.jpg';
import timeless from '../assets/home/timeless.jpg';
import authentic from '../assets/home/authentic.jpg';

import story1 from '../assets/home/story-01-kritasha-akhil.jpg';
import story2 from '../assets/home/story-02-payal-harsh.jpg';
import story3 from '../assets/home/story-03-kiran-sanjeev.jpg';
import story4 from '../assets/home/story-04-pavan-suchi.jpg';
import story5 from '../assets/home/story-05-prithvi-praise.jpg';
import story6 from '../assets/home/story-06-kashish-naman.jpg';

import preetA from '../assets/home/praise-preet-a.jpg';
import preetB from '../assets/home/praise-preet-b.jpg';
import prithviA from '../assets/home/praise-prithvi-a.jpg';
import prithviB from '../assets/home/praise-prithvi-b.jpg';
import poorviA from '../assets/home/praise-poorvi-a.jpg';
import poorviB from '../assets/home/praise-poorvi-b.jpg';

// 15-image grid, ordered by filename to match source DOM order.
const GRID = Object.entries(
  import.meta.glob('../assets/home/grid-*.{jpg,png}', { eager: true, import: 'default' })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src]) => src);

const STORIES = [
  { image: story1, name: 'Kritasha & Akhil' },
  { image: story2, name: 'Payal & Harsh' },
  { image: story3, name: 'Kiran & Sanjeev' },
  { image: story4, name: 'Pavan & Suchi' },
  { image: story5, name: 'Prithvi & Raghavi' },
  { image: story6, name: 'Kashish & Naman' }
];

/*
  Measured off Home.mp4 at 1920px: the centre image is ~810px wide against
  ~476px for the outer two (roughly 1.7x), it sits higher and runs lower, and
  its label is about twice the size. The labels overlap the images rather than
  sitting beneath them.
*/
const PILLARS = [
  {
    image: vibrant,
    label: 'VIBRANT',
    offset: 'mt-[7vw] md:mt-[9vw]',
    text: 'text-[11px] sm:text-[calc(59*var(--sf)/1600)]',
  },
  {
    image: timeless,
    label: 'TIMELESS',
    offset: 'mt-0 md:mt-0',
    text: 'text-[20px] sm:text-[calc(118*var(--sf)/1600)]',
  },
  {
    image: authentic,
    label: 'AUTHENTIC',
    offset: 'mt-[9vw] md:mt-[11vw]',
    text: 'text-[11px] sm:text-[calc(59*var(--sf)/1600)]',
  },
];

/*
  The four Home video ids are NOT in the saved HTML — Wix injected them
  client-side after load, so the <div>s captured empty. Recovered by reading
  the video titles off the YouTube posters in Home.mp4 and matching them to
  the ids saved in Films_files/.
*/
const REELS = [
  { id: 'SQNIM3_y2pg', title: 'Ragini & Nikhil Teaser' },
  { id: 'RwPTps6eATg', title: 'Jas & Poorvi Cinematic Wedding Teaser' },
  { id: '6mH5K-GdnhA', title: 'Nikhil & Rachna' },
  { id: 'jzhG7BCSCKE', title: 'Anirudha & Shuchi' },
];

const TESTIMONIALS = [
  {
    name: 'Preet & Manny',
    images: [preetA, preetB],
    quote:
      "I'm someone who usually dislikes photography and videography, but my experience with this team was exceptional. They're passionate, respectful, and incredibly thorough. The final results speak for themselves-absolutely stunning. Hats off to the entire team!",
  },
  {
    name: 'Prithvi & Raghavi',
    images: [prithviA, prithviB],
    quote:
      'Infinite Memories team, thank you for the incredible work! The photos and videos are absolutely stunning and full of emotion.You captured every moment so beautifully, and we truly felt your passion and warmth throughout. We couldn’t have asked for a better team!',
  },
  {
    name: 'Poorvi & Jass',
    images: [poorviA, poorviB],
    quote:
      'Infinite Memories team were incredible! They captured our wedding beautifully, worked tirelessly, and felt like family throughout. One of the best choices we made.They captured our wedding beautifully, even with limited time for portraits, and created magic through their photos and videos. The wedding film makes us relive the day every time we watch it.',
  },
];

export default function Home() {
  return (
    <>
      {/* ---------- Hero: full-viewport background video ---------- */}
      <section className="relative w-full">
        <BackgroundVideo
          src="/video/hero.mp4"
          poster={heroPoster}
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
          {GRID.map((src, i) => (
            <li key={src} className="overflow-hidden">
              <img
                src={src}
                alt=""
                loading={i < 5 ? 'eager' : 'lazy'}
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
          {PILLARS.map((pillar) => (
            <li key={pillar.label} className={`pillar-desat relative ${pillar.offset}`}>
              <img
                src={pillar.image}
                alt=""
                loading="lazy"
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
          <StoriesCarousel items={STORIES} />
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
      < section className="w-full bg-cream px-[6vw] pb-[2vw] pt-[3vw] text-center" >
        <h2 className="font-display text-hero uppercase leading-[1.1] text-black">
          Cinematic <span className="normal-case italic">Journeys</span>
        </h2>
      </section >

      {/* ---------- Video band with angled edges ---------- */}
      < BackgroundVideo
        src="/video/hero.mp4"
        poster={heroPoster}
        label="Khalyani & Aseem"
        parallax
        className="clip-angled h-[38vw] min-h-[260px] w-full"
      >
        <p className="absolute bottom-[4.6vw] right-[4vw] font-serif text-lead capitalize leading-[1.4] text-white">
          Capturing Dreams, Freezing Moments
        </p>
      </BackgroundVideo >

      {/* ---------- Four reels ---------- */}
      < section className="w-full bg-cream px-[6vw] py-[4vw]" >
        <ul className="grid grid-cols-1 gap-[2vw] md:grid-cols-2">
          {REELS.map((reel) => (
            <li key={reel.id}>
              <YouTubeEmbed id={reel.id} title={reel.title} />
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
      <section className="w-full bg-band px-[6vw] pb-[5vw] pt-[3vw]">
        <h2 className="relative z-10 text-center font-display text-praise leading-[1.1] text-ink">
          <span className="italic font-serif">Client</span> PRAISE
        </h2>

        <div className="relative z-20 -mt-[2vw]">
          <TestimonialCarousel items={TESTIMONIALS} />
        </div>
      </section>
    </>
  );
}
