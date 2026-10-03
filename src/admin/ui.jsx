import { useEffect, useMemo, useRef, useState } from 'react';
import { variantUrl, widthsFor } from '../content/media';

/* Shared pieces of the admin interface. Plain, dense and neutral on purpose —
   this is a tool, not part of the site. */

/** Smallest generated variant: enough for a thumbnail, cheap to load in bulk. */
export function thumbUrl(media) {
  const widths = widthsFor(media, 'webp');
  if (!widths.length) return '';
  return variantUrl(media, widths[0], 'webp');
}

export function Thumb({ media, className = '', size = 'h-20 w-20' }) {
  if (!media) {
    return (
      <div
        className={`${size} flex items-center justify-center rounded border border-dashed border-neutral-300 bg-neutral-50 text-[11px] text-neutral-400 ${className}`}
      >
        empty
      </div>
    );
  }
  return (
    <img
      src={thumbUrl(media)}
      alt=""
      loading="lazy"
      className={`${size} rounded border border-neutral-200 bg-neutral-100 object-cover ${className}`}
    />
  );
}

export function Button({ variant = 'default', className = '', ...props }) {
  const styles = {
    default: 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50',
    primary: 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700',
    danger: 'border-red-300 bg-white text-red-700 hover:bg-red-50',
    ghost: 'border-transparent bg-transparent text-neutral-600 hover:bg-neutral-100',
  }[variant];

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Field({ label, hint, children, error }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-500';

export function Section({ title, description, children, actions }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-3.5">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/**
 * Picks images out of the library.
 *
 * `multiple` returns a list and keeps the dialog open so several can be
 * selected in one pass; otherwise the first click resolves it.
 */
export function MediaPicker({ library, open, multiple = false, onPick, onClose, onUpload, title }) {
  const [chosen, setChosen] = useState([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setChosen([]);
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library;
    return library.filter(
      (m) => m.filename.toLowerCase().includes(q) || (m.alt ?? '').toLowerCase().includes(q),
    );
  }, [library, query]);

  if (!open) return null;

  const toggle = (media) => {
    if (!multiple) {
      onPick([media]);
      return;
    }
    setChosen((list) =>
      list.includes(media.id) ? list.filter((id) => id !== media.id) : [...list, media.id],
    );
  };

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setBusy({ index: 0, total: files.length, name: files[0].name });
    const { added, failed } = await onUpload(files, setBusy);
    setBusy(null);
    if (failed.length) window.alert(`Could not add:\n${failed.join('\n')}`);
    if (added.length && !multiple) onPick([added[0]]);
    else if (added.length) setChosen((list) => [...list, ...added.map((m) => m.id)]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-[min(44rem,92vh)] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl">
        <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-3">
          <h2 className="text-base font-semibold text-neutral-900">{title ?? 'Choose an image'}</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className={`${inputClass} ml-auto max-w-56`}
          />
          <Button onClick={() => fileRef.current?.click()}>Upload…</Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </header>

        {busy && (
          <p className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-sm text-amber-800">
            Processing {busy.index + 1} of {busy.total}: {busy.name}… full-size copies are being made,
            so this takes a moment per photo.
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {results.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-500">
              {library.length ? 'Nothing matches that search.' : 'No images yet — upload some.'}
            </p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
              {results.map((media) => {
                const picked = chosen.includes(media.id);
                return (
                  <li key={media.id}>
                    <button
                      type="button"
                      onClick={() => toggle(media)}
                      className={`block w-full rounded border-2 p-1 text-left transition-colors ${
                        picked ? 'border-neutral-900 bg-neutral-100' : 'border-transparent hover:bg-neutral-100'
                      }`}
                    >
                      <img
                        src={thumbUrl(media)}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full rounded bg-neutral-100 object-cover"
                      />
                      <span className="mt-1 block truncate text-[11px] text-neutral-600">
                        {media.filename}
                      </span>
                      <span className="block text-[11px] text-neutral-400">
                        {media.width}×{media.height}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {multiple && (
          <footer className="flex items-center justify-between border-t border-neutral-200 px-5 py-3">
            <span className="text-sm text-neutral-600">{chosen.length} selected</span>
            <div className="flex gap-2">
              <Button onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!chosen.length}
                onClick={() => onPick(chosen.map((id) => library.find((m) => m.id === id)).filter(Boolean))}
              >
                Add {chosen.length || ''}
              </Button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

/** Warn when a photo is too small for where it is going. */
function SizeWarning({ media, minWidth }) {
  if (!media || !minWidth || media.width >= minWidth) return null;
  return (
    <p className="mt-1 text-xs text-amber-700">
      {media.width}px wide — {minWidth}px or more is recommended here, or it may look soft.
    </p>
  );
}

/** A single-image slot: shows what is set, and swaps it. */
export function ImageSlot({ label, hint, media, onChange, library, onUpload, minWidth, aspect }) {
  const [picking, setPicking] = useState(false);

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="shrink-0 rounded border border-neutral-200 p-1 hover:bg-neutral-50"
        >
          {media ? (
            <img
              src={thumbUrl(media)}
              alt=""
              className={`w-28 rounded bg-neutral-100 object-cover ${aspect ?? 'h-20'}`}
            />
          ) : (
            <span className="flex h-20 w-28 items-center justify-center rounded border border-dashed border-neutral-300 text-xs text-neutral-400">
              choose
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          {hint && <p className="text-xs text-neutral-500">{hint}</p>}
          {media && (
            <p className="truncate text-xs text-neutral-600">
              {media.filename} · {media.width}×{media.height}
            </p>
          )}
          <SizeWarning media={media} minWidth={minWidth} />
          <div className="mt-1.5 flex gap-2">
            <Button onClick={() => setPicking(true)}>{media ? 'Replace' : 'Choose'}</Button>
            {media && (
              <Button variant="ghost" onClick={() => onChange(null)}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <MediaPicker
        library={library}
        open={picking}
        onUpload={onUpload}
        title={`Choose: ${label}`}
        onPick={([picked]) => {
          onChange(picked.id);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </div>
  );
}

/**
 * An ordered list of images.
 *
 * Reordering is by arrows rather than drag-and-drop: it works the same on a
 * phone, needs no pointer precision, and cannot half-complete.
 */
export function ImageList({ label, hint, ids, media, onChange, library, onUpload, max, minWidth }) {
  const [picking, setPicking] = useState(false);
  const items = ids.map((id) => media[id]).filter(Boolean);
  const full = max != null && ids.length >= max;

  const move = (from, to) => {
    if (to < 0 || to >= ids.length) return;
    const next = [...ids];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-neutral-700">
          {label}
          <span className="ml-2 font-normal text-neutral-400">
            {ids.length}
            {max != null && ` / ${max}`}
          </span>
        </span>
        <Button onClick={() => setPicking(true)} disabled={full}>
          Add images…
        </Button>
      </div>
      {hint && <p className="mb-2 text-xs text-neutral-500">{hint}</p>}
      {full && <p className="mb-2 text-xs text-amber-700">This slot is full — remove one to add another.</p>}

      {items.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-400">
          Nothing here yet.
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3">
          {items.map((item, i) => (
            <li key={item.id} className="rounded border border-neutral-200 p-1.5">
              <img
                src={thumbUrl(item)}
                alt=""
                loading="lazy"
                className="aspect-square w-full rounded bg-neutral-100 object-cover"
              />
              {minWidth && item.width < minWidth && (
                <p className="mt-1 text-[11px] text-amber-700">{item.width}px — small</p>
              )}
              <div className="mt-1 flex items-center justify-between">
                <div className="flex gap-0.5">
                  <Button variant="ghost" className="px-1.5 py-0.5" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier">
                    ←
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-1.5 py-0.5"
                    onClick={() => move(i, i + 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move later"
                  >
                    →
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="px-1.5 py-0.5 text-red-600"
                  onClick={() => onChange(ids.filter((id) => id !== item.id))}
                  aria-label="Remove"
                >
                  ✕
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaPicker
        library={library}
        open={picking}
        multiple
        onUpload={onUpload}
        title={`Add to: ${label}`}
        onPick={(picked) => {
          const additions = picked.map((m) => m.id).filter((id) => !ids.includes(id));
          onChange(max != null ? [...ids, ...additions].slice(0, max) : [...ids, ...additions]);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </div>
  );
}
