import { useCallback, useEffect, useMemo, useState } from 'react';

/*
  Admin state.

  The whole content document is held in memory and saved back as a unit. That
  keeps editing simple — no per-field endpoints, no partial-update merge rules —
  and it matches how the document is stored and published.

  Saves are debounced and the draft is separate from what the site serves, so
  nothing reaches visitors until Publish is pressed.
*/

const SAVE_DEBOUNCE_MS = 700;

const json = async (url, options) => {
  const res = await fetch(url, options);
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body;
};

export function useAdminStore() {
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | idle | saving | error
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [dirty, setDirty] = useState(false);

  const refreshMeta = useCallback(async () => {
    try {
      setMeta(await json('/api/status'));
    } catch {
      /* status is informational; a failure here must not block editing */
    }
  }, []);

  useEffect(() => {
    json('/api/content')
      .then((doc) => {
        setContent(doc);
        setStatus('idle');
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
    refreshMeta();
  }, [refreshMeta]);

  // Debounced autosave. Edits land in state immediately so typing stays
  // responsive; the write follows once there is a pause.
  useEffect(() => {
    if (!dirty || !content) return undefined;
    const timer = setTimeout(async () => {
      setStatus('saving');
      try {
        await json('/api/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(content),
        });
        setDirty(false);
        setStatus('idle');
        setError(null);
        refreshMeta();
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [content, dirty, refreshMeta]);

  /** Apply a change to the draft. `recipe` receives a mutable copy. */
  const update = useCallback((recipe) => {
    setContent((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      recipe(next);
      return next;
    });
    setDirty(true);
  }, []);

  const publish = useCallback(async () => {
    setStatus('saving');
    try {
      // Flush any pending edit first, so Publish never ships a stale draft.
      if (dirty) {
        await json('/api/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(content),
        });
        setDirty(false);
      }
      const published = await json('/api/publish', { method: 'POST' });
      setContent(published);
      setStatus('idle');
      setError(null);
      await refreshMeta();
      return published;
    } catch (err) {
      setError(err.message);
      setStatus('error');
      throw err;
    }
  }, [content, dirty, refreshMeta]);

  const uploadFiles = useCallback(
    async (files, onProgress) => {
      const added = [];
      const failed = [];

      for (const [i, file] of [...files].entries()) {
        onProgress?.({ index: i, total: files.length, name: file.name });
        try {
          const media = await json('/api/media', {
            method: 'POST',
            headers: { 'X-Filename': encodeURIComponent(file.name) },
            body: file,
          });
          added.push(media);
        } catch (err) {
          failed.push(`${file.name}: ${err.message}`);
        }
      }

      if (added.length) {
        // The server already stored these; mirror them locally without
        // marking the draft dirty, or the next save would echo them back.
        setContent((current) => {
          if (!current) return current;
          const next = structuredClone(current);
          for (const media of added) next.media[media.id] = media;
          return next;
        });
        refreshMeta();
      }

      return { added, failed };
    },
    [refreshMeta],
  );

  const deleteMedia = useCallback(
    async (id) => {
      await json(`/api/media/${id}`, { method: 'DELETE' });
      setContent((current) => {
        if (!current) return current;
        const next = structuredClone(current);
        delete next.media[id];
        return next;
      });
      refreshMeta();
    },
    [refreshMeta],
  );

  const patchMedia = useCallback(async (id, patch) => {
    const media = await json(`/api/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setContent((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      next.media[id] = media;
      return next;
    });
  }, []);

  /** Images sorted newest first — what the library and pickers show. */
  const library = useMemo(() => {
    if (!content) return [];
    return Object.values(content.media).sort((a, b) =>
      (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''),
    );
  }, [content]);

  return {
    content,
    library,
    status,
    error,
    meta,
    dirty,
    update,
    publish,
    uploadFiles,
    deleteMedia,
    patchMedia,
    refreshMeta,
    restoreVersion: async (key) => {
      const doc = await json('/api/versions/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      setContent(doc);
      setDirty(false);
      refreshMeta();
    },
    listVersions: () => json('/api/versions'),
  };
}
