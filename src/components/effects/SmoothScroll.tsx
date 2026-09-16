'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';
import { publishScrollFrame, setScrollDriver } from '@/lib/scrollFrame';

export function SmoothScroll() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  useEffect(() => {
    // The infinite Production reels own their gestures and animation clock.
    if (reduced || pathname === '/production' || pathname === '/production/folder' || pathname === '/production/roll') return;
    const lenis = new Lenis({
      lerp: 0.085, wheelMultiplier: 1.08,
      smoothWheel: true, syncTouch: false, autoRaf: false,
      anchors: true, stopInertiaOnNavigate: true,
      prevent: (node) => node.closest('[data-lenis-prevent]') !== null,
    });
    setScrollDriver(true);
    const unsubscribe = lenis.on('scroll', publishScrollFrame);
    let frame = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(tick);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (document.hidden) lenis.stop();
      else { lenis.start(); frame = requestAnimationFrame(tick); }
    };
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', visibility);
      unsubscribe();
      lenis.destroy();
      setScrollDriver(false);
    };
  }, [pathname, reduced]);
  return null;
}
