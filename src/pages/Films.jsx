import YouTubeEmbed from '../components/YouTubeEmbed';

/**
 * Five films, alternating video-left / video-right down the page.
 * YouTube ids come from the saved iframe filenames in Films_files/.
 */
const FILMS = [
  {
    id: '6mH5K-GdnhA',
    name: 'NIKHIL & RACHNA',
    label: 'Short Film',
    videoFirst: true,
    lines: [
      'Through our lenses, we step beyond these limitations, honing in',
      'on the emotions that define your story.',
      'We capture the essence of who you are, creating memories that go',
      'beyond labels and speak to the heart.',
    ],
  },
  {
    id: 'SQNIM3_y2pg',
    name: 'RAGINI & NIKHIL',
    label: 'Wedding Teaser',
    videoFirst: false,
    lines: [
      'This isn’t just a film.',
      'It’s the way your hands reached for each other in silence,',
      'the joy in your parents’ eyes,',
      'the way the world melted away when you said “I do.”',
      'We create art that lets you relive',
    ],
  },
  {
    id: 'jzhG7BCSCKE',
    name: 'ANIRUDHA SHUCHI',
    label: 'Wedding',
    videoFirst: true,
    lines: [
      'Our lens sees what words can’t say.',
      'From the chaos of getting ready to the stillness of your vows,',
      'we capture not just the big moments, but the in-betweens too.',
    ],
  },
  {
    id: 'RwPTps6eATg',
    name: 'JAS & POORVI',
    label: 'Wedding Teaser',
    videoFirst: false,
    lines: [
      'Your story is one of a kind — full of quirks, quiet magic, and',
      'moments only you share.',
      'That’s what we hold onto.',
      'A wedding film that doesn’t follow a formula, but follows you.',
      'Real, raw, and completely yours.',
    ],
  },
  {
    id: 'tHpjikPWD3s',
    name: 'PRITHVI & RAGHVI',
    label: 'Wedding Teaser',
    videoFirst: true,
    lines: [
      'Every love story is made of a thousand little moments.',
      'The soft smiles, the stolen glances, the way your fingers',
      'intertwined when no one was watching.',
    ],
  },
];

function FilmCopy({ film }) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="font-serif text-eyebrow leading-[1.4] text-ink">{film.label}</p>

      <h2 className="mt-[0.9vw] font-display text-name leading-[1.1] tracking-[0.02em] text-black">
        {film.name}
      </h2>

      <span aria-hidden="true" className="mt-[1.1vw] block h-px w-[7vw] bg-ink/45" />

      <p className="mt-[1.3vw] font-serif text-eyebrow leading-[1.5] text-ink">
        {film.lines.map((line, i) => (
          <span key={line}>
            {line}
            {i < film.lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    </div>
  );
}

export default function Films() {
  return (
    <section className="w-full bg-cream pb-[6vw] pt-[3vw]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-[6vw] px-[6vw]">
        {FILMS.map((film) => (
          <article
            key={film.id}
            className="grid grid-cols-1 items-center gap-[3vw] md:grid-cols-2 md:gap-[4vw]"
          >
            <div className={film.videoFirst ? 'md:order-1' : 'md:order-2'}>
              <YouTubeEmbed id={film.id} title={`${film.name} — ${film.label}`} />
            </div>
            <div className={film.videoFirst ? 'md:order-2' : 'md:order-1'}>
              <FilmCopy film={film} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
