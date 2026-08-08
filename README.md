# The Vows and Visuals — React rebuild

A standalone React + Tailwind rebuild of the The Vows and Visuals wedding
photography site (originally Wix Studio / Thunderbolt), reconstructed from
saved "Webpage, Complete" captures plus screen recordings of the live site.

Frontend only — no backend, no API calls, no data persistence.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production bundle -> dist/
npm run preview  # serve the built bundle
```

## Routes

| Route     | Page                                        |
| --------- | ------------------------------------------- |
| `/`       | Home — hero video, mission, grid, carousels |
| `/stories`| Four story banners                          |
| `/films`  | Five YouTube films, alternating layout      |
| `/galleries` | Hero slideshow + 25-image masonry + lightbox |
| `/enquiry`| Enquiry form                                |
| `/about`  | Stub — see note below                       |

## Structure

```
src/
  components/   Navbar, Footer, MobileMenu, Layout, Button,
                Lightbox, StoriesCarousel, TestimonialCarousel,
                BackgroundVideo, YouTubeEmbed
  pages/        Home, Stories, Films, Galleries, Enquiry, About
  data/site.js  Nav links, socials, contact details, footer links
  assets/       icons/ brand/ chrome/ footer/ home/ stories/
                galleries/ enquiry/
  App.jsx       Router
  index.css     Tailwind v4 theme — fonts, palette, fluid type scale
```

## Things to know

**Fonts are substituted.** The site renders in Adobe Garamond Pro (body) and
Butler Light (display). Neither is freely licensed and neither was captured by
"Save Page As" — Wix serves them from its own CDN. They're substituted with
**EB Garamond** and **Playfair Display**. Swap the `@import`s and the
`--font-serif` / `--font-display` tokens in `src/index.css` if you license the
originals. Gloock (used only for VIBRANT / TIMELESS / AUTHENTIC) is genuine.

**Background videos are missing.** Both Home videos stream from
`video.wixstatic.com` and weren't captured. Drop `hero.mp4` and `cinematic.mp4`
into `public/video/` and they play automatically — see the README in that
folder. Until then each falls back to a still.

**`/about` is a stub.** Every page's nav and footer link to it, but About.html
wasn't among the sources, so the page renders shared chrome and a short note
rather than invented content.

**The enquiry form doesn't submit anywhere.** Validation, state and feedback
are all real; `handleSubmit` in `src/pages/Enquiry.jsx` logs the payload and is
marked with a `TODO` for backend integration.

**Wix template leftovers were kept.** The original still contains unedited Wix
placeholder content — the LinkedIn link points at `linkedin.com/company/wix-com`,
and the Galleries hero slides 2 and 3 carry "Client / PRAISE" labels. These are
reproduced as-is rather than "corrected".
