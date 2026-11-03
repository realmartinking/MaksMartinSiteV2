'use client';

import React, { memo } from 'react';
import { useProjectFeed } from '@/hooks/useProjectFeed';
import { ProjectEntrance, entranceStyle } from '@/components/effects/ProjectEntrance';
import { PROJECTS, type Project } from '@/lib/projects';
import { PerspectiveCard } from '@/components/effects/PerspectiveCard';
import { GridTile } from '@/components/grid/GridTile';
import { ScrollTiltPreview } from '@/components/effects/ScrollTiltPreview';
import { useScrollAwareHover } from '@/lib/useScrollAwareHover';

export default function GridPage({ motionPreview = false }: { motionPreview?: boolean }) {
  const feed = useProjectFeed(PROJECTS.length);
  useScrollAwareHover(feed.root, '[data-hover-card]');
  const tiles = feed.indices.map(index => ({ index, project: PROJECTS[index % PROJECTS.length] }));

  return (
    <main style={motionPreview ? { overflowX: 'clip' } : undefined}>
      <div
        ref={feed.root}
        data-mobile-feed={feed.mobile || undefined}
        data-project-grid
        className={`
          ${motionPreview ? 'mobile-flat-grid' : ''} project-hover-grid grid grid-cols-12 gap-y-[20px] sm:gap-y-[30px] lg:gap-y-[53px]
          pb-20
          [&_.group_video]:[transition:filter_300ms_ease,transform_300ms_ease]
          [&_.group_img]:[transition:filter_300ms_ease,transform_300ms_ease]
        `}
        style={{
          columnGap: 'var(--grid-gap)',
          paddingLeft: 'var(--grid-padding-x)',
          paddingRight: 'var(--grid-padding-x)',
          paddingTop: `calc(var(--grid-padding-top) + ${feed.before}px)`,
          paddingBottom: feed.after ? `calc(5rem + ${feed.after}px)` : undefined,
        }}
      >
        {motionPreview ? (
          <ScrollTiltPreview>
            {tiles.map(({ index, project }) => (
              <ProjectEntrance key={index} feedIndex={index} index={index < PROJECTS.length ? index : 0}><ProjectContent project={project} priority={index === 0} /></ProjectEntrance>
            ))}
          </ScrollTiltPreview>
        ) : tiles.map(({ index: idx, project }) => (
          <div
            key={idx} data-feed-index={idx}
            style={entranceStyle(idx < PROJECTS.length ? idx : 0)}
            className="project-entrance col-span-12 sm:col-span-6 lg:col-span-4 self-start"
          >
            <PerspectiveCard className="w-full">
              <ProjectContent project={project} priority={idx === 0} />
            </PerspectiveCard>
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={feed.sentinel} className="h-1" style={{ gridColumn: '1 / -1' }} />
      </div>
    </main>
  );
}

const ProjectContent = memo(function ProjectContent({ project, priority }: { project: Project; priority: boolean }) {
  return (
    <div data-hover-card className="flex min-w-0 flex-col gap-y-[9px] group">
      <GridTile
        project={project}
        priority={priority}
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
