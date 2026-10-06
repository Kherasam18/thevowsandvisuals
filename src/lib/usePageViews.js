import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reports each route change to Google Analytics.
 *
 * A single-page app only loads the document once, so the analytics tag's own
 * automatic page view fires for the first page of a visit and never again —
 * every later page would be invisible, and time-on-page would be wrong. The tag
 * is configured with `send_page_view: false` and this sends them instead.
 *
 * Does nothing when no measurement id is configured, which is the case locally
 * and in previews.
 */
export default function usePageViews() {
  const location = useLocation();

  useEffect(() => {
    const gtag = typeof window !== 'undefined' ? window.gtag : undefined;
    if (typeof gtag !== 'function') return;

    gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);
}
