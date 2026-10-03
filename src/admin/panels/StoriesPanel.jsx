import { useState } from 'react';
import { useAdmin } from '../Admin';
import { Button, Field, ImageList, ImageSlot, Section, inputClass, thumbUrl } from '../ui';

/** Turns a couple's name into a web address: "Payal & Harsh" → "payal-harsh". */
const toSlug = (name) =>
  name
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'story';

/** Accepts a full YouTube URL or a bare id, and keeps the id. */
export function parseYouTubeId(value) {
  const text = value.trim();
  if (!text) return '';
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const found = re.exec(text);
    if (found) return found[1];
  }
  return /^[\w-]{11}$/.test(text) ? text : '';
}

function StoryEditor({ story, index, onClose }) {
  const { content, library, update, uploadFiles } = useAdmin();
  const shared = { library, onUpload: uploadFiles };
  const at = (recipe) => update((d) => recipe(d.stories[index], d));

  const [linkText, setLinkText] = useState(story.youtubeId);
  const linkInvalid = linkText.trim() !== '' && !parseYouTubeId(linkText);

  return (
    <Section
      title={story.name || 'Untitled story'}
      description={`Appears at /stories/${story.slug}`}
      actions={<Button onClick={onClose}>Done</Button>}
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Couple's names">
            <input
              className={inputClass}
              value={story.name}
              onChange={(e) =>
                at((s) => {
                  const hadAutoSlug = s.slug === toSlug(s.name);
                  s.name = e.target.value;
                  // Keep the address in step while it has not been hand-edited;
                  // changing it on a live story would break existing links.
                  if (hadAutoSlug) s.slug = toSlug(e.target.value);
                })
              }
            />
          </Field>
          <Field label="Web address" hint="Changing this breaks any link already shared.">
            <input
              className={inputClass}
              value={story.slug}
              onChange={(e) => at((s) => { s.slug = toSlug(e.target.value); })}
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <ImageSlot
            label="Banner — shown on the Stories page"
            hint="A wide, letterbox photo. Roughly 3.3 times wider than tall."
            media={content.media[story.bannerId]}
            minWidth={2000}
            aspect="h-12"
            onChange={(id) => at((s) => { s.bannerId = id; })}
            {...shared}
          />
          <ImageSlot
            label="Cover — shown on the Home page"
            hint="An upright photo for the Home strip. Taller than it is wide."
            media={content.media[story.coverId]}
            minWidth={800}
            aspect="h-28"
            onChange={(id) => at((s) => { s.coverId = id; })}
            {...shared}
          />
        </div>

        <Field
          label="Wedding film"
          hint="Paste a YouTube link, or leave empty for no film."
          error={linkInvalid ? 'That does not look like a YouTube link.' : null}
        >
          <input
            className={inputClass}
            value={linkText}
            placeholder="https://www.youtube.com/watch?v=…"
            onChange={(e) => {
              setLinkText(e.target.value);
              const id = parseYouTubeId(e.target.value);
              if (id || !e.target.value.trim()) at((s) => { s.youtubeId = id; });
            }}
          />
        </Field>

        <ImageList
          label="Photos in this story"
          hint="Shown as a tiled wall; visitors can open any one full screen."
          ids={story.photoIds}
          media={content.media}
          minWidth={1600}
          onChange={(ids) => at((s) => { s.photoIds = ids; })}
          {...shared}
        />
      </div>
    </Section>
  );
}

export default function StoriesPanel() {
  const { content, update } = useAdmin();
  const [openId, setOpenId] = useState(null);

  const openIndex = content.stories.findIndex((s) => s.id === openId);
  if (openIndex !== -1) {
    return (
      <StoryEditor story={content.stories[openIndex]} index={openIndex} onClose={() => setOpenId(null)} />
    );
  }

  const addStory = () => {
    const id = `story_${Date.now().toString(36)}`;
    update((d) => {
      d.stories.push({
        id,
        slug: `new-story-${d.stories.length + 1}`,
        name: '',
        bannerId: null,
        coverId: null,
        youtubeId: '',
        photoIds: [],
      });
    });
    setOpenId(id);
  };

  return (
    <Section
      title="Stories"
      description="Each story is a page of its own. The Home page strip follows this list and its order."
      actions={<Button variant="primary" onClick={addStory}>Add a story</Button>}
    >
      {content.stories.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">No stories yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200">
          {content.stories.map((story, i) => {
            const banner = content.media[story.bannerId];
            const missing = [!story.bannerId && 'banner', !story.coverId && 'cover'].filter(Boolean);

            return (
              <li key={story.id} className="flex items-center gap-4 py-3">
                {banner ? (
                  <img
                    src={thumbUrl(banner)}
                    alt=""
                    loading="lazy"
                    className="h-12 w-40 shrink-0 rounded border border-neutral-200 object-cover"
                  />
                ) : (
                  <div className="h-12 w-40 shrink-0 rounded border border-dashed border-neutral-300" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{story.name || <em className="text-neutral-400">Untitled</em>}</p>
                  <p className="text-xs text-neutral-500">
                    {story.photoIds.length} photos
                    {story.youtubeId ? ' · has a film' : ''}
                    {missing.length ? ` · missing ${missing.join(' and ')}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <Button
                    disabled={i === 0}
                    onClick={() => update((d) => { const l = d.stories; [l[i - 1], l[i]] = [l[i], l[i - 1]]; })}
                  >
                    ↑
                  </Button>
                  <Button
                    disabled={i === content.stories.length - 1}
                    onClick={() => update((d) => { const l = d.stories; [l[i + 1], l[i]] = [l[i], l[i + 1]]; })}
                  >
                    ↓
                  </Button>
                  <Button onClick={() => setOpenId(story.id)}>Edit</Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`Delete "${story.name || 'this story'}"? The photos stay in your library.`)) {
                        update((d) => { d.stories.splice(i, 1); });
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
