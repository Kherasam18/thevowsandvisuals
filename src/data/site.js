import instagram from '../assets/icons/instagram.png';
import facebook from '../assets/icons/facebook.png';
import linkedin from '../assets/icons/linkedin.png';
import youtube from '../assets/icons/youtube.png';
import vimeo from '../assets/icons/vimeo.png';

/** Primary navigation, in source order. `/about` is a stub route. */
export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Stories', to: '/stories' },
  { label: 'Films', to: '/films' },
  { label: 'Galleries', to: '/galleries' },
  { label: 'About', to: '/about' },
  { label: 'Enquire', to: '/enquiry' },
];

export const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/thevowsandvisuals/?hl=en', icon: instagram },
  { label: 'Facebook', href: 'https://www.facebook.com/', icon: facebook },
  // Source links to Wix's own company page here — kept verbatim rather than "corrected".
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/', icon: linkedin },
  { label: 'YouTube', href: 'https://www.youtube.com/', icon: youtube },
];

export const WHATSAPP_URL = 'https://wa.me/+919034322947';
export const INSTAGRAM_URL = 'https://www.instagram.com/thevowsandvisuals/?hl=en';

export const CONTACT = {
  email: 'kashishnarula@gmail.com',
  phone: '+91 9034322947',
  regions: 'INDIA, DUBAI, THAILAND, BALI & BEYOND',
};

export const FOOTER_LINKS = {
  left: [
    { label: 'Home', to: '/' },
    { label: 'Stories', to: '/stories' },
    { label: 'Films', to: '/films' },
  ],
  right: [
    { label: 'Galleries', to: '/galleries' },
    { label: 'About', to: '/about' },
    { label: 'Enquire', to: '/enquiry' },
  ],
};
