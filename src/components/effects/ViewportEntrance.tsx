'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { EntranceQueue } from '@/lib/entranceQueue';

// One observer for the whole feed. A new viewport group receives its own
// stagger, including repeated projects and batches appended by infinite scroll.
let observer: IntersectionObserver | undefined;
let introObserver: MutationObserver | undefined;
let queue: EntranceQueue;
const pending = new Set<HTMLElement>();
const mounted = new Set<HTMLElement>();

function observeEntrance(element: HTMLElement) {
  if (!observer) {
    queue = new EntranceQueue(document.documentElement.dataset.intro !== 'ready');
    introObserver = new MutationObserver(() => {
      if (document.documentElement.dataset.intro === 'ready') {
        queue.releaseIntro(performance.now());
        introObserver?.disconnect();
      }
    });
    introObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-intro'] });
    observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(entry => entry.isIntersecting && pending.has(entry.target as HTMLElement));
      visible.sort((a, b) => a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      const now = performance.now();
      visible.forEach((entry) => {
        const target = entry.target as HTMLElement;
        target.style.setProperty('--entrance-delay', `${queue.delay(now)}s`);
        target.dataset.entrance = 'visible';
        observer?.unobserve(target);
        pending.delete(target);
      });
    }, { threshold: 0 });
  }
  pending.add(element);
  mounted.add(element);
  observer.observe(element);
  return () => {
    observer?.unobserve(element);
    pending.delete(element);
    mounted.delete(element);
    if (!mounted.size) {
      observer?.disconnect(); observer = undefined;
      introObserver?.disconnect(); introObserver = undefined;
    }
  };
}

export function ViewportEntrance({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => observeEntrance(ref.current!), []);
  return <div ref={ref} data-entrance="waiting" className={`project-entrance ${className}`}>{children}</div>;
}
