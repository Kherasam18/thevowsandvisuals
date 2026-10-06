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

export function useAdminStore() {
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | idle | saving | error
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [auth, setAuth] = useState({ status: 'checking', email: null, configured: true });

  /**
   * Every call to the API goes through here.
   *
   * A 401 can arrive at any moment — a session lasts a week and the server may
   * restart — so it is handled in one place: the UI drops back to the sign-in
   * screen instead of each caller inventing its own failure message.
   */
  const json = useCallback(async (url, options) => {
    const res = await fetch(url, options);
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;

    if (res.status === 401) {
      setAuth((a) => ({ ...a, status: 'signed-out', email: null }));
      throw new Error('Your session has ended. Please sign in again.');
    }
    if (!res.ok) {
      // Carry the whole body: a refusal often explains itself with structured
      // detail the caller needs, such as which images are still in use.
      const err = new Error(body?.error ?? `Request failed (${res.status})`);
      err.status = res.status;
      err.details = body;
      throw err;
    }
    return body;
  }, []);

  const refreshMeta = useCallback(async () => {
    try {
      setMeta(await json('/api/status'));
    } catch {
      /* status is informational; a failure here must not block editing */
    }
  }, [json]);

  // Who is signed in, before anything else is asked for.
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((me) =>
        setAuth({
          status: me.signedIn ? 'signed-in' : 'signed-out',
          email: me.email ?? null,
          configured: me.configured !== false,
        }),
      )
      .catch(() => setAuth({ status: 'signed-out', email: null, configured: true }));
  }, []);

  const signIn = useCallback(
    async (email, password) => {
      const me = await json('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      setAuth({ status: 'signed-in', email: me.email, configured: true });
      setStatus('loading');
    },
    [json],
  );

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuth({ status: 'signed-out', email: null, configured: true });
      setContent(null);
      setDirty(false);
    }
  }, []);

  useEffect(() => {
    if (auth.status !== 'signed-in') return;
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
  }, [auth.status, json, refreshMeta]);

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
  }, [content, dirty, json, refreshMeta]);

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
  }, [content, dirty, json, refreshMeta]);

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
    [json, refreshMeta],
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
    [json, refreshMeta],
  );

  /**
   * Delete several images outright.
   *
   * Without `force` the server refuses if any are still used and reports where;
   * with it, the references are stripped and the files removed.
   */
  const deleteMediaBulk = useCallback(
    async (ids, force = false) => {
      const result = await json('/api/media/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, force }),
      });
      // The server rewrote the draft; take its version rather than guessing
      // which slots were emptied.
      setContent(await json('/api/content'));
      setDirty(false);
      refreshMeta();
      return result;
    },
    [json, refreshMeta],
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
  }, [json]);

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
    auth,
    signIn,
    signOut,
    update,
    publish,
    uploadFiles,
    deleteMedia,
    deleteMediaBulk,
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
