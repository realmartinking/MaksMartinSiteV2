'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PROJECTS } from '@/lib/projects';
import { PerspectiveCard } from '@/components/effects/PerspectiveCard';
import { GridTile } from '@/components/grid/GridTile';

export default function GridPage() {
  const prefersReduced = useReducedMotion();
  const [cycles, setCycles] = useState(2);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll — no cap
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setCycles((c) => c + 1); },
      { rootMargin: '1500px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tiles = Array.from({ length: cycles }).flatMap((_, c) =>
    PROJECTS.map((p) => ({ ...p, key: `${c}-${p.id}` }))
  );

  return (
    <main>
      {/*
        Pure-CSS grayscale via :has(a:hover):
        When ANY <a> in this container is hovered, every OTHER <a>'s video gets grayscale.
        When no hover → rule doesn't match → normal.
        No JS state needed — no stuck-grayscale bug.
      */}
      <div
        className="
          grid grid-cols-12 gap-y-[20px] sm:gap-y-[30px] lg:gap-y-[50px]
          pb-20
          [&:has(.group:hover)_.group:not(:hover)_video]:grayscale
          [&:has(.group:hover)_.group:not(:hover)_img]:grayscale
          [&_.group_video]:[transition:filter_300ms_ease,transform_300ms_ease]
          [&_.group_img]:[transition:filter_300ms_ease,transform_300ms_ease]
        "
        style={{
          columnGap: 'var(--grid-gap)',
          paddingLeft: 'var(--grid-padding-x)',
          paddingRight: 'var(--grid-padding-x)',
          paddingTop: 'var(--grid-padding-top)',
        }}
      >
        {tiles.map(({ key, ...p }, idx) => (
          <motion.div
            key={key}
            initial={prefersReduced ? false : { opacity: 0, y: 40, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={prefersReduced ? { duration: 0 } : {
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1],
              delay: idx < PROJECTS.length ? Math.min(idx * 0.08, 1.2) : 0,
            }}
            className="col-span-12 sm:col-span-6 lg:col-span-4 self-start"
          >
            <PerspectiveCard className="w-full">
              <div className="flex flex-col gap-y-[4px] group">
                <GridTile
                  project={p}
                  sizing="natural"
                  className="w-full group-hover:scale-[var(--tile-hover-scale)] transition-transform duration-300 ease-out"
                />
                <div className="flex justify-between items-start w-full">
                  <span
                    className="leading-tight"
                    style={{
                      fontSize: 'var(--font-tile-name-size)',
                      fontWeight: 'var(--font-tile-name-weight)' as React.CSSProperties['fontWeight'],
                    }}
                  >
                    {p.name}
                  </span>
                  <span
                    className="leading-tight text-right shrink-0 ml-3 opacity-50"
                    style={{ fontSize: '11px', fontWeight: 400, lineHeight: '1.3' }}
                  >
                    {p.type?.split(' / ').map((line, i) => (
                      <span key={i} className="block">{line}</span>
                    ))}
                  </span>
                </div>
              </div>
            </PerspectiveCard>
          </motion.div>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="col-span-12 h-1" />
      </div>
    </main>
  );
}
