import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { NAV_LINKS, SOCIALS, WHATSAPP_URL } from '../data/site';
import MobileMenu from './MobileMenu';
import wordmark from '../assets/brand/logo-badge.png';
import wordmarkLight from '../assets/brand/logo-badge-light.png';
import whatsapp from '../assets/icons/whatsapp.png';

/**
 * How the hero navbar stays legible over interchangeable footage. The hero
 * video is swappable, so black-on-transparent disappears into a night shot.
 *
 *   'scrim'          — white content over a soft dark gradient. Keeps the hero
 *                      full-bleed; reads as vignetting rather than chrome.
 *   'pill'           — the usual black content on a frosted cream bar. Strongest
 *                      contrast at both extremes, at the cost of visible chrome
 *                      and a backdrop-filter, which costs GPU over playing video.
 *   'pill-on-scroll' — 'scrim' at rest, morphing into 'pill' once scrolled.
 *                      Only this mode pins the header: an absolute one scrolls
 *                      out of view long before the bar could appear. It is also
 *                      the only mode that pays for the blur just while scrolled.
 *
 * Switch here to compare; only this constant needs to change.
 */
const HERO_TREATMENT = 'scrim';

/** How far down the page the frosted bar takes over. */
const SOLID_AFTER_PX = 40;

/** Lifts white content off bright footage without reading as a shadow. */
const OVERLAY_SHADOW = 'drop-shadow-[0_1px_1px_rgb(0_0_0_/_0.45)]';

/*
  Each pair is written with the same filter/shadow functions rather than one
  side collapsing to `none`, so the browser interpolates between them instead
  of cutting. The icons ship as solid black: brightness(0) pins that, and
  invert() carries them to white and back.
*/
const ICON_LIGHT = '[filter:brightness(0)_invert(1)]';
const ICON_DARK = '[filter:brightness(0)_invert(0)]';
const TEXT_SHADOW_ON = '[text-shadow:0_1px_3px_rgb(0_0_0_/_0.45)]';
const TEXT_SHADOW_OFF = '[text-shadow:0_1px_3px_rgb(0_0_0_/_0)]';

/** Bar dimensions — held constant across states so nothing shifts on scroll. */
const BAR_GEOMETRY =
  'mt-[3vw] w-[calc(100%-6vw)] rounded-[18px] px-[4vw] py-[2.5vw] ' +
  'md:mt-[1.2vw] md:w-[calc(100%-4vw)] md:rounded-[10vw] md:px-[2.4vw] md:py-[0.6vw]';

const BAR_FROSTED =
  'border-black/[0.06] bg-cream/100 shadow-[0_4px_24px_rgb(0_0_0_/_0.15)] ' +
  '[backdrop-filter:blur(12px)]';

const BAR_CLEAR =
  'border-transparent bg-transparent shadow-[0_4px_24px_rgb(0_0_0_/_0)] ' +
  '[backdrop-filter:blur(0px)]';

function SocialBar({ className = '', size = 'h-[18px]', tone = 'plain' }) {
  const filter = tone === 'light' ? ICON_LIGHT : tone === 'dark' ? ICON_DARK : '';
  return (
    <ul className={`flex items-center gap-[1.6vw] md:gap-[1.15vw] ${className}`}>
      {SOCIALS.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={s.label}
            className="block opacity-90 transition-opacity duration-200 hover:opacity-60"
          >
            <img
              src={s.icon}
              alt=""
              aria-hidden="true"
              className={`${size} w-auto transition-[filter] duration-300 ease-out ${filter}`}
            />
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Site header. `overlay` places it over the Home hero video; otherwise it sits
 * in normal flow on the cream page background, always dark on cream.
 */
export default function Navbar({ overlay = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const mode = overlay ? HERO_TREATMENT : 'plain';
  const scrollMode = mode === 'pill-on-scroll';

  useEffect(() => {
    if (!scrollMode) return;

    let raf = 0;
    const read = () => {
      raf = 0;
      setScrolled(window.scrollY > SOLID_AFTER_PX);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    read(); // honour a restored scroll position on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollMode]);

  const showScrim = mode === 'scrim' || (scrollMode && !scrolled);
  const showPill = mode === 'pill' || (scrollMode && scrolled);
  const lightContent = showScrim;
  const barStyled = mode === 'pill' || scrollMode;

  return (
    <>
      <header
        className={
          'w-full ' +
          (!overlay
            ? 'relative z-30 bg-cream'
            : scrollMode
              ? 'fixed inset-x-0 top-0 z-30'
              : 'absolute inset-x-0 top-0 z-30')
        }
      >
        {(mode === 'scrim' || scrollMode) && (
          <div
            aria-hidden="true"
            className={
              'hero-scrim pointer-events-none absolute inset-x-0 top-0 h-[230%] ' +
              'transition-opacity duration-300 ease-out ' +
              (showScrim ? 'opacity-100' : 'opacity-0')
            }
          />
        )}

        <div
          className={
            'relative mx-auto flex max-w-[1600px] items-center justify-between ' +
            (barStyled
              ? 'border transition-[background-color,border-color,box-shadow,backdrop-filter] ' +
              `duration-300 ease-out ${BAR_GEOMETRY} ${showPill ? BAR_FROSTED : BAR_CLEAR}`
              : 'w-full px-[3.5vw] py-[1.1vw] md:px-[3.9vw]')
          }
        >
          {/* Logo — the two colourways cross-fade, since swapping src would cut. */}
          <Link to="/" aria-label="The Vows and Visuals — home" className="relative block shrink-0">
            <img
              src={wordmark}
              alt="The Vows and Visuals"
              className={
                /* The badge is square, where the old lockup was 2.3:1, so the
                   previous 10vw would now render it barely 39px across. Height
                   can be matched straight to the source's compact mark (~64px
                   on a phone) without the width running away. */
                'h-[16vw] w-auto max-h-[96px] md:h-[6vw] transition-opacity duration-300 ease-out ' +
                (lightContent ? 'opacity-0' : 'opacity-100')
              }
            />
            {overlay && (
              <img
                src={wordmarkLight}
                alt=""
                aria-hidden="true"
                className={
                  `absolute inset-0 h-full w-auto transition-opacity duration-300 ease-out ${OVERLAY_SHADOW} ` +
                  (lightContent ? 'opacity-100' : 'opacity-0')
                }
              />
            )}
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Site" className="hidden md:block">
            <ul className="flex items-center gap-[3.9vw]">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      'font-display text-nav leading-[1.4] tracking-[1.6px] ' +
                      'transition-[color,text-shadow] duration-300 ease-out ' +
                      (lightContent
                        ? `text-white ${TEXT_SHADOW_ON} `
                        : `text-black ${TEXT_SHADOW_OFF} `) +
                      'underline-offset-[6px] hover:opacity-1000 ' +
                      (isActive ? 'underline' : 'no-underline')
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right cluster: WhatsApp + socials (desktop) / hamburger (mobile) */}
          <div className="flex items-center gap-[2.2vw] md:gap-[1.9vw]">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Whatsapp"
              className="hidden shrink-0 transition-opacity duration-200 hover:opacity-70 md:block"
            >
              {/* Left in brand green — it reads on both dark and light footage. */}
              <img
                src={whatsapp}
                alt=""
                aria-hidden="true"
                className={`h-[22px] w-auto ${lightContent ? OVERLAY_SHADOW : ''}`}
              />
            </a>

            <SocialBar
              className="hidden md:flex"
              tone={overlay ? (lightContent ? 'light' : 'dark') : 'plain'}
            />

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="flex items-center md:hidden"
            >
              {/* Icon only — the source has no "MENU" label beside it. */}
              {/* Traced off the source: same width, a little taller. */}
              <span aria-hidden="true" className="flex h-[20px] w-[26px] flex-col justify-between">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={
                      'block h-[2px] w-full transition-colors duration-300 ease-out ' +
                      (lightContent ? 'bg-white' : 'bg-ink')
                    }
                  />
                ))}
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
