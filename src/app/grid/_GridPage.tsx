'use client';

import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '@/lib/projects';
import { PerspectiveCard } from '@/components/effects/PerspectiveCard';
import { GridTile } from '@/components/grid/GridTile';

export default function GridPage() {
  const [cycles, setCycles] = useState(2);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: add a cycle when sentinel enters viewport
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

  // Sibling grayscale on hover
  function handleTileEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    const grid = gridRef.current;
    if (!grid) return;
    grid.querySelectorAll<HTMLAnchorElement>('a[data-tile]').forEach((a) => {
      if (a === e.currentTarget) {
        a.classList.remove('is-inactive');
        a.classList.add('is-active');
      } else {
        a.classList.remove('is-active');
        a.classList.add('is-inactive');
      }
    });
  }
  function handleGridLeave() {
    const grid = gridRef.current;
    if (!grid) return;
    grid.querySelectorAll<HTMLAnchorElement>('a[data-tile]').forEach((a) => {
      a.classList.remove('is-active', 'is-inactive');
    });
  }

  const tiles = Array.from({ length: cycles }).flatMap((_, c) =>
    PROJECTS.map((p, i) => ({ ...p, key: `${c}-${p.id}` }))
  );

  return (
    <main>
      <div
        ref={gridRef}
        className="
          grid grid-cols-12 gap-x-[10px] gap-y-[50px]
          px-[10px] pt-14 pb-20
        "
        onMouseLeave={handleGridLeave}
      >
        {tiles.map(({ key, ...p }) => (
          <PerspectiveCard
            key={key}
            className="col-span-6 xl:col-span-4 min-[1920px]:col-span-3 self-start"
          >
            <a
              href={p.url || '#'}
              data-tile
              onMouseEnter={handleTileEnter}
              className="flex flex-col items-center gap-y-[10px] group block"
            >
              <GridTile
                project={p}
                sizing="natural"
                className={[
                  'w-full transition-all duration-300 ease-in-out',
                  'group-hover:scale-95',
                  '[.is-inactive_&]:grayscale',
                ].join(' ')}
              />
              <p className="text-[15px] leading-tight text-center transition-all duration-300 [.is-inactive_*_&]:opacity-50">
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
