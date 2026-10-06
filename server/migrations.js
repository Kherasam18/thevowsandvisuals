import { buildAbout } from './aboutSample.js';
import { readDraft, readPublished, writeDraft, PUBLISHED_KEY } from './content.js';

/*
  Content written before a feature existed has to be brought forward, because
  the stored document outlives the build that wrote it. `normalise` already
  fills missing keys with empty defaults so nothing crashes; these migrations
  go one step further and put usable starting content in place.

  Each one must be safe to run on every boot: they check whether the work is
  already done before doing it.
*/

/**
 * Gives the About page starting content if it has none.
 *
 * Images are borrowed from whatever is already in the library rather than
 * added, so this never invents files. The studio replaces them in the admin.
 */
async function ensureAboutContent(storage, log) {
  const draft = await readDraft(storage);
  const about = draft.about;

  // Already populated by a previous run, a seed, or the studio.
  if (about.people.length || about.places.length || about.faqs.length) return false;

  const all = Object.values(draft.media);
  if (!all.length) return false;

  const portraits = all.filter((m) => m.height > m.width);
  const wides = all.filter((m) => m.width > m.height);
  const pick = (pool, i) => (pool.length ? pool[i % pool.length].id : (all[i % all.length]?.id ?? null));

  draft.about = buildAbout({
    // The studio asked to start with the Enquire banner here.
    heroId: draft.enquiry.heroId ?? pick(wides, 0),
    pickPortrait: (i) => pick(portraits, i),
    pickWide: (i) => pick(wides, i + 1),
    // Stand-in clips: the films already on the site, until real
    // behind-the-scenes footage is uploaded to YouTube.
    reelIds: draft.films.map((f) => f.youtubeId).filter(Boolean).slice(0, 3),
  });

  await writeDraft(storage, draft);
  log(`about: added starting content (${draft.about.people.length} people, ${draft.about.faqs.length} FAQs)`);
  return true;
}

/** Runs every migration. Safe to call on each boot. */
export async function migrate({ storage, log = () => {} }) {
  // Nothing to migrate before the first seed has run.
  if (!(await storage.get(PUBLISHED_KEY))) return;
  await ensureAboutContent(storage, log);
}
