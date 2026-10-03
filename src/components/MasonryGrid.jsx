import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Pinterest-style masonry. Every photo keeps its own proportions, and each one
 * drops into whichever column is currently shortest, so the columns finish at
 * roughly the same depth.
 *
 * CSS multi-column cannot do this: it fills columns in order against an
 * estimated content height, and with tall unbreakable images that estimate
 * drifts — on the Galleries wall it left one column ~700px short, i.e. a large
 * blank panel beside the last few photos.
 *
 * Picking the shortest column needs each image's aspect ratio up front. Pass
 * `ratios` when they are already known — the content model stores every image's
 * dimensions, so the wall can be laid out correctly on the very first paint and
 * the photos can stay lazy.
 *
 * Without them this falls back to probing: loading each image just to measure
 * it, which pulls the whole set eagerly. Until the probes resolve, photos are
 * dealt round-robin, which matches on count.
 */
export default function MasonryGrid({
  images,
  renderItem,
  ratios: knownRatios,
  gapClass = 'gap-[10px]',
  columns = [2, 4],
  breakpoint = 768,
}) {
  const [narrowColumns, wideColumns] = columns;
  const containerRef = useRef(null);
  const [probedRatios, setProbedRatios] = useState(null);
  const [columnCount, setColumnCount] = useState(narrowColumns);
  const ratios = knownRatios ?? probedRatios;

  useEffect(() => {
    if (knownRatios) return undefined;
    let cancelled = false;

    Promise.all(
      images.map(
        (src) =>
          new Promise((resolve) => {
            const probe = new Image();
            probe.onload = () => resolve(probe.naturalWidth / probe.naturalHeight || 1);
            probe.onerror = () => resolve(1); // square is a harmless stand-in
            probe.src = src;
          }),
      ),
    ).then((measured) => {
      if (!cancelled) setProbedRatios(measured);
    });

    return () => {
      cancelled = true;
    };
  }, [images, knownRatios]);

  /*
    Measured off the container rather than a matchMedia listener: the grid sits
    inside padded sections, so its own width is what decides how many columns
    fit — and a ResizeObserver reports every size change, including ones that
    fire no window-level event.
  */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const apply = () => {
      const width = el.getBoundingClientRect().width;
      setColumnCount(width >= breakpoint ? wideColumns : narrowColumns);
    };

    const observer = new ResizeObserver(apply);
    observer.observe(el);
    apply();

    return () => observer.disconnect();
  }, [breakpoint, narrowColumns, wideColumns]);

  const buckets = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => []);
    const depth = new Array(columnCount).fill(0);

    images.forEach((src, i) => {
      let shortest = 0;
      for (let c = 1; c < columnCount; c += 1) {
        if (depth[c] < depth[shortest]) shortest = c;
      }
      cols[shortest].push(i);
      // Columns share a width, so 1/ratio is the height each photo adds.
      depth[shortest] += 1 / ((ratios && ratios[i]) || 1);
    });

    /*
      The columns still finish a little uneven — whatever lands last decides how
      far one overshoots. That residue is inherent to placing photos in order
      (Pinterest has it too); levelling it properly means either reordering the
      set or switching to justified rows, both of which trade something else
      away. A local shuffle of the trailing photos was measured here and moved
      the bottom by ~4px, so it is deliberately not attempted.
    */
    return cols;
  }, [images, ratios, columnCount]);

  return (
    <div ref={containerRef} className={`flex ${gapClass}`}>
      {buckets.map((col, c) => (
        <div key={c} className={`flex min-w-0 flex-1 flex-col ${gapClass}`}>
          {col.map((i) => renderItem(images[i], i))}
        </div>
      ))}
    </div>
  );
}
