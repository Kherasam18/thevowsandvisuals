/**
 * Stub route.
 *
 * Every page's nav and footer link to /about, but About.html was not among the
 * captured sources — so there is no structure or copy to replicate here. This
 * renders shared chrome only (via Layout) and deliberately invents no content.
 */
export default function About() {
  return (
    <section className="mx-auto flex min-h-[46vh] w-full max-w-[1600px] flex-col items-center justify-center px-[6vw] py-[10vw] text-center">
      <p className="font-serif text-eyebrow uppercase tracking-[0.28em] text-stone">About</p>
      <h1 className="mt-[1.4vw] font-display text-h1 leading-[1.2] text-ink">
        Infinite Memories
      </h1>
      <p className="mt-[1.8vw] max-w-[46ch] font-serif text-body leading-[1.4] text-ink">
        This page was not part of the captured source material, so its content has not been
        reproduced.
      </p>
    </section>
  );
}
