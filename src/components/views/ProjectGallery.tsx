'use client';

import { useProjectFeed } from '@/hooks/useProjectFeed';
import { PROJECTS, type Project } from '@/lib/projects';
import { ProjectEntrance } from '@/components/effects/ProjectEntrance';
import { ViewportEntrance } from '@/components/effects/ViewportEntrance';
import { GridTile } from '@/components/grid/GridTile';

export function ProjectGallery({ projects = PROJECTS, infinite = true }: { projects?: Project[]; infinite?: boolean }) {
  const feed = useProjectFeed(projects.length, 1, infinite);

  return (
    <main style={{ paddingTop: 'var(--grid-padding-top)' }}>
      <div ref={feed.root} data-mobile-feed={feed.mobile || undefined}
        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
        style={{ paddingTop: feed.before, paddingBottom: feed.after, gap: 'var(--grid-gap)', paddingLeft: 'var(--grid-padding-x)', paddingRight: 'var(--grid-padding-x)' }}
      >
        {feed.indices.map(index => {
          const p = projects[index % projects.length];
          // Production is an eight-item gallery. Its visible posters must paint
          // from the server HTML even if hydration is delayed on a phone.
          const firstProductionGroup = !!p.mobilePreviewBase && index < projects.length;
          const eager = firstProductionGroup || index < Math.min(12, projects.length);
          const Entrance = firstProductionGroup ? ProjectEntrance : ViewportEntrance;
          return <Entrance key={index} index={index} feedIndex={index} className="group aspect-square overflow-hidden">
            <GridTile project={p} priority={index === 0} eagerPoster={eager} sizing="fill"
              className="w-full h-full group-hover:scale-[var(--tile-hover-scale)] transition-transform duration-300 ease-out" />
          </Entrance>;
        })}

        {/* Infinite scroll sentinel */}
        <div className="col-span-full h-1" ref={feed.sentinel} />
      </div>
    </main>
  );
}
