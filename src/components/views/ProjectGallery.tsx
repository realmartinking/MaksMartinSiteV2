'use client';

import { useEffect, useRef, useState } from 'react';
import { PROJECTS, type Project } from '@/lib/projects';
import { entranceStyle } from '@/components/effects/ProjectEntrance';
import { GridTile } from '@/components/grid/GridTile';

export function ProjectGallery({ projects = PROJECTS, infinite = true }: { projects?: Project[]; infinite?: boolean }) {
  const [cycles, setCycles] = useState(infinite ? 2 : 1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !infinite) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setCycles((c) => c + 1);
      },
      { rootMargin: '1500px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [infinite, cycles]);

  const tiles = Array.from({ length: cycles }).flatMap((_, c) =>
    projects.map((p) => ({ ...p, key: `${c}-${p.id}` }))
  );

  return (
    <main style={{ paddingTop: 'var(--grid-padding-top)' }}>
      <div
        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
        style={{ gap: 'var(--grid-gap)', paddingLeft: 'var(--grid-padding-x)', paddingRight: 'var(--grid-padding-x)' }}
      >
        {tiles.map(({ key, ...p }, idx) => (
          <div
            key={key}
            style={entranceStyle(idx < projects.length ? idx : 0)}
            className="project-entrance group aspect-square overflow-hidden"
          >
            <GridTile
              project={p}
              sizing="fill"
              className="w-full h-full group-hover:scale-[var(--tile-hover-scale)] transition-transform duration-300 ease-out"
            />
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div className="col-span-full h-1" ref={sentinelRef} />
      </div>
    </main>
  );
}
