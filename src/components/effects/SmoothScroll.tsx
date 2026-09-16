'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';
import { publishScrollFrame, setScrollDriver } from '@/lib/scrollFrame';
import { noteScrollActivity } from '@/lib/scrollActivity';
import { SCROLL_LERP, SCROLL_WHEEL_GAIN } from '@/lib/scrollTuning';

export function SmoothScroll() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  useEffect(() => {
    // The infinite Production reels own their gestures and animation clock.
    if (reduced || pathname === '/production' || pathname === '/production/folder' || pathname === '/production/roll') return;
    const iosVersion = /(?:iPhone|iPad|iPod).*OS (\d+)_/.exec(navigator.userAgent);
    let pinching = false;
    const lenis: Lenis = new Lenis({
      lerp: SCROLL_LERP, wheelMultiplier: SCROLL_WHEEL_GAIN,
      smoothWheel: true, syncTouch: !iosVersion || Number(iosVersion[1]) >= 16,
      syncTouchLerp: SCROLL_LERP, touchInertiaExponent: 1.45, touchMultiplier: 1,
      autoRaf: false,
      virtualScroll: ({ event, deltaY }) => {
        if ('touches' in event) {
          if (event.touches.length > 1) {
            if (!pinching) lenis.scrollTo(lenis.actualScroll, { immediate: true });
            pinching = true;
          }
          if (pinching) { if (!event.touches.length) pinching = false; return false; }
        }
        if (!event.ctrlKey && deltaY) noteScrollActivity();
        return true;
      },
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
