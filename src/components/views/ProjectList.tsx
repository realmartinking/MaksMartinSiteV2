'use client';

import { useEffect, useState } from 'react';
import { useProjectFeed } from '@/hooks/useProjectFeed';
import { PROJECTS, type Project } from '@/lib/projects';
import { ViewportEntrance } from '@/components/effects/ViewportEntrance';
import { GridTile } from '@/components/grid/GridTile';
import { useScrollAwareHover } from '@/lib/useScrollAwareHover';

export function ProjectList({ projects = PROJECTS, infinite = true }: { projects?: Project[]; infinite?: boolean }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const feed = useProjectFeed(projects.length, infinite ? 2 : 1, infinite, expandedId);
  const [hoverPreview, setHoverPreview] = useState(false);
  useScrollAwareHover(feed.root, '.project-list-title', element => setHoveredId(element?.dataset.projectId ?? null));

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
    const resetPreview = () => { setHoverPreview(desktop.matches); setExpandedId(null); setHoveredId(null); };
    resetPreview();
    desktop.addEventListener('change', resetPreview);
    return () => desktop.removeEventListener('change', resetPreview);
  }, []);

  return (
    <main className="min-h-screen pb-[20vh]" style={{ paddingTop: 'var(--grid-padding-top)' }}>
      {/* Project name stack */}
      <div
        ref={feed.root} data-mobile-feed={feed.mobile || undefined}
        style={{ paddingTop: feed.before, paddingBottom: feed.after }}
        className="project-hover-list flex flex-col items-center pointer-events-none"
      >
        {feed.indices.map(key => {
          const p = projects[key % projects.length];
          const isExpanded = expandedId === key;
          return (
            <ViewportEntrance
              key={key} feedIndex={key}
              className="w-full text-center leading-none px-[var(--grid-padding-x)]"
            >
              <button
                type="button"
                data-project-id={p.id}
                className={[
                  'project-list-title block w-fit max-w-full mx-auto font-bold uppercase pointer-events-auto bg-transparent border-0 p-0 cursor-pointer',
                  'text-[calc(1rem+6vw)]',
                  'leading-[0.76] whitespace-normal [overflow-wrap:anywhere]',
                  'transition-[filter,opacity] duration-300 ease-out',
                ].join(' ')}
                onClick={() => {
                  if (!hoverPreview) setExpandedId(isExpanded ? null : key);
                }}
                aria-expanded={hoverPreview ? undefined : isExpanded}
              >
                {p.name}
              </button>

              {/* Mobile inline expand */}
              <div
                data-feed-expanded={isExpanded || undefined}
                className="grid pointer-events-auto transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="py-3 px-4">
                    {isExpanded && <GridTile project={p} priority />}
                  </div>
                </div>
              </div>
            </ViewportEntrance>
          );
        })}
      </div>

      <div ref={feed.sentinel} className="h-1" />

      {hoverPreview && (
        <div className="fixed bottom-2 right-3 z-30 w-full max-w-[24vw] pointer-events-none">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`absolute bottom-0 right-0 w-full transition-opacity duration-200 ease-out ${hoveredId === p.id ? 'opacity-100' : 'opacity-0'}`}
            >
              <GridTile project={p} active={hoveredId === p.id} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
