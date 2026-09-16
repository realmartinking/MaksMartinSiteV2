'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PROJECTS, type Project } from '@/lib/projects';
import { ViewportEntrance } from '@/components/effects/ViewportEntrance';
import { useScrollAwareHover } from '@/lib/useScrollAwareHover';

export function ProjectList({ projects = PROJECTS, infinite = true }: { projects?: Project[]; infinite?: boolean }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cycles, setCycles] = useState(infinite ? 2 : 1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const hoverRoot = useRef<HTMLDivElement>(null);
  useScrollAwareHover(hoverRoot, '.project-list-title', element => setHoveredId(element?.dataset.projectId ?? null));

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const resetPreview = () => { setExpandedId(null); setHoveredId(null); };
    desktop.addEventListener('change', resetPreview);
    return () => desktop.removeEventListener('change', resetPreview);
  }, []);

  // Inline mobile videos own their playback; don't also decode the hidden
  // desktop preview for an expanded item.
  const activeId = hoveredId;
  useEffect(() => {
    let disposed = false;
    const update = () => videoRefs.current.forEach((video, id) => {
      if (id === activeId && !document.hidden && window.matchMedia('(min-width: 768px)').matches) {
        video.play().then(() => { if (disposed || document.hidden) video.pause(); }).catch(() => {});
      } else video.pause();
    });
    update();
    document.addEventListener('visibilitychange', update);
    window.addEventListener('resize', update);
    return () => { disposed = true; document.removeEventListener('visibilitychange', update); window.removeEventListener('resize', update); };
  }, [activeId]);

  const setVideoRef = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) videoRefs.current.set(id, el);
    else videoRefs.current.delete(id);
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
                    'leading-[0.78] whitespace-normal [overflow-wrap:anywhere]',
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
                          <video
                            src={p.videoSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-auto"
                          />
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
            <video
              key={p.id}
              ref={(el) => setVideoRef(p.id, el)}
              src={p.videoSrc}
              loop
              muted
              playsInline
              preload="none"
              className={[
                'absolute bottom-0 right-0 w-full h-auto',
                'transition-opacity duration-200 ease-out',
                hoveredId === p.id ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            />
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
