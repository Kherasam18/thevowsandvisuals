import banner1 from '../assets/stories/banner-01-kritasha-akhil.jpg';
import banner2 from '../assets/stories/banner-02-payal-harsh.jpg';
import banner3 from '../assets/stories/banner-03-kiran-sanjeev.jpg';
import banner4 from '../assets/stories/banner-04-pavan-suchi.jpg';

/*
  Per-story data for the /stories list and each /stories/:slug detail page.

  Each story has a banner with the couple's name burnt into the artwork
  (assets/stories) and a placeholder wedding film (reusing the Home reel ids).

  Real per-couple photo sets don't exist yet, so every gallery is drawn from the
  shared generic pool below and rotated by a per-story offset just so they don't
  look identical. When real photos are ready, give each story its own `gallery`.
*/
const POOL = Object.entries(
  import.meta.glob('../assets/galleries/grid-*.jpg', { eager: true, import: 'default' }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src]) => src);

const rotate = (arr, n) => {
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
};

export const STORIES = [
  { slug: 'kritasha-akhil', name: 'Kritasha & Akhil', banner: banner1, filmId: 'SQNIM3_y2pg' },
  { slug: 'payal-harsh', name: 'Payal & Harsh', banner: banner2, filmId: 'RwPTps6eATg' },
  { slug: 'kiran-sanjeev', name: 'Kiran & Sanjeev', banner: banner3, filmId: '6mH5K-GdnhA' },
  { slug: 'pavan-suchi', name: 'Pavan & Suchi', banner: banner4, filmId: 'jzhG7BCSCKE' },
].map((story, i) => ({ ...story, gallery: rotate(POOL, i * 7) }));

/** A story plus its wrapping neighbours, for the Previous / Next nav. Null if unknown. */
export function getStoryBySlug(slug) {
  const index = STORIES.findIndex((s) => s.slug === slug);
  if (index === -1) return null;
  return {
    story: STORIES[index],
    prev: STORIES[(index - 1 + STORIES.length) % STORIES.length],
    next: STORIES[(index + 1) % STORIES.length],
  };
}
