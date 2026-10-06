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

/*
  `?preview=draft` renders the site from unpublished content.

  Without it the only way to see an edit is to publish it, which means the
  first look at a change is also the moment it goes live — exactly backwards.
  The draft lives behind the admin API, so in production this asks for a
  resource a visitor cannot read; that request simply fails and the live
  content is shown instead.
*/
const isPreview = () =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('preview') === 'draft';

const ContentContext = createContext(null);

export function ContentProvider({ children, value }) {
  // `value` lets the admin render a draft through the real page components.
  const [state, setState] = useState(() =>
    value
      ? { status: 'ready', content: value, error: null, preview: false }
      : { status: 'loading', content: null, error: null, preview: false },
  );

  useEffect(() => {
    if (value) {
      setState({ status: 'ready', content: value, error: null, preview: false });
      return undefined;
    }

    let cancelled = false;
    const preview = isPreview();

    const load = (url, asPreview) =>
      fetch(url, { cache: 'no-cache' }).then((res) => {
        if (!res.ok) throw new Error(`content responded ${res.status}`);
        return res.json().then((content) => ({ content, asPreview }));
      });

    const request = preview
      ? // Fall back to live content if the draft cannot be read, so a stray
        // ?preview=draft on the public site degrades instead of breaking.
        load('/api/content', true).catch(() => load(CONTENT_URL, false))
      : load(CONTENT_URL, false);

    request
      .then(({ content, asPreview }) => {
        if (!cancelled) setState({ status: 'ready', content, error: null, preview: asPreview });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', content: null, error, preview: false });
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
  const { status, error, preview } = useContentState();
  return { status, error, preview };
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
