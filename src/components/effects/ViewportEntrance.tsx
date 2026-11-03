'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { EntranceQueue } from '@/lib/entranceQueue';
import { MOBILE_LAYOUT_QUERY } from '@/lib/productionNavigation';

// One observer for the whole feed. A new viewport group receives its own
// stagger, including repeated projects and batches appended by infinite scroll.
let observer: IntersectionObserver | undefined;
let introObserver: MutationObserver | undefined;
let queue: EntranceQueue;
let removeScrollListener: (() => void) | undefined;
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
    const phone = window.matchMedia(MOBILE_LAYOUT_QUERY);
    let scrolled = false;
    let lastY = window.scrollY;
    let lastDirectionDown = true;
    let lastTime = performance.now();
    let fastUntil = 0;
    const trackScroll = () => {
      const y = window.scrollY;
      if (!phone.matches || y === lastY) return;
      const distance = Math.abs(y - lastY);
      const now = performance.now();
      const speed = distance / Math.max(16, now - lastTime);
      scrolled = true;
      lastDirectionDown = y > lastY;
      if (distance > window.innerHeight / 3 || speed > 1.25 || now < fastUntil) {
        if (now >= fastUntil) {
          for (const row of mounted) {
            if (row.dataset.entrance !== 'visible') continue;
            if (row.closest('.project-hover-list')) {
              // A swipe may interrupt the opening cascade. Release its queued
              // titles but let each one's original movement run to completion.
              if (parseFloat(row.style.getPropertyValue('--entrance-delay')) > 0) {
                row.style.setProperty('--entrance-delay', '0s');
              }
            } else {
              row.dataset.entrance = 'settled';
            }
          }
        }
        fastUntil = now + 150;
      }
      lastY = y;
      lastTime = now;
    };
    window.addEventListener('scroll', trackScroll, { passive: true });
    removeScrollListener = () => window.removeEventListener('scroll', trackScroll);
    observer = new IntersectionObserver((entries) => {
      trackScroll();
      const visible = entries.filter(entry => entry.isIntersecting && pending.has(entry.target as HTMLElement));
      visible.sort((a, b) => a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      const now = performance.now();
      visible.forEach((entry, index) => {
        const target = entry.target as HTMLElement;
        const fast = phone.matches && now < fastUntil;
        if (fast && !target.closest('.project-hover-list')) {
          target.dataset.entrance = 'settled';
        } else {
          let delay;
          if (fast) {
            // Several rows can enter between frames during a fling. The
            // leading row starts now; titles already inside the screen join
            // the same 80ms cascade partway through their entrance.
            const fromEdge = lastDirectionDown ? visible.length - 1 - index : index;
            delay = -Math.min(fromEdge, 4) * 0.08;
          } else {
            delay = phone.matches && scrolled ? Math.min(index, 3) * 0.08 : queue.delay(now);
          }
          target.style.setProperty('--entrance-delay', `${delay}s`);
          target.dataset.entrance = 'visible';
        }
        observer?.unobserve(target);
        pending.delete(target);
      });
    }, { threshold: 0 });
  }
  element.dataset.entrance = 'waiting';
  pending.add(element);
  mounted.add(element);
  observer.observe(element);
  return () => {
    observer?.unobserve(element);
    pending.delete(element);
    mounted.delete(element);
    if (!mounted.size) {
      removeScrollListener?.(); removeScrollListener = undefined;
      observer?.disconnect(); observer = undefined;
      introObserver?.disconnect(); introObserver = undefined;
    }
  };
}

export function ViewportEntrance({ children, className = '', feedIndex }: { children: ReactNode; className?: string; feedIndex?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => observeEntrance(ref.current!), []);
  return <div data-feed-index={feedIndex} className={className}>
    <div ref={ref} className="project-entrance h-full">{children}</div>
  </div>;
}
