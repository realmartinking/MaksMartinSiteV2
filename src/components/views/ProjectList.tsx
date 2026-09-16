'use client';

import { useEffect, useRef, useState } from 'react';
import { PROJECTS, type Project } from '@/lib/projects';
import { ViewportEntrance } from '@/components/effects/ViewportEntrance';
import { ProjectVideo } from '@/components/grid/ProjectVideo';
import { useScrollAwareHover } from '@/lib/useScrollAwareHover';

export function ProjectList({ projects = PROJECTS, infinite = true }: { projects?: Project[]; infinite?: boolean }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cycles, setCycles] = useState(infinite ? 2 : 1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const hoverRoot = useRef<HTMLDivElement>(null);
  useScrollAwareHover(hoverRoot, '.project-list-title', element => setHoveredId(element?.dataset.projectId ?? null));

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const resetPreview = () => { setIsDesktop(desktop.matches); setExpandedId(null); setHoveredId(null); };
    resetPreview();
    desktop.addEventListener('change', resetPreview);
    return () => desktop.removeEventListener('change', resetPreview);
  }, []);

  // Infinite scroll — no cap
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !infinite) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setCycles((c) => c + 1); },
      { rootMargin: '1500px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [infinite, cycles]);

  return (
    <main className="min-h-screen pb-[20vh]" style={{ paddingTop: 'var(--grid-padding-top)' }}>
      {/* Project name stack */}
      <div
        ref={hoverRoot}
        className="project-hover-list flex flex-col items-center pointer-events-none"
      >
        {Array.from({ length: cycles }).flatMap((_, c) =>
          projects.map((p) => {
            const key = `${c}-${p.id}`;
            const isExpanded = expandedId === key;
            return (
              <ViewportEntrance
                key={key}
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
                    if (window.matchMedia('(max-width: 767px)').matches) setExpandedId(isExpanded ? null : key);
                  }}
                  aria-expanded={isExpanded}
                >
                  {p.name}
                </button>

                {/* Mobile inline expand */}
                <div
                  className="md:hidden grid pointer-events-auto transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="py-3 px-4">
                      {isExpanded && (
                        p.videoSrc ? (
                          <ProjectVideo project={p} active />
                        ) : (
                          <img
                            src={p.imageSrc}
                            alt={p.name}
                            className="w-full h-auto"
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </ViewportEntrance>
            );
          })
        )}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {/* Fixed bottom-right preview panel (desktop only) */}
      <div className="hidden md:block fixed bottom-2 right-3 z-30 w-full max-w-[24vw] pointer-events-none">
        {projects.map((p) => (
          p.videoSrc ? (
            <div
              key={p.id}
              className={[
                'absolute bottom-0 right-0 w-full h-auto',
                'transition-opacity duration-200 ease-out',
                hoveredId === p.id ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              <ProjectVideo project={p} active={isDesktop && hoveredId === p.id} />
            </div>
          ) : (
            <img
              key={p.id}
              src={p.imageSrc}
              alt={p.name}
              loading="lazy"
              className={[
                'absolute bottom-0 right-0 w-full h-auto',
                'transition-opacity duration-200 ease-out',
                hoveredId === p.id ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            />
          )
        ))}
      </div>
    </main>
  );
}
