'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  cubicBezier,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'framer-motion';

const enterEase = cubicBezier(0.22, 1, 0.36, 1);
const exitEase = cubicBezier(0, 0, 0.58, 1);
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Opt-in motion study inspired by Ruixen's Scroll Tilted Grid:
 * https://ruixen.com/docs/components/scroll-tilted-grid
 *
 * Measure the untouched layout anchor, never the transformed artwork. A common
 * width-based travel distance keeps portrait and landscape tiles in phase.
 * The existing grid, media proportions and first row remain unchanged at rest.
 */
export function ScrollTiltPreview({
  children,
  className,
  index,
  scrollY,
}: {
  children: ReactNode;
  className?: string;
  index: number;
  scrollY: MotionValue<number>;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  // -1: entrance, 0: the original layout, +1: exit.
  const phase = useMotionValue(0);
  const travel = useMotionValue(0);
  const side = useMotionValue(0);

  // Subscribe before the layout effect sets the first measured phase.
  const rotateX = useTransform(phase, (p) => -p * 62);
  const z = useTransform(phase, (p) => Math.abs(p) * 150);
  const y = useTransform(() => -phase.get() * travel.get());
  const x = useTransform(() => Math.abs(phase.get()) * side.get() * 16);
  const rotate = useTransform(() => phase.get() * side.get() * 1.5);
  const blur = useTransform(phase, (p) => Math.abs(p) * 6);
  const opacity = useTransform(phase, (p) => 1 - Math.abs(p) * 0.45);
  const filter = useMotionTemplate`blur(${blur}px)`;

  useLayoutEffect(() => {
    const element = anchor.current;
    if (!element) return;

    const desktop = window.matchMedia('(min-width: 768px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let top = 0;
    let viewport = window.innerHeight;
    let referenceHeight = 0;
    let frame = 0;

    const update = () => {
      if (!desktop.matches || reduceMotion.matches) {
        phase.set(0);
        return;
      }
      const y = top - window.scrollY;
      const focusStart = viewport * 0.65;
      const focusEnd = viewport * 0.12;
      if (y > focusStart) {
        phase.set(-(1 - enterEase(clamp((viewport - y) / (viewport - focusStart)))));
      } else if (y < focusEnd) {
        phase.set(exitEase(clamp((focusEnd - y) / (referenceHeight + focusEnd))));
      } else {
        phase.set(0);
      }
    };

    const measure = () => {
      const rect = element.getBoundingClientRect();
      // offsetTop excludes the preloader's temporary transform on <main>.
      top = 0;
      for (let parent: HTMLElement | null = element; parent; parent = parent.offsetParent as HTMLElement | null) {
        top += parent.offsetTop;
      }
      viewport = window.innerHeight;
      referenceHeight = Math.min(rect.width * 0.75, viewport * 0.65);
      side.set(window.innerWidth >= 1024 ? (index % 3) - 1 : (index % 2) * 2 - 1);
      travel.set(Math.min(96, referenceHeight * 0.24));
      update();
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    const unsubscribe = scrollY.on('change', update);
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(element);
    // Media metadata can change earlier row heights without resizing this tile.
    const grid = element.closest('[data-project-grid]');
    if (grid) observer.observe(grid);
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('pageshow', scheduleMeasure);
    desktop.addEventListener('change', scheduleMeasure);
    reduceMotion.addEventListener('change', update);

    return () => {
      unsubscribe();
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('pageshow', scheduleMeasure);
      desktop.removeEventListener('change', scheduleMeasure);
      reduceMotion.removeEventListener('change', update);
    };
  }, [index, phase, scrollY, side, travel]);

  return (
    <div
      ref={anchor}
      className={className}
      data-scroll-tilt="preview"
      style={{ position: 'relative', perspective: 1000, perspectiveOrigin: 'center' }}
    >
      <motion.div
        style={{
          rotateX, z, y, x, rotate, filter, opacity,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
