/*
  The whole site's editable content is one JSON document.

  A database would buy very little here: the content is a few hundred records
  that are read as a unit on every page load and written by one person a few
  times a week. Keeping it as a single object means the public site can read a
  static file straight off the CDN with no backend in the request path, and
  "roll back" is just restoring an earlier copy of that file.

  Two copies exist. `draft` is what the admin edits; `published` is what the
  site serves. They are separate so that half-finished edits are never live.
*/

export const DRAFT_KEY = 'content/draft.json';
export const PUBLISHED_KEY = 'content/published.json';
const VERSION_PREFIX = 'content/versions/';

/** Keep the last N published copies for rollback. */
const KEEP_VERSIONS = 20;

export function emptyContent() {
  return {
    schema: 1,
    version: 0,
    updatedAt: null,
    media: {},
    home: {
      heroPosterId: null,
      heroVideoSrc: '/video/hero.mp4',
      gridIds: [],
      pillars: [
        { key: 'vibrant', label: 'VIBRANT', mediaId: null },
        { key: 'timeless', label: 'TIMELESS', mediaId: null },
        { key: 'authentic', label: 'AUTHENTIC', mediaId: null },
      ],
      praise: [],
    },
    stories: [],
    films: [],
    galleries: { heroIds: [], selectedIds: [] },
    enquiry: { heroId: null },
    footer: { thumbIds: [] },
    about: {
      heroId: null,
      heroLine: '',
      people: [],
      shoots: [],
      places: [],
      faqs: [],
    },
  };
}

/**
 * Fills in anything a stored document is missing.
 *
 * Content written by an older build of the admin outlives that build, so every
 * read is normalised rather than trusted to match the current shape.
 */
export function normalise(raw) {
  const base = emptyContent();
  if (!raw || typeof raw !== 'object') return base;

  const media = raw.media && typeof raw.media === 'object' ? raw.media : {};
  const has = (id) => typeof id === 'string' && Object.hasOwn(media, id);
  const ids = (value) => (Array.isArray(value) ? value.filter(has) : []);
  const list = (value, shape) => (Array.isArray(value) ? value.map(shape) : []);

  return {
    schema: base.schema,
    version: Number.isFinite(raw.version) ? raw.version : 0,
    updatedAt: raw.updatedAt ?? null,
    media,
    home: {
      heroPosterId: has(raw.home?.heroPosterId) ? raw.home.heroPosterId : null,
      heroVideoSrc: raw.home?.heroVideoSrc || base.home.heroVideoSrc,
      gridIds: ids(raw.home?.gridIds),
      pillars: base.home.pillars.map((fallback) => {
        const found = Array.isArray(raw.home?.pillars)
          ? raw.home.pillars.find((p) => p?.key === fallback.key)
          : null;
        return {
          key: fallback.key,
          label: found?.label || fallback.label,
          mediaId: has(found?.mediaId) ? found.mediaId : null,
        };
      }),
      praise: Array.isArray(raw.home?.praise)
        ? raw.home.praise.map((p, i) => ({
            id: p?.id || `praise_${i}`,
            name: p?.name ?? '',
            quote: p?.quote ?? '',
            mediaIds: ids(p?.mediaIds).slice(0, 2),
          }))
        : [],
    },
    stories: Array.isArray(raw.stories)
      ? raw.stories.map((s, i) => ({
          id: s?.id || `story_${i}`,
          slug: s?.slug || `story-${i + 1}`,
          name: s?.name ?? '',
          bannerId: has(s?.bannerId) ? s.bannerId : null,
          coverId: has(s?.coverId) ? s.coverId : null,
          youtubeId: s?.youtubeId ?? '',
          photoIds: ids(s?.photoIds),
        }))
      : [],
    films: Array.isArray(raw.films)
      ? raw.films.map((f, i) => ({
          id: f?.id || `film_${i}`,
          youtubeId: f?.youtubeId ?? '',
          kind: f?.kind ?? '',
          title: f?.title ?? '',
          description: f?.description ?? '',
          showOnHome: Boolean(f?.showOnHome),
        }))
      : [],
    galleries: {
      heroIds: ids(raw.galleries?.heroIds).slice(0, 3),
      selectedIds: ids(raw.galleries?.selectedIds),
    },
    enquiry: { heroId: has(raw.enquiry?.heroId) ? raw.enquiry.heroId : null },
    footer: { thumbIds: ids(raw.footer?.thumbIds).slice(0, 4) },
    about: {
      heroId: has(raw.about?.heroId) ? raw.about.heroId : null,
      heroLine: raw.about?.heroLine ?? '',
      people: list(raw.about?.people, (p, i) => ({
        id: p?.id || `person_${i}`,
        name: p?.name ?? '',
        line: p?.line ?? '',
        mediaId: has(p?.mediaId) ? p.mediaId : null,
      })),
      shoots: list(raw.about?.shoots, (s, i) => ({
        id: s?.id || `shoot_${i}`,
        youtubeId: s?.youtubeId ?? '',
        line: s?.line ?? '',
        // Reels are usually shot upright; a landscape clip would letterbox
        // badly in a 9:16 frame, so the shape is stored per clip.
        vertical: s?.vertical ?? true,
      })),
      places: list(raw.about?.places, (p, i) => ({
        id: p?.id || `place_${i}`,
        name: p?.name ?? '',
        note: p?.note ?? '',
        mediaId: has(p?.mediaId) ? p.mediaId : null,
      })),
      faqs: list(raw.about?.faqs, (f, i) => ({
        id: f?.id || `faq_${i}`,
        question: f?.question ?? '',
        answer: f?.answer ?? '',
      })),
    },
  };
}

/** The client's rule: at most four films may be flagged onto the Home page. */
export const MAX_HOME_FILMS = 4;

export function validate(content) {
  const errors = [];
  const shown = content.films.filter((f) => f.showOnHome).length;
  if (shown > MAX_HOME_FILMS) {
    errors.push(`${shown} films are set to show on Home; the maximum is ${MAX_HOME_FILMS}.`);
  }
  if (content.galleries.heroIds.length > 3) errors.push('Galleries takes at most 3 hero slides.');
  if (content.footer.thumbIds.length > 4) errors.push('The footer takes at most 4 images.');

  const slugs = content.stories.map((s) => s.slug);
  const duplicate = slugs.find((s, i) => slugs.indexOf(s) !== i);
  if (duplicate) errors.push(`Two stories share the web address "${duplicate}".`);

  return errors;
}

export async function readDraft(storage) {
  const raw = (await storage.getJson(DRAFT_KEY)) ?? (await storage.getJson(PUBLISHED_KEY));
  return normalise(raw);
}

export async function readPublished(storage) {
  return normalise(await storage.getJson(PUBLISHED_KEY));
}

export async function writeDraft(storage, content) {
  const next = { ...normalise(content), updatedAt: new Date().toISOString() };
  await storage.putJson(DRAFT_KEY, next);
  return next;
}

/** Promotes the draft to live, keeping the outgoing copy for rollback. */
export async function publish(storage) {
  const draft = await readDraft(storage);
  const errors = validate(draft);
  if (errors.length) {
    const err = new Error(errors.join(' '));
    err.statusCode = 400;
    throw err;
  }

  const previous = await storage.getJson(PUBLISHED_KEY);
  if (previous) {
    await storage.putJson(`${VERSION_PREFIX}${String(previous.version).padStart(6, '0')}.json`, previous);
  }

  const next = { ...draft, version: draft.version + 1, updatedAt: new Date().toISOString() };
  await storage.putJson(PUBLISHED_KEY, next);
  await storage.putJson(DRAFT_KEY, next);

  // Trim history oldest-first; keys are zero-padded so they sort chronologically.
  const versions = await storage.list(VERSION_PREFIX);
  for (const key of versions.slice(0, Math.max(0, versions.length - KEEP_VERSIONS))) {
    await storage.delete(key);
  }

  return next;
}

export async function listVersions(storage) {
  const keys = await storage.list(VERSION_PREFIX);
  const out = [];
  for (const key of keys) {
    const doc = await storage.getJson(key);
    if (doc) out.push({ key, version: doc.version, updatedAt: doc.updatedAt });
  }
  return out.reverse();
}

/** Loads an archived copy into the draft; the user then reviews and publishes. */
export async function restoreVersion(storage, key) {
  if (!key.startsWith(VERSION_PREFIX)) throw new Error('Not a version key');
  const doc = await storage.getJson(key);
  if (!doc) {
    const err = new Error('That version no longer exists.');
    err.statusCode = 404;
    throw err;
  }
  const current = await readPublished(storage);
  // Keep the live version number: restoring is an edit, not a rewind of history.
  return writeDraft(storage, { ...normalise(doc), version: current.version });
}

/**
 * How much storage the media is using.
 *
 * Summed from the content document rather than measured off the bucket, so the
 * figure is identical locally and on R2 and costs no extra requests. It counts
 * what the site owns: the untouched originals plus every generated copy.
 */
export function storageUsage(content) {
  let originals = 0;
  let variants = 0;
  let variantFiles = 0;

  for (const media of Object.values(content.media)) {
    originals += media.bytes ?? 0;
    for (const byWidth of Object.values(media.variants ?? {})) {
      for (const v of Object.values(byWidth)) {
        variants += v.bytes ?? 0;
        variantFiles += 1;
      }
    }
  }

  return {
    originals,
    variants,
    total: originals + variants,
    photos: Object.keys(content.media).length,
    variantFiles,
    // R2's Standard free allowance, for the gauge in the admin.
    freeTierBytes: 10 * 1024 ** 3,
  };
}

/**
 * Every place a given image is used, in words.
 *
 * Shown before a deletion so the choice is informed: "still in use" on its own
 * leaves someone hunting through six pages for it.
 */
export function mediaUsage(content, id) {
  if (!id) return [];
  const places = [];
  const at = (cond, label) => {
    if (cond) places.push(label);
  };

  at(content.home.heroPosterId === id, 'Home — hero still');
  at(content.home.gridIds.includes(id), 'Home — photo grid');
  for (const p of content.home.pillars) at(p.mediaId === id, `Home — ${p.label}`);
  for (const p of content.home.praise) {
    at(p.mediaIds.includes(id), `Home — testimonial from ${p.name || 'a couple'}`);
  }

  for (const s of content.stories) {
    const name = s.name || s.slug;
    at(s.bannerId === id, `Story "${name}" — banner`);
    at(s.coverId === id, `Story "${name}" — cover`);
    at(s.photoIds.includes(id), `Story "${name}" — photo`);
  }

  at(content.galleries.heroIds.includes(id), 'Galleries — hero slideshow');
  at(content.galleries.selectedIds.includes(id), 'Galleries — photo wall');
  at(content.enquiry.heroId === id, 'Enquire — banner');
  at(content.footer.thumbIds.includes(id), 'Footer');

  at(content.about.heroId === id, 'About — banner');
  for (const p of content.about.people) at(p.mediaId === id, `About — ${p.name || 'a person'}`);
  for (const p of content.about.places) at(p.mediaId === id, `About — ${p.name || 'a place'}`);

  return places;
}

/**
 * Strips every reference to these images out of a content document.
 *
 * Used when deleting images that pages still point at: the slots are emptied
 * rather than left holding ids for files that no longer exist.
 */
export function removeMediaReferences(content, ids) {
  const gone = new Set(ids);
  const keep = (list) => list.filter((x) => !gone.has(x));
  const clear = (id) => (gone.has(id) ? null : id);

  content.home.heroPosterId = clear(content.home.heroPosterId);
  content.home.gridIds = keep(content.home.gridIds);
  content.home.pillars.forEach((p) => {
    p.mediaId = clear(p.mediaId);
  });
  content.home.praise.forEach((p) => {
    p.mediaIds = keep(p.mediaIds);
  });

  content.stories.forEach((s) => {
    s.bannerId = clear(s.bannerId);
    s.coverId = clear(s.coverId);
    s.photoIds = keep(s.photoIds);
  });

  content.galleries.heroIds = keep(content.galleries.heroIds);
  content.galleries.selectedIds = keep(content.galleries.selectedIds);
  content.enquiry.heroId = clear(content.enquiry.heroId);
  content.footer.thumbIds = keep(content.footer.thumbIds);

  content.about.heroId = clear(content.about.heroId);
  content.about.people.forEach((p) => {
    p.mediaId = clear(p.mediaId);
  });
  content.about.places.forEach((p) => {
    p.mediaId = clear(p.mediaId);
  });

  for (const id of gone) delete content.media[id];
  return content;
}

/** Media ids not referenced anywhere — surfaced in the admin, never auto-deleted. */
export function unusedMediaIds(content) {
  const used = new Set();
  const add = (id) => id && used.add(id);

  add(content.home.heroPosterId);
  content.home.gridIds.forEach(add);
  content.home.pillars.forEach((p) => add(p.mediaId));
  content.home.praise.forEach((p) => p.mediaIds.forEach(add));
  content.stories.forEach((s) => {
    add(s.bannerId);
    add(s.coverId);
    s.photoIds.forEach(add);
  });
  content.galleries.heroIds.forEach(add);
  content.galleries.selectedIds.forEach(add);
  add(content.enquiry.heroId);
  content.footer.thumbIds.forEach(add);
  add(content.about.heroId);
  content.about.people.forEach((p) => add(p.mediaId));
  content.about.places.forEach((p) => add(p.mediaId));

  return Object.keys(content.media).filter((id) => !used.has(id));
}
