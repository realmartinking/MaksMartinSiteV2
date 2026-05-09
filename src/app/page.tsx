'use client';

import { useRef } from 'react';
import { PROJECTS } from '@/lib/projects';

export default function ListPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleMouseEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    const container = containerRef.current;
    if (!container) return;
    const links = container.querySelectorAll('a');
    container.classList.add('list-active');
    links.forEach((a) => {
      if (a === e.currentTarget) {
        a.classList.remove('is-inactive');
        a.classList.add('is-active');
      } else {
        a.classList.remove('is-active');
        a.classList.add('is-inactive');
      }
    });
  }

  function handleMouseLeave() {
    const container = containerRef.current;
    if (!container) return;
    container.classList.remove('list-active');
    container.querySelectorAll('a').forEach((a) => {
      a.classList.remove('is-active', 'is-inactive');
    });
  }

  return (
    <main className="min-h-screen pt-[15vh] pb-[20vh]">
      <div
        ref={containerRef}
        className="flex flex-col items-center"
        onMouseLeave={handleMouseLeave}
      >
        {PROJECTS.map((p) => (
          <a
            key={p.id}
            href={p.url || '#'}
            onMouseEnter={handleMouseEnter}
            className={[
              'relative font-bold uppercase text-center overflow-hidden w-full',
              'text-[calc(1rem+6vw)]',
              'leading-[0.9] md:leading-[0.85] lg:leading-[0.8]',
              'md:-mb-2',
              'transition-[filter,opacity] duration-300',
              // when parent has .list-active, inactive links get blur+fade
              '[.list-active_&.is-inactive]:blur-[3px]',
              '[.list-active_&.is-inactive]:opacity-30',
            ].join(' ')}
          >
            {p.name}
          </a>
        ))}
      </div>
    </main>
  );
}
