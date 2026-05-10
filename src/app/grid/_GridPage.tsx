'use client';

import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '@/lib/projects';
import { PerspectiveCard } from '@/components/effects/PerspectiveCard';
import { GridTile } from '@/components/grid/GridTile';

export default function GridPage() {
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
          grid grid-cols-12 gap-x-[10px] gap-y-[50px]
          px-[10px] pt-[18vh] pb-20
          [&:has(a:hover)_a:not(:hover)_video]:grayscale
          [&:has(a:hover)_a:not(:hover)_img]:grayscale
          [&_a_video]:[transition:filter_300ms_ease,transform_300ms_ease]
          [&_a_img]:[transition:filter_300ms_ease,transform_300ms_ease]
        "
      >
        {tiles.map(({ key, ...p }) => (
          <PerspectiveCard
            key={key}
            className="col-span-6 xl:col-span-4 min-[1920px]:col-span-3 self-start"
          >
            <a
              href={p.url || '#'}
              className="flex flex-col items-center gap-y-[10px] group block"
            >
              <GridTile
                project={p}
                sizing="natural"
                className="w-full group-hover:scale-95 transition-transform duration-300 ease-in-out"
              />
              <p className="text-[15px] leading-tight text-center">
                {p.name}&nbsp;&nbsp;/&nbsp;&nbsp;{p.type ?? ''}
              </p>
            </a>
          </PerspectiveCard>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="col-span-12 h-1" />
      </div>
    </main>
  );
}
