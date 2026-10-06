/*
  Starting content for the About page.

  Everything here is a placeholder the studio is expected to replace — the
  people are not real, and the numbers in the answers are industry-typical
  rather than this studio's. The admin panel says so at the top of the page,
  because an unchecked answer about delivery times is a promise to a customer.

  The questions are written as the phrases couples actually type or ask aloud,
  and each answer leads with the answer in its first sentence and stands on its
  own. That is what search engines and AI assistants can lift cleanly; an answer
  that begins "It depends…" or refers back to another question cannot be quoted.
*/

export const HERO_LINE =
  'A small team photographing and filming weddings across India and beyond.';

export const PEOPLE = [
  {
    name: 'Kashish',
    line: 'Lead photographer. Shoots quietly, mostly from the edges of a room, and has never once asked a family to re-enter a mandap for a second take.',
  },
  {
    name: 'Naman',
    line: 'Films the day and cuts it afterwards. Spends longer choosing the music for a wedding film than most people spend choosing a venue.',
  },
  {
    name: 'Priya',
    line: 'Second shooter and the person you will speak to about timelines. Keeps a wedding running when the schedule has long stopped pretending.',
  },
];

/* `vertical: false` because the stand-in clips are the existing 16:9 wedding
   films. Real behind-the-scenes reels are shot upright, and new entries default
   to that. */
export const SHOOTS = [
  { line: 'We shoot the day as it happens, and stay out of the way while it does.', vertical: false },
  { line: 'Portraits are guided, never posed — a few minutes, not an hour.', vertical: false },
  { line: 'Stills and film are shot by one team, so neither waits on the other.', vertical: false },
];

export const PLACES = [
  { name: 'India', note: 'Delhi, Jaipur, Udaipur and wherever the family is from.' },
  { name: 'Dubai', note: 'Beach and ballroom weddings across the UAE.' },
  { name: 'Thailand', note: 'Phuket and Koh Samui, usually over three or four days.' },
  { name: 'Bali', note: 'Clifftop ceremonies and the long golden hour after them.' },
];

export const FAQS = [
  {
    question: 'Do you travel for destination weddings?',
    answer:
      'Yes. The Vows and Visuals photographs and films destination weddings across India, Dubai, Thailand and Bali, and travels further on request. Travel and accommodation are quoted separately once your dates and venues are confirmed, so nothing is added to the bill later.',
  },
  {
    question: 'How far in advance should we book a wedding photographer?',
    answer:
      'Most couples book six to twelve months ahead. Peak season dates in India, roughly November to February, tend to go earliest. If your wedding is sooner than that it is still worth asking, because dates do open up.',
  },
  {
    question: 'Do you cover both photography and videography?',
    answer:
      'Yes, and with one team rather than two. Photographs and the wedding film are captured together, so neither crew is working around the other or blocking the other’s shot. Both are included unless you ask for one on its own.',
  },
  {
    question: 'When will we receive our wedding photos and film?',
    answer:
      'Edited photographs are delivered within six to eight weeks, and the wedding film within ten to twelve weeks. A short preview set follows within a few days of the wedding so you have something to share while the full set is being finished.',
  },
  {
    question: 'How many photos will we receive?',
    answer:
      'A full Indian wedding usually produces between 400 and 600 edited photographs across all events. Every delivered image is individually colour-corrected and finished; the set is not padded with near-duplicates of the same moment.',
  },
  {
    question: 'We are not comfortable in front of a camera. Can you still photograph us?',
    answer:
      'Yes, and this is the most common thing couples tell us before a wedding. Most of the day is photographed as it happens, with no direction at all. For portraits we guide you into natural positions rather than posing you, and keep that part of the day short.',
  },
  {
    question: 'What happens if the wedding schedule runs late?',
    answer:
      'The coverage is built around that, because Indian weddings rarely run to plan. We follow the events rather than the clock, and will tell you in advance where a delay would cost you daylight, so you can decide what matters most.',
  },
  {
    question: 'Do you shoot pre-wedding shoots?',
    answer:
      'Yes. Pre-wedding shoots can be booked on their own or alongside wedding coverage, in India or at a destination. They are also the easiest way to get comfortable being photographed before the wedding itself.',
  },
];

/**
 * Builds the About block.
 *
 * `pickPortrait` and `pickWide` hand back a media id from whatever is already
 * in the library, so the page has images to lay out without inventing files.
 * `reelIds` reuses existing films as stand-in behind-the-scenes clips.
 */
export function buildAbout({ heroId = null, pickPortrait, pickWide, reelIds = [] }) {
  return {
    heroId,
    heroLine: HERO_LINE,
    people: PEOPLE.map((p, i) => ({ id: `person_${i + 1}`, ...p, mediaId: pickPortrait(i) })),
    shoots: SHOOTS.map((s, i) => ({ id: `shoot_${i + 1}`, youtubeId: reelIds[i] ?? '', ...s })),
    places: PLACES.map((p, i) => ({ id: `place_${i + 1}`, ...p, mediaId: pickWide(i) })),
    faqs: FAQS.map((f, i) => ({ id: `faq_${i + 1}`, ...f })),
  };
}
