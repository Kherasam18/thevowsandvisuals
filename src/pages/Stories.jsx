import { Link } from 'react-router-dom';
import { useContent } from '../content/ContentProvider';
import SiteImage from '../content/SiteImage';

/**
 * Source page title is "Portfolio (List)". Full-width banner strips, each
 * captioned beneath and linking through to that couple's story page.
 *
 * The banner is the wide image the admin sets for this page; the couple's name
 * is burnt into the artwork on the originals, and the caption repeats it.
 */
export default function Stories() {
  const content = useContent();
  if (!content) return <div className="min-h-screen bg-cream" />;

  const stories = content.stories
    .map((story) => ({ ...story, banner: content.media[story.bannerId] ?? null }))
    .filter((story) => story.banner);

  return (
    <section className="w-full bg-cream pb-[6vw] pt-[9vw] md:pt-[2vw]">
      {/* Phones pull the gutter in so the banners run wider, and drop the first
          one further clear of the navbar; desktop keeps the source's proportions. */}
      <div className="mx-auto w-full max-w-[1600px] px-[6vw] md:px-[13.5vw]">
        <ul className="flex flex-col gap-[4.4vw]">
          {stories.map((story) => (
            <li key={story.id}>
              <Link to={`/stories/${story.slug}`} className="group block">
                <figure>
                  <div className="overflow-hidden">
                    <SiteImage
                      media={story.banner}
                      alt={story.name}
                      sizes="(max-width: 767px) 88vw, 73vw"
                      className="aspect-[1076/323] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <figcaption className="mt-[1.1vw] font-serif text-body uppercase leading-[1.4] tracking-[0.16em] text-ink transition-colors duration-300 group-hover:text-maroon">
                    {story.name}
                  </figcaption>
                </figure>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
