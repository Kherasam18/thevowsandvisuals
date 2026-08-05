import { Link } from 'react-router-dom';
import { STORIES } from '../data/stories';

/**
 * Source page title is "Portfolio (List)". Full-width banner strips, each
 * captioned beneath and linking through to that couple's story page. The
 * couple's name is also burnt into the artwork itself — part of the image.
 */
export default function Stories() {
  return (
    <section className="w-full bg-cream pb-[6vw] pt-[2vw]">
      <div className="mx-auto w-full max-w-[1600px] px-[13.5vw]">
        <ul className="flex flex-col gap-[4.4vw]">
          {STORIES.map((story) => (
            <li key={story.slug}>
              <Link to={`/stories/${story.slug}`} className="group block">
                <figure>
                  <div className="overflow-hidden">
                    <img
                      src={story.banner}
                      alt={story.name}
                      loading="lazy"
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
