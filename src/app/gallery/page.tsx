'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PROJECTS } from '@/lib/projects';
import { GridTile } from '@/components/grid/GridTile';

export default function GalleryPage() {
  const [cycles, setCycles] = useState(2);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setCycles((c) => c + 1);
      },
      { rootMargin: '1500px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tiles = Array.from({ length: cycles }).flatMap((_, c) =>
    PROJECTS.map((p) => ({ ...p, key: `${c}-${p.id}` }))
  );

  return (
    <main style={{ paddingTop: 'var(--grid-padding-top)' }}>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        style={{ gap: 'var(--grid-gap)', paddingLeft: 'var(--grid-padding-x)', paddingRight: 'var(--grid-padding-x)' }}
      >
        {tiles.map(({ key, ...p }, idx) => (
          <motion.a
            key={key}
            href={p.url || '#'}
            onClick={(e) => { if (!p.url) e.preventDefault(); }}
            initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1],
              delay: idx < PROJECTS.length ? Math.min(idx * 0.08, 1.2) : 0,
            }}
            className="group block aspect-square overflow-hidden"
          >
            <GridTile
              project={p}
              sizing="fill"
              className="will-change-transform w-full h-full group-hover:scale-[var(--tile-hover-scale)] transition-transform duration-300 ease-out"
            />
          </motion.a>
        ))}

        {/* Infinite scroll sentinel */}
        <div className="col-span-full h-1" ref={sentinelRef} />
      </div>
    </main>
  );
}
