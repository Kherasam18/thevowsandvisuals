import { Link } from 'react-router-dom';
import { FOOTER_LINKS, INSTAGRAM_URL } from '../data/site';
import brandMark from '../assets/brand/logo-monogram.png';
import f1 from '../assets/footer/footer-01.jpg';
import f2 from '../assets/footer/footer-02.jpg';
import f3 from '../assets/footer/footer-03.jpg';
import f4 from '../assets/footer/footer-04.jpg';

const THUMBS = [f1, f2, f3, f4];

/*
  Type size lives on the <ul> so the em-based row gap tracks the label size.
  text-copy is fluid against --sf (100vw), which collapses to ~4px at phone
  widths, so mobile pins a readable size and hands back to the fluid token at md.
*/
function LinkColumn({ links }) {
  return (
    <ul className="flex flex-col gap-[0.6em] text-center font-serif text-[18px] leading-[1.6] md:text-copy">
      {links.map((l) => (
        <li key={l.to}>
          <Link
            to={l.to}
            className="inline-block text-white transition-opacity duration-200 hover:opacity-65"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white">
      <div className="mx-auto w-full max-w-[1600px] px-[6vw] pb-[9vw] pt-[10vw] md:px-[3vw] md:pb-[2.2vw] md:pt-[3.4vw]">
        {/* Phone only — the source crowns the mobile footer with the brand mark. */}
        <img
          src={brandMark}
          alt=""
          aria-hidden="true"
          className="mx-auto mb-[6vw] h-[46px] w-auto md:hidden"
        />

        <p className="text-center font-serif text-f21 leading-[1.2] tracking-[0.42px]">
          Visual Perfection
        </p>

        {/*
          Phone only — the source runs the nav between the two headings, framed
          by hairlines and split by a vertical rule. Desktop keeps its columns
          flanking the thumbnail strip further down.
        */}
        <div className="mt-[7vw] md:hidden">
          <div className="h-px w-full bg-white/25" />
          <div className="flex items-stretch">
            <div className="flex flex-1 justify-center py-[7vw]">
              <LinkColumn links={FOOTER_LINKS.left} />
            </div>
            <div aria-hidden="true" className="w-px self-stretch bg-white/25" />
            <div className="flex flex-1 justify-center py-[7vw]">
              <LinkColumn links={FOOTER_LINKS.right} />
            </div>
          </div>
          <div className="h-px w-full bg-white/25" />
        </div>

        <p className="mt-[7vw] text-center font-serif text-f35 leading-[1.2] tracking-[0.7px] md:mt-[0.7vw]">
          Follow Along
        </p>

        {/* Thumbnail strip with the nav columns flanking it. */}
        <div className="relative mt-[7vw] md:mt-[2.6vw]">
          {/* 62.8% of the viewport in the source; scaled up here to cancel the
              container's 3vw side padding so the strip lands at the same width. */}
          <div className="mx-auto flex w-full max-w-[1005px] md:w-[66.8%]">
            {THUMBS.map((src, i) => (
              <a
                key={src}
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Instagram photo ${i + 1}`}
                /* Source shows three wider frames on a phone; the fourth drops out. */
                className={`group block w-1/3 overflow-hidden md:w-1/4 ${i === 3 ? 'hidden md:block' : ''}`}
              >
                <img
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className="aspect-[4/3] w-full object-cover transition-opacity duration-300 group-hover:opacity-80 md:aspect-square"
                />
              </a>
            ))}
          </div>

          {/* Desktop: absolutely placed to match the source's off-centre columns. */}
          <div className="absolute left-[13.2%] top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <LinkColumn links={FOOTER_LINKS.left} />
          </div>
          <div className="absolute left-[86.8%] top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <LinkColumn links={FOOTER_LINKS.right} />
          </div>
        </div>

        <p className="mt-[8vw] text-center md:mt-[1.6vw]">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="font-display text-nav uppercase leading-[1.2] tracking-[1.6px] text-white transition-opacity duration-200 hover:opacity-65"
          >
            @The vows and Visuals
          </a>
        </p>

        {/* Legal row */}
        <div className="mt-[7vw] grid grid-cols-2 gap-x-[4vw] gap-y-[4vw] font-serif text-f14 leading-[1.4] tracking-[0.28px] md:mt-[2.4vw] md:grid-cols-3 md:gap-0">
          <p className="text-center uppercase md:max-w-[17ch] md:text-left">
            {/* Copyright © {new Date().getFullYear()} The Vows and Visuals */}
          </p>
          {/*
            The source pairs the copyright with a T&C / Privacy link. Rendered as
            plain text until those pages exist — a dead link is worse than none.
          */}
          <p className="text-center uppercase md:order-last md:max-w-[17ch] md:justify-self-end md:text-right">
            {/* T&amp;C and Privacy Policy */}
          </p>
          <p className="col-span-2 text-center md:col-span-1">
            <a
              href="http://www.digitalmarketising.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="transition-opacity duration-200 hover:opacity-65"
            >
              DESIGNED BY Sam Khera
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
