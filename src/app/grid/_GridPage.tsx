'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ProjectEntrance, entranceStyle } from '@/components/effects/ProjectEntrance';
import { PROJECTS, type Project } from '@/lib/projects';
import { PerspectiveCard } from '@/components/effects/PerspectiveCard';
import { GridTile } from '@/components/grid/GridTile';
import { ScrollTiltPreview } from '@/components/effects/ScrollTiltPreview';

export default function GridPage({ motionPreview = false }: { motionPreview?: boolean }) {
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
    <main style={motionPreview ? { overflowX: 'clip' } : undefined}>
      {/*
        Pure-CSS grayscale via :has(a:hover):
        When ANY <a> in this container is hovered, every OTHER <a>'s video gets grayscale.
        When no hover → rule doesn't match → normal.
        No JS state needed — no stuck-grayscale bug.
      */}
      <div
        data-project-grid
        className="
          grid grid-cols-12 gap-y-[20px] sm:gap-y-[30px] lg:gap-y-[53px]
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
        {motionPreview ? (
          <ScrollTiltPreview>
            {tiles.map(({ key, ...project }, index) => (
              <ProjectEntrance key={key} index={index < PROJECTS.length ? index : 0}><ProjectContent project={project} reserveSpace /></ProjectEntrance>
            ))}
          </ScrollTiltPreview>
        ) : tiles.map(({ key, ...p }, idx) => (
          <div
            key={key}
            style={entranceStyle(idx < PROJECTS.length ? idx : 0)}
            className="project-entrance col-span-12 sm:col-span-6 lg:col-span-4 self-start"
          >
            <PerspectiveCard className="w-full">
              <ProjectContent project={p} />
            </PerspectiveCard>
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="col-span-12 h-1" />
      </div>
    </main>
  );
}

function ProjectContent({ project, reserveSpace = false }: { project: Project; reserveSpace?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-y-[9px] group">
      <GridTile
        project={project}
        reserveSpace={reserveSpace}
        sizing="natural"
        className="w-full group-hover:scale-[var(--tile-hover-scale)] transition-transform duration-300 ease-out"
      />
      <p
        className="text-left leading-[18.75px]"
        style={{
          fontSize: 'var(--font-tile-name-size)',
          fontWeight: 'var(--font-tile-name-weight)' as React.CSSProperties['fontWeight'],
        }}
      >
        {project.name}. {project.type?.split(' / ')[0] ?? ''}
      </p>
    </div>
  );
}
