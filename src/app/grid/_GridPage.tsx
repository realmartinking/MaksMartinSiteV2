'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import { ProjectEntrance, entranceStyle } from '@/components/effects/ProjectEntrance';
import { PROJECTS, type Project } from '@/lib/projects';
import { PerspectiveCard } from '@/components/effects/PerspectiveCard';
import { GridTile } from '@/components/grid/GridTile';
import { ScrollTiltPreview } from '@/components/effects/ScrollTiltPreview';
import { useScrollAwareHover } from '@/lib/useScrollAwareHover';

export default function GridPage({ motionPreview = false }: { motionPreview?: boolean }) {
  const [cycles, setCycles] = useState(2);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hoverRoot = useRef<HTMLDivElement>(null);
  useScrollAwareHover(hoverRoot, '[data-hover-card]');

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
    PROJECTS.map((project) => ({ project, key: `${c}-${project.id}` }))
  );

  return (
    <main style={motionPreview ? { overflowX: 'clip' } : undefined}>
      <div
        ref={hoverRoot}
        data-project-grid
        className="
          project-hover-grid grid grid-cols-12 gap-y-[20px] sm:gap-y-[30px] lg:gap-y-[53px]
          pb-20
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
            {tiles.map(({ key, project }, index) => (
              <ProjectEntrance key={key} index={index < PROJECTS.length ? index : 0}><ProjectContent project={project} reserveSpace /></ProjectEntrance>
            ))}
          </ScrollTiltPreview>
        ) : tiles.map(({ key, project }, idx) => (
          <div
            key={key}
            style={entranceStyle(idx < PROJECTS.length ? idx : 0)}
            className="project-entrance col-span-12 sm:col-span-6 lg:col-span-4 self-start"
          >
            <PerspectiveCard className="w-full">
              <ProjectContent project={project} />
            </PerspectiveCard>
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="col-span-12 h-1" />
      </div>
    </main>
  );
}

const ProjectContent = memo(function ProjectContent({ project, reserveSpace = false }: { project: Project; reserveSpace?: boolean }) {
  return (
    <div data-hover-card className="flex min-w-0 flex-col gap-y-[9px] group">
      <GridTile
        project={project}
        reserveSpace={reserveSpace}
        sizing="natural"
        className="project-hover-media w-full transition-transform duration-300 ease-out"
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
});
