import fs from 'node:fs/promises';
import path from 'node:path';
import { ingestImage } from './images.js';
import { emptyContent, writeDraft, publish } from './content.js';
import { buildAbout } from './aboutSample.js';

/*
  First-run import of the images that are currently hard-coded into the pages,
  so the admin opens on the real site rather than an empty shell.

  This runs once, against src/assets. After it, src/assets is no longer what the
  site reads — the content document is. The files stay in the repo as the
  factory default, and as the source for a re-seed if the data directory is
  wiped during local testing.
*/

const ASSETS = (root, ...parts) => path.join(root, 'src', 'assets', ...parts);

/** Testimonial copy, lifted verbatim from the page it is moving out of. */
const PRAISE = [
  {
    name: 'Preet & Manny',
    files: ['praise-preet-a.jpg', 'praise-preet-b.jpg'],
    quote:
      "I'm someone who usually dislikes photography and videography, but my experience with this team was exceptional. They're passionate, respectful, and incredibly thorough. The final results speak for themselves-absolutely stunning. Hats off to the entire team!",
  },
  {
    name: 'Prithvi & Raghavi',
    files: ['praise-prithvi-a.jpg', 'praise-prithvi-b.jpg'],
    quote:
      'The Vows and Visuals team, thank you for the incredible work! The photos and videos are absolutely stunning and full of emotion.You captured every moment so beautifully, and we truly felt your passion and warmth throughout. We couldn’t have asked for a better team!',
  },
  {
    name: 'Poorvi & Jass',
    files: ['praise-poorvi-a.jpg', 'praise-poorvi-b.jpg'],
    quote:
      'The Vows and Visuals team were incredible! They captured our wedding beautifully, worked tirelessly, and felt like family throughout. One of the best choices we made.They captured our wedding beautifully, even with limited time for portraits, and created magic through their photos and videos. The wedding film makes us relive the day every time we watch it.',
  },
];

const STORIES = [
  { slug: 'kritasha-akhil', name: 'Kritasha & Akhil', banner: 'banner-01-kritasha-akhil.jpg', cover: 'story-01-kritasha-akhil.jpg', youtubeId: 'SQNIM3_y2pg' },
  { slug: 'payal-harsh', name: 'Payal & Harsh', banner: 'banner-02-payal-harsh.jpg', cover: 'story-02-payal-harsh.jpg', youtubeId: 'RwPTps6eATg' },
  { slug: 'kiran-sanjeev', name: 'Kiran & Sanjeev', banner: 'banner-03-kiran-sanjeev.jpg', cover: 'story-03-kiran-sanjeev.jpg', youtubeId: '6mH5K-GdnhA' },
  { slug: 'pavan-suchi', name: 'Pavan & Suchi', banner: 'banner-04-pavan-suchi.jpg', cover: 'story-04-pavan-suchi.jpg', youtubeId: 'jzhG7BCSCKE' },
];

const FILMS = [
  {
    youtubeId: '6mH5K-GdnhA',
    kind: 'Short Film',
    title: 'NIKHIL & RACHNA',
    description:
      'Through our lenses, we step beyond these limitations, honing in\non the emotions that define your story.\nWe capture the essence of who you are, creating memories that go\nbeyond labels and speak to the heart.',
  },
  {
    youtubeId: 'SQNIM3_y2pg',
    kind: 'Wedding Teaser',
    title: 'RAGINI & NIKHIL',
    description:
      'This isn’t just a film.\nIt’s the way your hands reached for each other in silence,\nthe joy in your parents’ eyes,\nthe way the world melted away when you said “I do.”\nWe create art that lets you relive',
  },
  {
    youtubeId: 'jzhG7BCSCKE',
    kind: 'Wedding',
    title: 'ANIRUDHA SHUCHI',
    description:
      'Our lens sees what words can’t say.\nFrom the chaos of getting ready to the stillness of your vows,\nwe capture not just the big moments, but the in-betweens too.',
  },
  {
    youtubeId: 'RwPTps6eATg',
    kind: 'Wedding Teaser',
    title: 'JAS & POORVI',
    description:
      'Your story is one of a kind — full of quirks, quiet magic, and\nmoments only you share.\nThat’s what we hold onto.\nA wedding film that doesn’t follow a formula, but follows you.\nReal, raw, and completely yours.',
  },
  {
    youtubeId: 'tHpjikPWD3s',
    kind: 'Wedding Teaser',
    title: 'PRITHVI & RAGHVI',
    description:
      'Every love story is made of a thousand little moments.\nThe soft smiles, the stolen glances, the way your fingers\nintertwined when no one was watching.',
  },
];

export async function seed({ storage, projectRoot, log = () => {} }) {
  const content = emptyContent();
  const byFile = new Map();

  const sorted = async (dir, test) =>
    (await fs.readdir(dir)).filter(test).sort((a, b) => a.localeCompare(b));

  /**
   * Ingest one asset, or return the id if it is already in.
   *
   * Keyed on the full path, not the basename: home/ and galleries/ both hold a
   * grid-01.jpg through grid-15.jpg, and keying on the name alone silently
   * collapsed the two sets so the Galleries wall showed the Home photos.
   */
  const add = async (absPath) => {
    const key = path.resolve(absPath);
    if (byFile.has(key)) return byFile.get(key);
    const buffer = await fs.readFile(absPath);
    const folder = path.basename(path.dirname(absPath));
    const media = await ingestImage({ storage, buffer, filename: `${folder}/${path.basename(absPath)}` });
    content.media[media.id] = media;
    byFile.set(key, media.id);
    return media.id;
  };

  // ---- Home -------------------------------------------------------------
  const homeDir = ASSETS(projectRoot, 'home');
  content.home.heroPosterId = await add(path.join(homeDir, 'hero-poster.jpg'));

  for (const file of await sorted(homeDir, (f) => /^grid-.*\.(jpg|png)$/i.test(f))) {
    content.home.gridIds.push(await add(path.join(homeDir, file)));
  }

  for (const pillar of content.home.pillars) {
    pillar.mediaId = await add(path.join(homeDir, `${pillar.key}.jpg`));
  }

  for (const [i, p] of PRAISE.entries()) {
    const mediaIds = [];
    for (const file of p.files) mediaIds.push(await add(path.join(homeDir, file)));
    content.home.praise.push({ id: `praise_${i + 1}`, name: p.name, quote: p.quote, mediaIds });
  }

  log(`home: ${content.home.gridIds.length} grid, ${content.home.praise.length} testimonials`);

  // ---- Galleries --------------------------------------------------------
  const galleriesDir = ASSETS(projectRoot, 'galleries');
  for (const file of await sorted(galleriesDir, (f) => /^hero-\d+\.jpg$/i.test(f))) {
    content.galleries.heroIds.push(await add(path.join(galleriesDir, file)));
  }

  const galleryPhotoIds = [];
  for (const file of await sorted(galleriesDir, (f) => /^grid-.*\.jpg$/i.test(f))) {
    galleryPhotoIds.push(await add(path.join(galleriesDir, file)));
  }
  // Everything starts ticked, matching the wall as it stands today.
  content.galleries.selectedIds = [...galleryPhotoIds];
  log(`galleries: ${content.galleries.heroIds.length} hero slides, ${galleryPhotoIds.length} photos`);

  // ---- Stories ----------------------------------------------------------
  const storiesDir = ASSETS(projectRoot, 'stories');
  const rotate = (arr, n) => {
    const k = ((n % arr.length) + arr.length) % arr.length;
    return arr.slice(k).concat(arr.slice(0, k));
  };

  for (const [i, s] of STORIES.entries()) {
    content.stories.push({
      id: `story_${i + 1}`,
      slug: s.slug,
      name: s.name,
      bannerId: await add(path.join(storiesDir, s.banner)),
      coverId: await add(path.join(homeDir, s.cover)),
      youtubeId: s.youtubeId,
      // Per-couple sets do not exist yet; the pages already share this pool.
      photoIds: rotate(galleryPhotoIds, i * 7),
    });
  }
  log(`stories: ${content.stories.length}`);

  // Anything left in the content folders joins the library unassigned — the two
  // extra Home story photos, and a few images the pages stopped referencing.
  // Nothing is dropped on the floor just because no slot points at it today.
  for (const folder of ['home', 'galleries', 'stories', 'footer', 'enquiry']) {
    const dir = ASSETS(projectRoot, folder);
    for (const file of await sorted(dir, (f) => /\.(jpe?g|png)$/i.test(f))) {
      await add(path.join(dir, file));
    }
  }

  // ---- Films, Enquiry, Footer -------------------------------------------
  content.films = FILMS.map((f, i) => ({
    id: `film_${i + 1}`,
    ...f,
    showOnHome: i < 4, // the Home page shows four reels today
  }));

  content.enquiry.heroId = await add(ASSETS(projectRoot, 'enquiry', 'hero.jpg'));

  const footerDir = ASSETS(projectRoot, 'footer');
  for (const file of await sorted(footerDir, (f) => /^footer-\d+\.jpg$/i.test(f))) {
    content.footer.thumbIds.push(await add(path.join(footerDir, file)));
  }

  // ---- About ------------------------------------------------------------
  // Placeholder people and copy, illustrated with photos already imported
  // above. The studio replaces all of it in the admin.
  const pool = Object.values(content.media);
  const portraits = pool.filter((m) => m.height > m.width);
  const wides = pool.filter((m) => m.width > m.height);
  const pick = (from, i) => (from.length ? from[i % from.length].id : (pool[i % pool.length]?.id ?? null));

  content.about = buildAbout({
    heroId: content.enquiry.heroId,
    pickPortrait: (i) => pick(portraits, i),
    pickWide: (i) => pick(wides, i + 1),
    reelIds: content.films.map((f) => f.youtubeId).filter(Boolean).slice(0, 3),
  });
  log(`about: ${content.about.people.length} people, ${content.about.places.length} places, ${content.about.faqs.length} FAQs`);

  await writeDraft(storage, content);
  const published = await publish(storage);
  log(`seeded ${Object.keys(content.media).length} images → version ${published.version}`);
  return published;
}
