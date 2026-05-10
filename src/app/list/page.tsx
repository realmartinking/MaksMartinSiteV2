'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PROJECTS } from '@/lib/projects';

export default function ListPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cycles, setCycles] = useState(2);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Play the active video (hovered on desktop, expanded on mobile)
  const activeId = hoveredId || expandedId;
  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      if (id === activeId) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeId]);

  const setVideoRef = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) videoRefs.current.set(id, el);
    else videoRefs.current.delete(id);
  }, []);

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

  return (
    <main className="min-h-screen pb-[20vh]" style={{ paddingTop: 'var(--grid-padding-top)' }}>
      {/* Project name stack */}
      <div
        className={[
          'flex flex-col items-center pointer-events-none',
          '[&:has(.list-item:hover)_.list-item:not(:hover)]:blur-[2px]',
          '[&:has(.list-item:hover)_.list-item:not(:hover)]:opacity-30',
        ].join(' ')}
      >
        {Array.from({ length: cycles }).flatMap((_, c) =>
          PROJECTS.map((p, idx) => {
            const isExpanded = expandedId === p.id;
            return (
              <div
                key={`${c}-${p.id}`}
                className="w-full text-center overflow-hidden md:-mb-2"
                style={{
                  animation: `list-entrance 1s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min((c * PROJECTS.length + idx) * 0.08, 1.2)}s both`,
                }}
              >
                <span
                  className={[
                    'list-item inline-block font-bold uppercase pointer-events-auto',
                    'text-[calc(1rem+6vw)]',
                    'leading-[0.9] md:leading-[0.85] lg:leading-[0.8]',
                    'transition-[filter,opacity] duration-300 ease-out',
                  ].join(' ')}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  {p.name}
                </span>

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
                            ref={(el) => setVideoRef(p.id, el)}
                            src={p.videoSrc}
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
              </div>
            );
          })
        )}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {/* Fixed bottom-right preview panel (desktop only) */}
      <div className="hidden md:block fixed bottom-2 right-3 z-30 w-full max-w-[24vw] pointer-events-none">
        {PROJECTS.map((p) => (
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
