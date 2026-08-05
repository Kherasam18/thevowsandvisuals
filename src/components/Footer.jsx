import { Link } from 'react-router-dom';
import { FOOTER_LINKS, INSTAGRAM_URL } from '../data/site';
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
    <ul className="flex flex-col gap-[0.6em] text-center font-serif text-[15px] leading-[1.6] md:text-copy">
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
        <p className="text-center font-serif text-f21 leading-[1.2] tracking-[0.42px]">
          Visual Perfection
        </p>
        <p className="mt-[0.7vw] text-center font-serif text-f35 leading-[1.2] tracking-[0.7px]">
          Follow Along
        </p>

        {/* Thumbnail strip with the nav columns flanking it. */}
        <div className="relative mt-[7vw] md:mt-[2.6vw]">
          {/* 62.8% of the viewport in the source; scaled up here to cancel the
              container's 3vw side padding so the strip lands at the same width. */}
          <div className="mx-auto flex w-[66.8%] max-w-[1005px]">
            {THUMBS.map((src, i) => (
              <a
                key={src}
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Instagram photo ${i + 1}`}
                className="group block w-1/4 overflow-hidden"
              >
                <img
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className="aspect-square w-full object-cover transition-opacity duration-300 group-hover:opacity-80"
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

        {/* Mobile: columns stack under the strip. */}
        <div className="mt-[8vw] flex justify-center gap-[16vw] md:hidden">
          <LinkColumn links={FOOTER_LINKS.left} />
          <LinkColumn links={FOOTER_LINKS.right} />
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
        <div className="mt-[7vw] grid grid-cols-1 gap-[3vw] font-serif text-f14 leading-[1.2] tracking-[0.28px] md:mt-[2.4vw] md:grid-cols-3 md:gap-0">
          <p className="text-center md:max-w-[17ch] md:text-left"></p>
          <p className="text-center">
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
