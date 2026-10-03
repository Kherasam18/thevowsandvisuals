import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/*
  The site's content, fetched once as a single JSON document.

  Locally this comes from the dev server; in production it is a static file on
  the media domain, cached at the edge, with no backend in the request path.
  Either way the public site only ever reads — the admin is never between a
  visitor and the page.
*/

/** Where media and content live. Empty locally; the media domain in production. */
export const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE ?? '';

const CONTENT_URL = `${MEDIA_BASE}/content/published.json`;

const ContentContext = createContext(null);

export function ContentProvider({ children, value }) {
  // `value` lets the admin preview a draft through the real page components.
  const [state, setState] = useState(() =>
    value ? { status: 'ready', content: value, error: null } : { status: 'loading', content: null, error: null },
  );

  useEffect(() => {
    if (value) {
      setState({ status: 'ready', content: value, error: null });
      return undefined;
    }

    let cancelled = false;
    fetch(CONTENT_URL, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`content responded ${res.status}`);
        return res.json();
      })
      .then((content) => {
        if (!cancelled) setState({ status: 'ready', content, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', content: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  return <ContentContext.Provider value={state}>{children}</ContentContext.Provider>;
}

function useContentState() {
  const state = useContext(ContentContext);
  if (!state) throw new Error('useContent must be used inside <ContentProvider>');
  return state;
}

/** The content document, or null while loading. */
export function useContent() {
  return useContentState().content;
}

export function useContentStatus() {
  const { status, error } = useContentState();
  return { status, error };
}

/** Look up one media record by id. */
export function useMedia(id) {
  const content = useContent();
  return id && content ? (content.media[id] ?? null) : null;
}

/** Resolve a list of ids to records, skipping any that have gone missing. */
export function useMediaList(ids) {
  const content = useContent();
  return useMemo(() => {
    if (!content || !Array.isArray(ids)) return [];
    return ids.map((id) => content.media[id]).filter(Boolean);
  }, [content, ids]);
}
