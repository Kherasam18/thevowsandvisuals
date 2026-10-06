import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import YouTubeEmbed from '../components/YouTubeEmbed';
import Lightbox from '../components/Lightbox';
import MasonryGrid from '../components/MasonryGrid';
import SiteImage from '../content/SiteImage';
import { useContent } from '../content/ContentProvider';

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
  const content = useContent();

  // Prev/next keeps this component mounted, so a viewer left open — via the
  // back button, say — would otherwise carry its index onto the next couple.
  useEffect(() => setLightboxIndex(null), [slug]);

  const data = useMemo(() => {
    if (!content) return undefined;
    const index = content.stories.findIndex((s) => s.slug === slug);
    if (index === -1) return null;

    const stories = content.stories;
    const story = stories[index];
    const gallery = story.photoIds.map((id) => content.media[id]).filter(Boolean);

    return {
      story,
      banner: content.media[story.bannerId] ?? null,
      gallery,
      // Known up front, so the masonry packs correctly on the first paint
      // instead of downloading every photo just to measure it.
      ratios: gallery.map((m) => m.width / m.height || 1),
      prev: stories[(index - 1 + stories.length) % stories.length],
      next: stories[(index + 1) % stories.length],
    };
  }, [content, slug]);

  if (data === undefined) return <div className="min-h-screen bg-cream" />;
  // Unknown couple → back to the list, mirroring the site's fall-through behaviour.
  if (data === null) return <Navigate to="/stories" replace />;

  const { story, banner, gallery, ratios, prev, next } = data;

  return (
    <>
      {/* Hero banner (couple name is burnt into the artwork) + title */}
      <section className="w-full bg-cream px-[6vw] pt-[3vw]">
        <SiteImage
          media={banner}
          alt={story.name}
          loading="eager"
          sizes="88vw"
          className="aspect-[1076/323] w-full object-cover"
        />
        <h1 className="mt-[1.4vw] font-display text-h1 uppercase leading-[1.15] tracking-[0.02em] text-ink">
          {story.name}
        </h1>
      </section>

      {/*
        Featured wedding film — only when there is one.

        An empty id still builds a valid embed URL, so the player loaded and
        failed on play rather than being absent. Stories without a film now
        simply run banner straight into photographs.
      */}
      {story.youtubeId && (
        <section className="w-full bg-cream px-[6vw] py-[2.4vw]">
          <YouTubeEmbed id={story.youtubeId} title={`${story.name} — Wedding Film`} />
        </section>
      )}

      {/*
        Photo gallery (generic placeholders for now). Every photo keeps its own
        proportions and is shown whole, where the earlier object-cover cells
        cropped portraits and panoramas to fit a fixed row shape. Packed by the
        same masonry as the Galleries wall, so the columns finish level instead
        of leaving a blank panel beside the last few photos.
      */}
      <section className="w-full bg-cream px-[6vw] pb-[3vw]">
        <MasonryGrid
          images={gallery}
          ratios={ratios}
          gapClass="gap-[1vw]"
          columns={[2, 3]}
          renderItem={(media, i) => (
            <button
              key={media.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={`Open image ${i + 1} of ${gallery.length}`}
              /* Inset outline: the cell clips overflow on hover, so an outset
                 ring would be cut off. */
              className="block w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-maroon"
            >
              <SiteImage
                media={media}
                sizes="(max-width: 767px) 44vw, 29vw"
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
        images={gallery}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
