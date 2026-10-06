// Explicit extension: this module is imported both by Vite, which resolves
// extensionless paths, and by the build script running under plain Node, which
// does not.
import { BUSINESS, locationLine } from './business.js';

/*
  The title and description for a given route.

  Shared by two callers that must agree: the build script, which writes them
  into each prerendered HTML file for crawlers, and the running app, which sets
  them again when someone navigates between pages without a reload. Written in
  one place because a mismatch would mean search engines and visitors — and the
  analytics report — seeing different titles for the same page.
*/

const WHERE = 'India, Dubai, Thailand and Bali';

/** Trimmed to the length search results actually show. */
export const clamp = (s, n = 155) => {
  const text = String(s ?? '').replace(/\s+/g, ' ').trim();
  return text.length <= n ? text : `${text.slice(0, n - 1).replace(/[\s,.;]+\S*$/, '')}…`;
};

const STATIC = {
  '/': {
    title: `${BUSINESS.name} — Wedding Photographer in ${BUSINESS.address.locality}, ${BUSINESS.address.region}`,
    description: BUSINESS.tagline,
  },
  '/stories': {
    title: `Real Weddings — ${BUSINESS.name}`,
    description: `Full wedding stories photographed by ${BUSINESS.name} across ${WHERE}.`,
  },
  '/films': {
    title: `Wedding Films — ${BUSINESS.name}`,
    description: `Wedding films and teasers by ${BUSINESS.name}, a studio based in ${locationLine()}.`,
  },
  '/galleries': {
    title: `Wedding Photography Galleries — ${BUSINESS.name}`,
    description: `Selected wedding photographs by ${BUSINESS.name}, shot across ${WHERE}.`,
  },
  '/about': {
    title: `About — Wedding Photographers in ${BUSINESS.address.locality}, ${BUSINESS.address.region}`,
    description: `Meet the team behind ${BUSINESS.name}, photographing weddings across ${WHERE}.`,
  },
  '/enquiry': {
    title: `Enquire — ${BUSINESS.name}`,
    description: `Check availability with ${BUSINESS.name} for a wedding in ${WHERE}.`,
  },
};

export function metaFor(pathname, content = null) {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';

  // A couple's own page, when that story is published.
  if (path.startsWith('/stories/')) {
    const slug = path.slice('/stories/'.length);
    const story = (content?.stories ?? []).find((s) => s.slug === slug);
    if (story?.name) {
      return {
        title: `${story.name} — Wedding Story by ${BUSINESS.name}`,
        description: clamp(
          `The wedding of ${story.name}, photographed by ${BUSINESS.name}. ` +
            `${story.photoIds?.length ?? 0} photographs${story.youtubeId ? ' and a wedding film' : ''}.`,
        ),
      };
    }
    // Unpublished or unknown slug: the generic page title is better than a
    // title naming a couple who may not be on the site.
    return STATIC['/stories'];
  }

  const found = STATIC[path];
  if (found) return { title: found.title, description: clamp(found.description) };

  // Unknown path — the app shows Home there.
  return { title: STATIC['/'].title, description: clamp(STATIC['/'].description) };
}

/** Routes with a fixed address, for the sitemap and prerender. */
export const STATIC_ROUTES = Object.keys(STATIC);
