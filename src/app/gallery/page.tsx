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
    <main className="pt-[18vh]">
      <div className="flex flex-wrap">
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
            className={[
              'group block aspect-square overflow-hidden',
              'w-full p-[20px]',
              'sm:w-[calc(100%/2)]',
              'md:w-[calc(100%/3)] md:p-[30px]',
              'lg:w-[calc(100%/4)] lg:p-[40px]',
              'xl:w-[calc(100%/5)]',
              '2xl:w-[calc(100%/6)]',
            ].join(' ')}
          >
            <GridTile
              project={p}
              sizing="fill"
              className="
                will-change-transform w-full h-full
                group-hover:scale-90 transition-all duration-300
              "
            />
          </motion.a>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="w-full h-1" />
      </div>
    </main>
  );
}
