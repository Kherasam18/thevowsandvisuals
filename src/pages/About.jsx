import Button from '../components/Button';
import YouTubeEmbed from '../components/YouTubeEmbed';
import TestimonialCarousel from '../components/TestimonialCarousel';
import DestinationList from '../components/DestinationList';
import SiteImage from '../content/SiteImage';
import { useContent } from '../content/ContentProvider';
import { CONTACT } from '../data/site';

/**
 * About.
 *
 * The one page with no counterpart in the captured source, so it is written
 * rather than reproduced — and the only page where the studio describes itself
 * instead of showing work. Every part of it is editable in the admin.
 */

/** Section headings, set like the rest of the site's. */
function Heading({ lead, children }) {
  return (
    <h2 className="text-center font-display-light text-hero font-light leading-[1.25] text-black md:font-display md:font-normal">
      {lead && <em className="italic">{lead} </em>}
      {children}
    </h2>
  );
}

/**
 * FAQ structured data.
 *
 * Search engines and AI assistants read this to lift a question and its answer
 * whole. It is built from the same content the page renders, so the two cannot
 * drift apart — publishing an answer that differs from the marked-up one is
 * treated as cloaking.
 */
function FaqSchema({ faqs }) {
  const usable = faqs.filter((f) => f.question.trim() && f.answer.trim());
  if (!usable.length) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: usable.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // `<` is escaped so a stray "</script>" in an answer cannot close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
}

export default function About() {
  const content = useContent();
  if (!content) return <div className="min-h-screen bg-cream" />;

  const { about, media } = content;
  const hero = media[about.heroId];
  const people = about.people.filter((p) => p.mediaId || p.name);
  const shoots = about.shoots.filter((s) => s.youtubeId);
  const places = about.places.filter((p) => p.name);
  const faqs = about.faqs.filter((f) => f.question.trim());

  const testimonials = content.home.praise.map((p) => ({
    name: p.name,
    quote: p.quote,
    media: [media[p.mediaIds[0]], media[p.mediaIds[1]]],
  }));

  return (
    <>
      {/* ---------- Banner ---------- */}
      {hero && (
        <section className="w-full">
          <SiteImage
            media={hero}
            alt={hero.alt || ''}
            loading="eager"
            sizes="100vw"
            className="h-[26vw] min-h-[220px] w-full object-cover"
          />
        </section>
      )}

      {/* ---------- One line ---------- */}
      <section className="w-full bg-cream px-[8vw] pt-[10vw] text-center md:px-[6vw] md:pt-[4vw]">
        <p className="font-serif text-eyebrow uppercase leading-[1.4] tracking-[0.28em] text-stone">
          About
        </p>
        <h1 className="mx-auto mt-[5vw] max-w-[24ch] font-display-light text-h1 font-light leading-[1.25] text-ink md:mt-[1.6vw]">
          {about.heroLine}
        </h1>
      </section>

      {/* ---------- The people ---------- */}
      {people.length > 0 && (
        <section className="w-full bg-cream px-[8vw] pb-[4vw] pt-[14vw] md:px-[6vw] md:pt-[6vw]">
          <Heading lead="The">PEOPLE</Heading>

          <ul className="mx-auto mt-[10vw] grid max-w-[1200px] grid-cols-1 gap-[10vw] sm:grid-cols-3 sm:gap-[3vw] md:mt-[3.5vw]">
            {people.map((person) => (
              <li key={person.id} className="text-center">
                <SiteImage
                  media={media[person.mediaId]}
                  alt={person.name}
                  sizes="(max-width: 639px) 84vw, 28vw"
                  className="aspect-[3/4] w-full object-cover"
                />
                <h3 className="mt-[4vw] font-display text-name uppercase leading-[1.2] tracking-[0.1em] text-ink sm:mt-[1.2vw]">
                  {person.name}
                </h3>
                <p className="mx-auto mt-[2.5vw] max-w-[34ch] font-serif text-copy leading-[1.6] text-ink/75 sm:mt-[0.8vw]">
                  {person.line}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- How we shoot ---------- */}
      {shoots.length > 0 && (
        <section className="w-full bg-band px-[8vw] py-[14vw] md:px-[6vw] md:py-[5vw]">
          <Heading lead="How we">SHOOT</Heading>

          <ul className="mx-auto mt-[10vw] grid max-w-[1200px] grid-cols-1 gap-[10vw] sm:grid-cols-3 sm:gap-[2.5vw] md:mt-[3.5vw]">
            {shoots.map((shoot) => (
              <li key={shoot.id}>
                <YouTubeEmbed
                  id={shoot.youtubeId}
                  title={shoot.line || 'Behind the scenes'}
                  aspectClass={shoot.vertical ? 'aspect-[9/16]' : 'aspect-video'}
                />
                <p className="mt-[3.5vw] text-center font-serif text-copy leading-[1.6] text-ink/80 sm:mt-[1.2vw]">
                  {shoot.line}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Where we shoot ---------- */}
      {places.length > 0 && (
        <section className="w-full bg-cream px-[8vw] py-[14vw] md:px-[6vw] md:py-[5vw]">
          <Heading lead="Where we">SHOOT</Heading>
          <p className="mx-auto mt-[4vw] max-w-[52ch] text-center font-serif text-copy leading-[1.6] text-ink/70 md:mt-[1.2vw]">
            {CONTACT.regions}
          </p>

          <div className="mx-auto mt-[10vw] max-w-[1200px] md:mt-[3.5vw]">
            <DestinationList places={places} media={media} />
          </div>
        </section>
      )}

      {/* ---------- Praise ---------- */}
      {testimonials.length > 0 && (
        <section className="w-full bg-band px-[9.2vw] pb-[5vw] pt-[10vw] md:px-[6vw] md:pt-[3vw]">
          <h2 className="relative z-10 text-center font-display-light text-praise font-light leading-[1.1] text-ink md:font-display md:font-normal">
            <span className="italic md:font-serif">Client</span> PRAISE
          </h2>

          <div className="relative z-20 mt-[14vw] md:-mt-[2vw]">
            <TestimonialCarousel items={testimonials} />
          </div>
        </section>
      )}

      {/* ---------- FAQs ---------- */}
      {faqs.length > 0 && (
        <section className="w-full bg-cream px-[8vw] py-[14vw] md:px-[6vw] md:py-[5vw]">
          <Heading lead="Common">QUESTIONS</Heading>

          {/*
            Native <details> rather than a scripted accordion: every answer is
            in the page whether or not it is open, so crawlers and assistants
            read all of them, and it is keyboard-operable with no code.
          */}
          <ul className="mx-auto mt-[10vw] w-full max-w-[56rem] md:mt-[3.5vw]">
            {faqs.map((faq) => (
              <li key={faq.id} className="border-b border-ink/15 first:border-t">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-[6vw] py-[4.5vw] md:gap-[2vw] md:py-[1.3vw] [&::-webkit-details-marker]:hidden">
                    <h3 className="font-serif text-body leading-[1.5] text-ink">{faq.question}</h3>
                    <span
                      aria-hidden="true"
                      className="mt-[0.3em] shrink-0 font-serif text-body leading-none text-ink/50 transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-[68ch] pb-[5vw] font-serif text-copy leading-[1.75] text-ink/75 md:pb-[1.4vw]">
                    {faq.answer}
                  </p>
                </details>
              </li>
            ))}
          </ul>

          <FaqSchema faqs={faqs} />
        </section>
      )}

      {/* ---------- Enquire ---------- */}
      <section className="w-full bg-cream px-[8vw] pb-[16vw] text-center md:px-[6vw] md:pb-[6vw]">
        <div className="flex justify-center">
          <Button to="/enquiry" className="h-[47px] w-[244px] md:h-auto md:w-auto">
            Enquire
          </Button>
        </div>
      </section>
    </>
  );
}
