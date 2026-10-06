import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useContent } from '../content/ContentProvider';
import { metaFor } from '../data/pageMeta';

/**
 * Keeps the document title and description in step with the route, and reports
 * each page view to Google Analytics.
 *
 * Both halves exist because of the same thing: the browser only loads the
 * document once. The prerendered HTML carries the right title for whichever
 * URL was opened, but moving between pages after that changes neither the
 * title nor anything the analytics tag notices — so every later page would be
 * recorded under the first page's name, and the browser tab would keep showing
 * it too. The tag is configured with `send_page_view: false` and this sends
 * the page views instead, after the title is correct.
 */
export default function usePageViews() {
  const location = useLocation();
  const content = useContent();

  useEffect(() => {
    const { title, description } = metaFor(location.pathname, content);

    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);

    const gtag = typeof window !== 'undefined' ? window.gtag : undefined;
    if (typeof gtag !== 'function') return;

    gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: title,
    });
    // `content` is included because a story's title depends on it, and it
    // arrives a moment after the first render.
  }, [location.pathname, location.search, content]);
}
