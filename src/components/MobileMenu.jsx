import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS, SOCIALS, CONTACT } from '../data/site';
import portrait from '../assets/chrome/menu-portrait.jpg';

/**
 * Hamburger overlay.
 *
 * NOTE: every recording was captured at 1920x1080, so the menu is never
 * opened on camera. Structure here follows the source markup
 * (wixui-hamburger-overlay: close button, vertical menu, social bar,
 * portrait image, hairlines); the open/close transition is a reasonable
 * default rather than an observed one.
 */
export default function MobileMenu({ open, onClose }) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={
        'fixed inset-0 z-50 transition-opacity duration-500 ease-out md:hidden ' +
        (open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')
      }
    >
      <div className="absolute inset-0 bg-cream" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={
          'relative flex h-full flex-col px-[8vw] pb-[10vw] pt-[6vw] transition-transform duration-500 ease-out ' +
          (open ? 'translate-y-0' : '-translate-y-4')
        }
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="self-end font-display text-[13px] uppercase tracking-[0.14em] text-black"
        >
          Close
        </button>

        <nav aria-label="Site" className="mt-[8vw]">
          <ul className="flex flex-col gap-[4.5vw]">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    'font-display text-[8vw] leading-none text-black ' +
                    (isActive ? 'underline underline-offset-[8px]' : '')
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto">
          <div className="h-px w-full bg-hair" />

          <img
            src={portrait}
            alt=""
            aria-hidden="true"
            className="mt-[6vw] h-[36vw] w-full object-cover"
          />

          <div className="mt-[6vw] h-px w-full bg-hair" />

          <p className="mt-[5vw] font-serif text-[14px] leading-relaxed text-ink">
            <a href={`mailto:${CONTACT.email}`} className="hover:underline">
              {CONTACT.email}
            </a>
            <br />
            {CONTACT.phone}
          </p>

          <ul className="mt-[5vw] flex items-center gap-[5vw]">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer noopener" aria-label={s.label}>
                  <img src={s.icon} alt="" aria-hidden="true" className="h-[20px] w-auto" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
