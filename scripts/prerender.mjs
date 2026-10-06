import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUSINESS, locationLine } from '../src/data/business.js';

/*
  Writes a real HTML file for every page, plus robots.txt and sitemap.xml.

  A client-side app ships one index.html for every URL: the same title, the
  same empty <body>, and structured data that only exists once React has run.
  Google can execute JavaScript, but does so on a second pass; most AI
  assistants do not execute it at all and simply read what the server sent.
  Before this ran, that was 893 bytes containing no words.

  So each route gets its own <head> and a <noscript> copy of its text. The
  noscript content is the same content the page renders — written out for
  agents that cannot run the app, not different content shown to crawlers.

  Content comes from the published document, so the descriptions and the story
  pages follow whatever the studio has published. Republishing content the
  pages describe means rebuilding; a deploy hook from the admin would automate
  that, and is noted in the handover rather than assumed here.
*/

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');
const SITE = BUSINESS.url;

const escape = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Trimmed to the length search results actually show. */
const clamp = (s, n = 155) => {
  const text = String(s).replace(/\s+/g, ' ').trim();
  return text.length <= n ? text : `${text.slice(0, n - 1).replace(/[\s,.;]+\S*$/, '')}…`;
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
const mediaBase = process.env.VITE_MEDIA_BASE || '';

async function loadContent() {
  const local = path.join(projectRoot, '.data', 'content', 'published.json');
  if (fs.existsSync(local)) {
    console.log('  content: local .data');
    return JSON.parse(fs.readFileSync(local, 'utf8'));
  }
  if (mediaBase) {
    const res = await fetch(`${mediaBase}/content/published.json`);
    if (res.ok) {
      console.log(`  content: ${mediaBase}`);
      return res.json();
    }
    console.warn(`  content: ${mediaBase} responded ${res.status}`);
  }
  // Pages still get correct metadata; only the per-story ones are skipped.
  console.warn('  content: none found — building pages without story URLs');
  return null;
}

const content = await loadContent();

/** A representative image for social previews. */
const socialImage = (() => {
  if (!content || !mediaBase) return null;
  const media = content.media?.[content.about?.heroId] ?? Object.values(content.media ?? {})[0];
  if (!media?.variants?.webp) return null;
  const widths = Object.keys(media.variants.webp).map(Number).sort((a, b) => b - a);
  const best = widths.find((w) => w <= 1440) ?? widths[0];
  return `${mediaBase}/media/variants/${media.id}-${best}.webp`;
})();

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------

/*
  The studio itself. `LocalBusiness` with a real locality is what makes the site
  eligible for "wedding photographer in <place>" at all; areaServed is separate
  from address, because they shoot far from where they are based.
*/
const businessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE}/#business`,
  additionalType: 'https://schema.org/PhotographAction',
  name: BUSINESS.name,
  description: BUSINESS.tagline,
  url: SITE,
  telephone: BUSINESS.telephone,
  email: BUSINESS.email,
  address: {
    '@type': 'PostalAddress',
    addressLocality: BUSINESS.address.locality,
    addressRegion: BUSINESS.address.region,
    addressCountry: BUSINESS.address.countryCode,
  },
  areaServed: BUSINESS.areasServed.map((a) => ({ '@type': a.type, name: a.name })),
  sameAs: BUSINESS.socials,
  ...(socialImage ? { image: socialImage } : {}),
  knowsAbout: [
    'Wedding photography',
    'Wedding videography',
    'Destination wedding photography',
    'Pre-wedding shoots',
    'Indian wedding photography',
  ],
};

const faqSchema = () => {
  const faqs = (content?.about?.faqs ?? []).filter((f) => f.question?.trim() && f.answer?.trim());
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
};

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------
const where = 'India, Dubai, Thailand and Bali';

const pages = [
  {
    route: '/',
    title: `${BUSINESS.name} — Wedding Photographer in ${BUSINESS.address.locality}, ${BUSINESS.address.region}`,
    description: BUSINESS.tagline,
    priority: '1.0',
    body: [
      `${BUSINESS.name} is a wedding photography and film studio based in ${locationLine()}.`,
      `We photograph and film weddings across ${where}.`,
      content?.home?.praise?.[0]?.quote ?? '',
    ],
  },
  {
    route: '/stories',
    title: `Real Weddings — ${BUSINESS.name}`,
    description: `Full wedding stories photographed by ${BUSINESS.name} across ${where}.`,
    priority: '0.9',
    body: (content?.stories ?? []).map((s) => s.name).filter(Boolean),
  },
  {
    route: '/films',
    title: `Wedding Films — ${BUSINESS.name}`,
    description: `Wedding films and teasers by ${BUSINESS.name}, a studio based in ${locationLine()}.`,
    priority: '0.8',
    body: (content?.films ?? []).map((f) => [f.title, f.kind].filter(Boolean).join(' — ')),
  },
  {
    route: '/galleries',
    title: `Wedding Photography Galleries — ${BUSINESS.name}`,
    description: `Selected wedding photographs by ${BUSINESS.name}, shot across ${where}.`,
    priority: '0.8',
    body: ['Step into a world where love twirls in slow motion, trapped in the misty haze of time.'],
  },
  {
    route: '/about',
    title: `About — Wedding Photographers in ${BUSINESS.address.locality}, ${BUSINESS.address.region}`,
    description: clamp(
      content?.about?.heroLine ||
        `Meet the team behind ${BUSINESS.name}, photographing weddings across ${where}.`,
    ),
    priority: '0.7',
    schema: faqSchema(),
    body: [
      content?.about?.heroLine ?? '',
      ...(content?.about?.people ?? []).map((p) => [p.name, p.line].filter(Boolean).join(' — ')),
      ...(content?.about?.places ?? []).map((p) => [p.name, p.note].filter(Boolean).join(' — ')),
      // The questions and answers verbatim: this is the part an assistant quotes.
      ...(content?.about?.faqs ?? []).flatMap((f) => [f.question, f.answer]),
    ],
  },
  {
    route: '/enquiry',
    title: `Enquire — ${BUSINESS.name}`,
    description: `Check availability with ${BUSINESS.name} for a wedding in ${where}.`,
    priority: '0.6',
    body: [`Tell us about your wedding. We are based in ${locationLine()} and travel for weddings.`],
  },
  // One page per published story.
  ...(content?.stories ?? [])
    .filter((s) => s.slug && s.name)
    .map((s) => ({
      route: `/stories/${s.slug}`,
      title: `${s.name} — Wedding Story by ${BUSINESS.name}`,
      description: clamp(
        `The wedding of ${s.name}, photographed by ${BUSINESS.name}. ${s.photoIds?.length ?? 0} photographs${s.youtubeId ? ' and a wedding film' : ''}.`,
      ),
      priority: '0.7',
      body: [`The wedding of ${s.name}, photographed by ${BUSINESS.name}.`],
    })),
];

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

/*
  Google Analytics, only when a measurement id is configured.

  Injected here rather than written into index.html so the id is configuration
  rather than source, and so local builds and previews carry no tracking at all.
*/
const gaId = process.env.GA_MEASUREMENT_ID;
const analyticsTag = gaId
  ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>\n  <script>` +
    `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
    `gtag('js',new Date());` +
    // send_page_view off: this is a single-page app, so the app reports each
    // route change itself. Left on, only the first page of a visit is counted.
    `gtag('config','${gaId}',{send_page_view:false});` +
    `</script>`
  : '';

const headFor = (page) => {
  const canonical = `${SITE}${page.route === '/' ? '' : page.route}`;
  const schemas = [businessSchema, page.schema].filter(Boolean);

  return [
    analyticsTag,
    `<title>${escape(page.title)}</title>`,
    `<meta name="description" content="${escape(clamp(page.description))}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escape(BUSINESS.name)}" />`,
    `<meta property="og:title" content="${escape(page.title)}" />`,
    `<meta property="og:description" content="${escape(clamp(page.description))}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    socialImage ? `<meta property="og:image" content="${socialImage}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...schemas.map(
      (s) =>
        `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`,
    ),
  ]
    .filter(Boolean)
    .join('\n  ');
};

/** The page's own words, for agents that never run the app. */
const noscriptFor = (page) => {
  const lines = (page.body ?? []).map((t) => String(t).trim()).filter(Boolean);
  if (!lines.length) return '';
  return `<noscript><h1>${escape(page.title)}</h1>${lines
    .map((t) => `<p>${escape(t)}</p>`)
    .join('')}</noscript>`;
};

let written = 0;
for (const page of pages) {
  const html = template
    // Replace the single generic title and description with this page's own.
    .replace(/<title>.*?<\/title>/s, '__HEAD__')
    .replace(/\s*<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace('__HEAD__', headFor(page))
    .replace('<div id="root"></div>', `<div id="root"></div>\n  ${noscriptFor(page)}`);

  const target =
    page.route === '/'
      ? path.join(distDir, 'index.html')
      : path.join(distDir, page.route.replace(/^\//, ''), 'index.html');

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  written += 1;
}

// robots.txt and sitemap.xml must be real files: the single-page-application
// fallback answers any unknown path with the app's HTML, so without these on
// disk a crawler asking for /robots.txt is handed a web page.
const today = new Date().toISOString().slice(0, 10);

fs.writeFileSync(
  path.join(distDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map(
      (p) =>
        `  <url><loc>${SITE}${p.route === '/' ? '/' : p.route}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`,
    )
    .join('\n')}\n</urlset>\n`,
);

fs.writeFileSync(
  path.join(distDir, 'robots.txt'),
  `User-agent: *\nAllow: /\n\n# The admin is a separate host and must never be indexed.\nDisallow: /admin\n\nSitemap: ${SITE}/sitemap.xml\n`,
);

console.log(`  prerendered ${written} pages, sitemap.xml (${pages.length} urls), robots.txt`);
