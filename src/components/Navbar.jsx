import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { NAV_LINKS, SOCIALS, WHATSAPP_URL } from '../data/site';
import MobileMenu from './MobileMenu';
import wordmark from '../assets/brand/logo-wordmark.png';
import whatsapp from '../assets/icons/whatsapp.png';

function SocialBar({ className = '', size = 'h-[18px]' }) {
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
            <img src={s.icon} alt="" aria-hidden="true" className={`${size} w-auto`} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Site header. `overlay` places it transparently above the Home hero video;
 * otherwise it sits in normal flow on the cream page background.
 * Text is dark in both cases, matching the source.
 */
export default function Navbar({ overlay = false }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className={
          (overlay ? 'absolute inset-x-0 top-0 z-30' : 'relative z-30 bg-cream') +
          ' w-full'
        }
      >
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-[3.5vw] py-[1.1vw] md:px-[3.9vw]">
          {/* Logo */}
          <Link to="/" aria-label="The Vows and Visuals — home" className="shrink-0">
            <img
              src={wordmark}
              alt="The Vows and Visuals"
              className="h-[7.6vw] w-auto max-h-[96px] md:h-[6vw] brightness-[100%] contrast-[100%]"
            />
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
                      'font-display text-nav leading-[1.4] tracking-[1.6px] text-black ' +
                      'underline-offset-[6px] transition-opacity duration-200 hover:opacity-1000 ' +
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
              <img src={whatsapp} alt="" aria-hidden="true" className="h-[22px] w-auto" />
            </a>

            <SocialBar className="hidden md:flex" />

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="flex items-center text-black md:hidden"
            >
              {/* Icon only — the source has no "MENU" label beside it. */}
              <span aria-hidden="true" className="flex h-[16px] w-[26px] flex-col justify-between">
                <span className="block h-[2px] w-full bg-ink" />
                <span className="block h-[2px] w-full bg-ink" />
                <span className="block h-[2px] w-full bg-ink" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
