import YouTubeEmbed from '../components/YouTubeEmbed';
import { useContent } from '../content/ContentProvider';

/**
 * Films, alternating video-left / video-right down the page.
 *
 * The list is managed in the admin: adding a YouTube link adds a card here,
 * with its own type, title and description. Playback is still YouTube's embed —
 * self-hosted video is a separate question and deliberately not part of this.
 */
function FilmCopy({ film }) {
  // The description is one field; each line break becomes a line on the page,
  // which is how the original copy is set.
  const lines = film.description.split('\n');

  return (
    <div className="flex flex-col items-center text-center">
      <p className="font-serif text-eyebrow leading-[1.4] text-ink">{film.kind}</p>

      <h2 className="mt-[0.9vw] font-display text-name leading-[1.1] tracking-[0.02em] text-black">
        {film.title}
      </h2>

      <span aria-hidden="true" className="mt-[1.1vw] block h-px w-[7vw] bg-ink/45" />

      <p className="mt-[1.3vw] font-serif text-eyebrow leading-[1.5] text-ink">
        {lines.map((line, i) => (
          <span key={`${line}-${i}`}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    </div>
  );
}

export default function Films() {
  const content = useContent();
  if (!content) return <div className="min-h-screen bg-cream" />;

  const films = content.films.filter((film) => film.youtubeId);

  return (
    <section className="w-full bg-cream pb-[6vw] pt-[3vw]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-[6vw] px-[6vw]">
        {films.map((film, i) => {
          // Alternating sides are a property of position, not of the film, so
          // the pattern survives reordering and deleting in the admin.
          const videoFirst = i % 2 === 0;

          return (
            <article
              key={film.id}
              className="grid grid-cols-1 items-center gap-[3vw] md:grid-cols-2 md:gap-[4vw]"
            >
              <div className={videoFirst ? 'md:order-1' : 'md:order-2'}>
                <YouTubeEmbed id={film.youtubeId} title={`${film.title} — ${film.kind}`} />
              </div>
              <div className={videoFirst ? 'md:order-2' : 'md:order-1'}>
                <FilmCopy film={film} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
