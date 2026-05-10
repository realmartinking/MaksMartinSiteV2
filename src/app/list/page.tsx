'use client';

import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '@/lib/projects';

export default function ListPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  return (
    <main className="min-h-screen pt-[20vh] pb-[20vh]">
      {/* Project name stack */}
      <div className="flex flex-col items-center">
        {Array.from({ length: cycles }).flatMap((_, c) =>
          PROJECTS.map((p) => (
            <a
              key={`${c}-${p.id}`}
              href={p.url || '#'}
              onClick={(e) => { if (!p.url) e.preventDefault(); }}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={[
                'block w-full font-bold uppercase text-center overflow-hidden',
                'text-[calc(1rem+6vw)]',
                'leading-[0.9] md:leading-[0.85] lg:leading-[0.8]',
                'md:-mb-2',
                'transition-[filter,opacity] duration-300',
                hoveredId && hoveredId !== p.id
                  ? 'blur-[2px] opacity-30'
                  : '',
              ].join(' ')}
            >
              {p.name}
            </a>
          ))
        )}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {/* Fixed bottom-right preview panel */}
      <div className="fixed bottom-2 right-3 z-30 w-full max-w-[24vw] pointer-events-none">
        {PROJECTS.map((p) => (
          p.videoSrc ? (
            <video
              key={p.id}
              src={p.videoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className={[
                'absolute bottom-0 right-0 w-full h-auto',
                'transition-opacity duration-300',
                hoveredId === p.id ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            />
          ) : (
            <img
              key={p.id}
              src={p.imageSrc}
              alt={p.name}
              className={[
                'absolute bottom-0 right-0 w-full h-auto',
                'transition-opacity duration-300',
                hoveredId === p.id ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            />
          )
        ))}
      </div>
    </main>
  );
}
