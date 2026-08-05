import { Link, Navigate, useParams } from 'react-router-dom';
import { getStoryBySlug } from '../data/stories';
import YouTubeEmbed from '../components/YouTubeEmbed';

/*
  Editorial gallery rhythm — a full-width feature, then a pair, a trio, a pair,
  repeating. Cells are object-cover so the mix of portrait/landscape placeholders
  crops to a consistent shape per row type. Keyed by the row's actual length so a
  short trailing row still lays out correctly.
*/
const PATTERN = [1, 2, 3, 2];
const LAYOUT = {
  1: { cols: 'grid-cols-1', aspect: 'aspect-[16/7]' },
  2: { cols: 'grid-cols-2', aspect: 'aspect-[4/5]' },
  3: { cols: 'grid-cols-3', aspect: 'aspect-square' },
};

function toRows(items) {
  const rows = [];
  for (let i = 0, p = 0; i < items.length; p += 1) {
    const size = PATTERN[p % PATTERN.length];
    rows.push(items.slice(i, i + size));
    i += size;
  }
  return rows;
}

/** 3×3 grid glyph for the "all stories" link, matching the reference. */
function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      {[0, 7, 14].map((y) => [0, 7, 14].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" />))}
    </svg>
  );
}

export default function StoryDetail() {
  const { slug } = useParams();
  const data = getStoryBySlug(slug);

  // Unknown couple → back to the list, mirroring the site's fall-through behaviour.
  if (!data) return <Navigate to="/stories" replace />;

  const { story, prev, next } = data;
  const rows = toRows(story.gallery);

  return (
    <>
      {/* Hero banner (couple name is burnt into the artwork) + title */}
      <section className="w-full bg-cream px-[6vw] pt-[3vw]">
        <img src={story.banner} alt={story.name} className="aspect-[1076/323] w-full object-cover" />
        <h1 className="mt-[1.4vw] font-display text-h1 uppercase leading-[1.15] tracking-[0.02em] text-ink">
          {story.name}
        </h1>
      </section>

      {/* Featured wedding film */}
      <section className="w-full bg-cream px-[6vw] py-[2.4vw]">
        <YouTubeEmbed id={story.filmId} title={`${story.name} — Wedding Film`} />
      </section>

      {/* Editorial photo gallery (generic placeholders for now) */}
      <section className="w-full bg-cream px-[6vw] pb-[3vw]">
        <div className="flex flex-col gap-[1vw]">
          {rows.map((row, r) => (
            <ul key={r} className={`grid gap-[1vw] ${LAYOUT[row.length].cols}`}>
              {row.map((src, c) => (
                <li key={c} className="overflow-hidden">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className={`w-full object-cover transition-transform duration-[900ms] ease-out hover:scale-[1.05] ${LAYOUT[row.length].aspect}`}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* Previous · all stories · Next */}
      <nav className="w-full bg-cream px-[6vw] pb-[5vw] pt-[1vw]">
        <div className="flex items-center justify-between border-t border-ink/15 pt-[1.6vw] font-serif text-copy uppercase tracking-[0.14em] text-ink">
          <Link
            to={`/stories/${prev.slug}`}
            className="transition-colors duration-300 hover:text-maroon"
          >
            Previous
          </Link>
          <Link
            to="/stories"
            aria-label="All stories"
            className="transition-colors duration-300 hover:text-maroon"
          >
            <GridIcon />
          </Link>
          <Link
            to={`/stories/${next.slug}`}
            className="transition-colors duration-300 hover:text-maroon"
          >
            Next
          </Link>
        </div>
      </nav>
    </>
  );
}
