'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PROJECTS } from '@/lib/projects';

export default function ListPage() {
  const prefersReduced = useReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cycles, setCycles] = useState(2);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Play only the hovered video, pause the rest
  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      if (id === hoveredId) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [hoveredId]);

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
          'flex flex-col items-center',
          '[&:has(.list-item:hover)_.list-item:not(:hover)]:blur-[2px]',
          '[&:has(.list-item:hover)_.list-item:not(:hover)]:opacity-30',
        ].join(' ')}
      >
        {Array.from({ length: cycles }).flatMap((_, c) =>
          PROJECTS.map((p, idx) => {
            const isFirstCycle = c === 0;
            return (
              <motion.div
                key={`${c}-${p.id}`}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                initial={prefersReduced || !isFirstCycle ? false : { opacity: 0, y: 40, filter: 'blur(12px)' }}
                animate={isFirstCycle ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
                transition={prefersReduced || !isFirstCycle ? { duration: 0 } : {
                  duration: 1.0,
                  ease: [0.16, 1, 0.3, 1],
                  delay: Math.min(idx * 0.08, 1.2),
                }}
                className={[
                  'list-item w-full font-bold uppercase text-center overflow-hidden',
                  'text-[calc(1rem+6vw)]',
                  'leading-[0.9] md:leading-[0.85] lg:leading-[0.8]',
                  'md:-mb-2',
                  'transition-[filter,opacity] duration-300 ease-out',
                ].join(' ')}
              >
                {p.name}
              </motion.div>
            );
          })
        )}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {/* Fixed bottom-right preview panel (hidden on mobile) */}
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
