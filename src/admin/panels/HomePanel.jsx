import { Link } from 'react-router-dom';
import { useAdmin } from '../Admin';
import { Button, Field, ImageList, ImageSlot, Section, inputClass, thumbUrl } from '../ui';

/** Everything on the Home page that the studio can change. */
export default function HomePanel() {
  const { content, library, update, uploadFiles } = useAdmin();
  const { home } = content;

  const shared = { library, onUpload: uploadFiles };
  const homeFilms = content.films.filter((f) => f.showOnHome);

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Hero"
        description="The full-screen opening. The still is shown while the video loads, and on phones that block autoplay."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <ImageSlot
            label="Hero still"
            hint="Shown behind the video. Ideally the video's own first frame."
            media={content.media[home.heroPosterId]}
            minWidth={1920}
            onChange={(id) => update((d) => { d.home.heroPosterId = id; })}
            {...shared}
          />
          <Field
            label="Hero video"
            hint="The video file on the site. Uploading video is not set up yet — this points at the file already there."
          >
            <input
              className={inputClass}
              value={home.heroVideoSrc}
              onChange={(e) => update((d) => { d.home.heroVideoSrc = e.target.value; })}
            />
          </Field>
        </div>
      </Section>

      <Section title="Photo grid" description="The band of squares below the mission statement. Fifteen photos, five across.">
        <ImageList
          label="Grid photos"
          ids={home.gridIds}
          media={content.media}
          minWidth={800}
          onChange={(ids) => update((d) => { d.home.gridIds = ids; })}
          {...shared}
        />
      </Section>

      <Section title="Vibrant · Timeless · Authentic" description="The three tall photos. The words over them are part of the design and are fixed.">
        <div className="grid gap-5 md:grid-cols-3">
          {home.pillars.map((pillar, i) => (
            <ImageSlot
              key={pillar.key}
              label={pillar.label}
              media={content.media[pillar.mediaId]}
              minWidth={900}
              aspect="h-28"
              onChange={(id) => update((d) => { d.home.pillars[i].mediaId = id; })}
              {...shared}
            />
          ))}
        </div>
      </Section>

      <Section
        title="The Stories strip"
        description="Taken from the Stories page — each story's cover photo appears here, in that order."
      >
        <ul className="flex flex-wrap gap-3">
          {content.stories.map((story) => {
            const cover = content.media[story.coverId] ?? content.media[story.bannerId];
            return (
              <li key={story.id} className="w-32">
                {cover ? (
                  <img
                    src={thumbUrl(cover)}
                    alt=""
                    loading="lazy"
                    className="aspect-[1/1.45] w-full rounded border border-neutral-200 object-cover"
                  />
                ) : (
                  <div className="flex aspect-[1/1.45] w-full items-center justify-center rounded border border-dashed border-neutral-300 text-xs text-neutral-400">
                    no cover
                  </div>
                )}
                <p className="mt-1 truncate text-xs text-neutral-600">{story.name}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm text-neutral-500">
          To change these, edit the stories themselves.{' '}
          <Link to="/admin/stories" className="underline">
            Go to Stories
          </Link>
        </p>
      </Section>

      <Section
        title="Films strip"
        description="The films ticked to show on Home, up to four."
        actions={
          <Link to="/admin/films" className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
            Go to Films
          </Link>
        }
      >
        {homeFilms.length === 0 ? (
          <p className="text-sm text-neutral-500">No films are ticked for the Home page.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {homeFilms.map((film) => (
              <li key={film.id} className="rounded border border-neutral-200 px-3 py-1.5 text-sm">
                {film.title || <em className="text-neutral-400">untitled</em>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Client praise"
        description="Each one shows two photos, the couple's names and their words."
        actions={
          <Button
            onClick={() =>
              update((d) => {
                d.home.praise.push({
                  id: `praise_${Date.now().toString(36)}`,
                  name: '',
                  quote: '',
                  mediaIds: [],
                });
              })
            }
          >
            Add a testimonial
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          {content.home.praise.map((entry, i) => (
            <article key={entry.id} className="rounded border border-neutral-200 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                {[0, 1].map((slot) => (
                  <ImageSlot
                    key={slot}
                    label={`Photo ${slot + 1}`}
                    media={content.media[entry.mediaIds[slot]]}
                    minWidth={800}
                    aspect="h-24"
                    onChange={(id) =>
                      update((d) => {
                        const list = [...d.home.praise[i].mediaIds];
                        if (id) list[slot] = id;
                        else list.splice(slot, 1);
                        d.home.praise[i].mediaIds = list.filter(Boolean).slice(0, 2);
                      })
                    }
                    {...shared}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <Field label="Couple's names">
                  <input
                    className={inputClass}
                    value={entry.name}
                    onChange={(e) => update((d) => { d.home.praise[i].name = e.target.value; })}
                  />
                </Field>
                <Field label="What they said">
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={entry.quote}
                    onChange={(e) => update((d) => { d.home.praise[i].quote = e.target.value; })}
                  />
                </Field>
              </div>

              <div className="mt-3 flex justify-between">
                <div className="flex gap-1">
                  <Button
                    disabled={i === 0}
                    onClick={() =>
                      update((d) => {
                        const list = d.home.praise;
                        [list[i - 1], list[i]] = [list[i], list[i - 1]];
                      })
                    }
                  >
                    Move up
                  </Button>
                  <Button
                    disabled={i === content.home.praise.length - 1}
                    onClick={() =>
                      update((d) => {
                        const list = d.home.praise;
                        [list[i + 1], list[i]] = [list[i], list[i + 1]];
                      })
                    }
                  >
                    Move down
                  </Button>
                </div>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Remove the testimonial from ${entry.name || 'this couple'}?`)) {
                      update((d) => { d.home.praise.splice(i, 1); });
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </div>
  );
}
