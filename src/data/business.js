/*
  One source of truth for who and where the studio is.

  Search engines and AI assistants reward consistency: the same name, address
  and phone number, written identically here, in the structured data, on the
  page, and on Google Business Profile. Divergence is what makes a listing look
  unverified, so everything that states a fact about the business reads it here.
*/

export const BUSINESS = {
  name: 'The Vows and Visuals',
  legalName: 'The Vows and Visuals',
  url: 'https://thevowsandvisuals.com',

  // Where the studio is actually based. A real locality is what lets the site
  // compete for "wedding photographer in …" searches at all.
  address: {
    locality: 'Sirsa',
    region: 'Haryana',
    regionCode: 'HR',
    country: 'India',
    countryCode: 'IN',
  },

  telephone: '+919034322947',
  email: 'kashishnarula@gmail.com',

  /* Where they shoot, not where they sit. These match the "Where we shoot"
     section on the About page — a claim that appears in one place and not the
     other reads as noise. */
  areasServed: [
    { name: 'India', type: 'Country' },
    { name: 'Dubai', type: 'City' },
    { name: 'United Arab Emirates', type: 'Country' },
    { name: 'Thailand', type: 'Country' },
    { name: 'Bali', type: 'Place' },
  ],

  socials: [
    'https://www.instagram.com/thevowsandvisuals/',
    'https://www.facebook.com/',
    'https://www.youtube.com/',
    'https://www.linkedin.com/company/',
  ],

  /* Used in <meta description> and the structured data. Written as a sentence
     a person would read, because that is what gets quoted back by assistants. */
  tagline:
    'Wedding photography and films by a small team based in Sirsa, Haryana — photographing weddings across India, Dubai, Thailand and Bali.',
};

/** "Sirsa, Haryana, India" — for prose. */
export const locationLine = () =>
  `${BUSINESS.address.locality}, ${BUSINESS.address.region}, ${BUSINESS.address.country}`;
