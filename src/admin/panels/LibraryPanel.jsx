import { useRef, useState } from 'react';
import { useAdmin } from '../Admin';
import { Button, Section, inputClass, thumbUrl } from '../ui';
import { originalUrl } from '../../content/media';

const kb = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

/**
 * Every photo held for the site.
 *
 * Uploads keep the original file untouched and generate the display copies;
 * the original is what any future change of settings is re-run against, so it
 * is never overwritten and never served to visitors.
 */
export default function LibraryPanel() {
  const { library, meta, uploadFiles, deleteMedia, deleteMediaBulk, patchMedia } = useAdmin();
  const [busy, setBusy] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [ticked, setTicked] = useState(() => new Set());
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef(null);

  const unused = new Set(meta?.unusedMediaIds ?? []);
  const shown = filter === 'unused' ? library.filter((m) => unused.has(m.id)) : library;
  const allShownTicked = shown.length > 0 && shown.every((m) => ticked.has(m.id));

  const toggle = (id) =>
    setTicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllShown = () =>
    setTicked((current) => {
      const next = new Set(current);
      // Acts on what is on screen, so it does not quietly tick photos the
      // current filter is hiding.
      for (const m of shown) {
        if (allShownTicked) next.delete(m.id);
        else next.add(m.id);
      }
      return next;
    });

  /**
   * Delete everything ticked.
   *
   * The first attempt is made without force, so the server can report anything
   * still used on the site; only then is a second, explicit confirmation asked
   * for, listing exactly which pages would be left with an empty slot.
   */
  const deleteTicked = async () => {
    const ids = [...ticked];
    if (!ids.length) return;

    if (!window.confirm(`Permanently delete ${ids.length} photo${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      let result;
      try {
        result = await deleteMediaBulk(ids, false);
      } catch (err) {
        const inUse = err.details?.inUse ?? [];
        if (!inUse.length) throw err;

        const preview = inUse
          .slice(0, 6)
          .map((x) => `• ${x.filename} — ${x.places.join('; ')}`)
          .join('\n');
        const more = inUse.length > 6 ? `\n…and ${inUse.length - 6} more.` : '';

        const proceed = window.confirm(
          `${inUse.length} of these are still used on the site:\n\n${preview}${more}\n\n` +
            'Deleting them will leave those places empty. Continue?',
        );
        if (!proceed) return;
        result = await deleteMediaBulk(ids, true);
      }

      setTicked(new Set());
      setSelected(null);
      const freed = result.freedBytes ? ` (${kb(result.freedBytes)} freed)` : '';
      const cleared = result.clearedFrom?.length
        ? `\n\nEmptied: ${[...new Set(result.clearedFrom)].join('; ')}`
        : '';
      window.alert(`Deleted ${result.deleted} photo${result.deleted === 1 ? '' : 's'}${freed}.${cleared}`);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const onFiles = async (files) => {
    if (!files?.length) return;
    setBusy({ index: 0, total: files.length, name: files[0].name });
    const { failed } = await uploadFiles(files, setBusy);
    setBusy(null);
    if (failed.length) window.alert(`Could not add:\n${failed.join('\n')}`);
  };

  const remove = async (media) => {
    if (!window.confirm(`Permanently delete ${media.filename}? This cannot be undone.`)) return;
    try {
      await deleteMedia(media.id);
      setSelected(null);
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="All photos"
        description="Uploads are stored at full quality. The site is served smaller copies made from them."
        actions={
          <>
            <select className={`${inputClass} w-auto`} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All photos ({library.length})</option>
              <option value="unused">Not used anywhere ({unused.size})</option>
            </select>
            <Button variant="primary" onClick={() => fileRef.current?.click()}>
              Upload photos
            </Button>
          </>
        }
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {busy && (
          <p className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Processing {busy.index + 1} of {busy.total}: {busy.name}
          </p>
        )}

        {/* Selection bar — only once something is ticked, so the page stays
            calm until there is a decision to make. */}
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button onClick={toggleAllShown} disabled={shown.length === 0}>
            {allShownTicked ? 'Untick all' : `Tick all ${filter === 'unused' ? 'unused' : ''}`.trim()}
          </Button>

          {ticked.size > 0 && (
            <>
              <span className="text-sm text-neutral-600">
                <strong className="font-medium">{ticked.size}</strong> selected
              </span>
              <Button variant="ghost" onClick={() => setTicked(new Set())}>
                Clear
              </Button>
              <Button variant="danger" onClick={deleteTicked} disabled={deleting}>
                {deleting ? 'Deleting…' : `Delete ${ticked.size} permanently`}
              </Button>
            </>
          )}
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
        >
          {shown.length === 0 ? (
            <p className="rounded border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500">
              {filter === 'unused' ? 'Every photo is in use.' : 'Drop photos here, or use Upload.'}
            </p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
              {shown.map((media) => (
                <li key={media.id} className="relative">
                  {/* Sits above the tile so ticking never opens the details. */}
                  <label
                    className="absolute left-2.5 top-2.5 z-10 flex cursor-pointer items-center rounded bg-white/85 p-1 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={ticked.has(media.id)}
                      onChange={() => toggle(media.id)}
                      aria-label={`Select ${media.filename}`}
                      className="h-4 w-4"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setSelected(media)}
                    className={`block w-full rounded border-2 p-1 text-left hover:bg-neutral-100 ${
                      ticked.has(media.id) ? 'border-neutral-900 bg-neutral-100' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={thumbUrl(media)}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full rounded bg-neutral-100 object-cover"
                    />
                    <span className="mt-1 block truncate text-[11px] text-neutral-600">{media.filename}</span>
                    <span className="block text-[11px] text-neutral-400">
                      {media.width}×{media.height}
                      {unused.has(media.id) && ' · unused'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start gap-5">
              <img
                src={thumbUrl(selected)}
                alt=""
                className="h-40 w-40 shrink-0 rounded border border-neutral-200 object-cover"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold">{selected.filename}</h2>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-600">
                  <dt>Size on screen</dt>
                  <dd>{selected.width} × {selected.height}</dd>
                  <dt>Original file</dt>
                  <dd>{kb(selected.bytes)} {selected.format}</dd>
                  <dt>Colour profile</dt>
                  <dd>{selected.hasIccProfile ? 'kept' : 'none (standard colour)'}</dd>
                  <dt>Copies made</dt>
                  <dd>{Object.keys(selected.variants?.webp ?? {}).join(', ')} px wide</dd>
                </dl>

                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-neutral-700">
                    Description for screen readers
                  </span>
                  <input
                    className={inputClass}
                    defaultValue={selected.alt}
                    placeholder="e.g. Bride and groom on a mountain ridge"
                    onBlur={(e) => patchMedia(selected.id, { alt: e.target.value })}
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <a
                href={originalUrl(selected)}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-neutral-600 underline"
              >
                Open the original
              </a>
              <div className="flex gap-2">
                {unused.has(selected.id) ? (
                  <Button variant="danger" onClick={() => remove(selected)}>
                    Delete
                  </Button>
                ) : (
                  <span className="self-center text-xs text-neutral-500">
                    In use on the site — remove it there before deleting.
                  </span>
                )}
                <Button onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
