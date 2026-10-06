import { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../Admin';
import { Button, ImageList, Section, thumbUrl } from '../ui';

/**
 * The Galleries page.
 *
 * Unlike the rest of the admin, the wall is not saved as you click. The studio
 * asked for a tick-list with a Save button, so selections are held locally and
 * only applied on Save — which also means a mis-click costs nothing.
 */
export default function GalleriesPanel() {
  const { content, library, update, uploadFiles } = useAdmin();

  const published = content.galleries.selectedIds;
  const [picked, setPicked] = useState(() => new Set(published));

  // Re-sync if the document changes underneath (a restore, say) — but not while
  // there are unsaved ticks, which would throw away the studio's work.
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setPicked(new Set(published));
  }, [published, dirty]);

  const allSelected = library.length > 0 && picked.size === library.length;

  const toggle = (id) => {
    setDirty(true);
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setDirty(true);
    setPicked(allSelected ? new Set() : new Set(library.map((m) => m.id)));
  };

  const save = () => {
    // Keep the order already published, then append newly ticked photos in
    // library order, so saving does not reshuffle the wall.
    const kept = published.filter((id) => picked.has(id));
    const added = library.map((m) => m.id).filter((id) => picked.has(id) && !kept.includes(id));
    update((d) => { d.galleries.selectedIds = [...kept, ...added]; });
    setDirty(false);
  };

  const discard = () => {
    setPicked(new Set(published));
    setDirty(false);
  };

  const changeSummary = useMemo(() => {
    const added = [...picked].filter((id) => !published.includes(id)).length;
    const removed = published.filter((id) => !picked.has(id)).length;
    return { added, removed };
  }, [picked, published]);

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Hero slideshow"
        description="The three photos that cycle at the top of the Galleries page."
      >
        <ImageList
          label="Slides"
          ids={content.galleries.heroIds}
          media={content.media}
          max={3}
          minWidth={1920}
          library={library}
          onUpload={uploadFiles}
          onChange={(ids) => update((d) => { d.galleries.heroIds = ids; })}
        />
      </Section>

      <Section
        title="Photo wall"
        description="Tick the photos to show on the Galleries page, then press Save."
        actions={
          <>
            <Button onClick={toggleAll}>{allSelected ? 'Deselect all' : 'Select all'}</Button>
            {dirty && <Button onClick={discard}>Discard</Button>}
            <Button variant="primary" onClick={save} disabled={!dirty}>
              Save
            </Button>
          </>
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-neutral-600">
            <strong className="font-medium">{picked.size}</strong> of {library.length} photos ticked
          </span>
          {dirty ? (
            <span className="text-amber-700">
              Unsaved: {changeSummary.added > 0 && `${changeSummary.added} to add`}
              {changeSummary.added > 0 && changeSummary.removed > 0 && ', '}
              {changeSummary.removed > 0 && `${changeSummary.removed} to remove`}
            </span>
          ) : (
            <span className="text-neutral-400">Matches the live page</span>
          )}
        </div>

        {library.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">
            There are no photos in your library yet.
          </p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
            {library.map((media) => {
              const on = picked.has(media.id);
              return (
                <li key={media.id}>
                  <label
                    className={`block cursor-pointer rounded border-2 p-1 transition-colors ${
                      on ? 'border-neutral-900 bg-neutral-100' : 'border-transparent hover:bg-neutral-100'
                    }`}
                  >
                    <span className="relative block">
                      <img
                        src={thumbUrl(media)}
                        alt=""
                        loading="lazy"
                        className={`aspect-square w-full rounded bg-neutral-100 object-cover transition-opacity ${
                          on ? '' : 'opacity-60'
                        }`}
                      />
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(media.id)}
                        className="absolute left-1.5 top-1.5 h-4 w-4"
                      />
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-neutral-600">
                      {media.filename}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
