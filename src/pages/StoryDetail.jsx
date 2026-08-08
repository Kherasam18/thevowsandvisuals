import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getStoryBySlug } from '../data/stories';
import YouTubeEmbed from '../components/YouTubeEmbed';
import Lightbox from '../components/Lightbox';
import MasonryGrid from '../components/MasonryGrid';

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
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const data = getStoryBySlug(slug);

  // Prev/next keeps this component mounted, so a viewer left open — via the
  // back button, say — would otherwise carry its index onto the next couple.
  useEffect(() => setLightboxIndex(null), [slug]);

  // Unknown couple → back to the list, mirroring the site's fall-through behaviour.
  if (!data) return <Navigate to="/stories" replace />;

  const { story, prev, next } = data;

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

      {/*
        Photo gallery (generic placeholders for now). Every photo keeps its own
        proportions and is shown whole, where the earlier object-cover cells
        cropped portraits and panoramas to fit a fixed row shape. Packed by the
        same masonry as the Galleries wall, so the columns finish level instead
        of leaving a blank panel beside the last few photos.
      */}
      <section className="w-full bg-cream px-[6vw] pb-[3vw]">
        <MasonryGrid
          images={story.gallery}
          gapClass="gap-[1vw]"
          columns={[2, 3]}
          renderItem={(src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={`Open image ${i + 1} of ${story.gallery.length}`}
              /* Inset outline: the cell clips overflow on hover, so an outset
                 ring would be cut off. */
              className="block w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-maroon"
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="w-full transition-transform duration-[900ms] ease-out hover:scale-[1.04]"
              />
            </button>
          )}
        />
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

      <Lightbox
        images={story.gallery}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
