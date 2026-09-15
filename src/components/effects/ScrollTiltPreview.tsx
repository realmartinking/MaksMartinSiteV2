'use client';

import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
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

const getColumns = () => window.matchMedia('(min-width: 1024px)').matches
  ? 3 : window.matchMedia('(min-width: 640px)').matches ? 2 : 1;
const getServerColumns = () => 3;
function subscribeColumns(update: () => void) {
  const queries = [640, 1024].map((width) => window.matchMedia(`(min-width: ${width}px)`));
  queries.forEach((query) => query.addEventListener('change', update));
  return () => queries.forEach((query) => query.removeEventListener('change', update));
}

export function ScrollTiltPreview({ children, scrollY }: {
  children: ReactNode[];
  scrollY: MotionValue<number>;
}) {
  const columns = useSyncExternalStore(subscribeColumns, getColumns, getServerColumns);
  return Array.from({ length: Math.ceil(children.length / columns) }, (_, row) => (
    <ScrollTiltRow key={row} columns={columns} scrollY={scrollY}>
      {children.slice(row * columns, (row + 1) * columns)}
    </ScrollTiltRow>
  ));
}

/**
 * Opt-in motion study inspired by Ruixen's Scroll Tilted Grid:
 * https://ruixen.com/docs/components/scroll-tilted-grid
 *
 * One perspective and one transformed plane for the whole row. Individual
 * cards stay flat inside it, so mixed heights cannot produce intersecting
 * card planes. Measure the untouched row anchor, never the moving artwork.
 */
function ScrollTiltRow({
  children,
  columns,
  scrollY,
}: {
  children: ReactNode;
  columns: number;
  scrollY: MotionValue<number>;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  // -1: entrance, 0: the original layout, +1: exit.
  const phase = useMotionValue(0);
  const travel = useMotionValue(0);
  const perspective = useMotionValue(1000);

  // Subscribe before the layout effect sets the first measured phase.
  const rotateX = useTransform(phase, (p) => -p * 62);
  const z = useTransform(phase, (p) => Math.abs(p) * 150);
  const y = useTransform(() => -phase.get() * travel.get());
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
      const gap = parseFloat(getComputedStyle(element.firstElementChild!).columnGap) || 0;
      const columnWidth = (rect.width - gap * (columns - 1)) / columns;
      referenceHeight = Math.min(columnWidth * 0.75, viewport * 0.65);
      // Keep the full plane safely in front of the camera on large displays.
      perspective.set(Math.max(1000, rect.height * 1.6));
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
    // Earlier rows or a breakpoint change can move this row's layout anchor.
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
  }, [columns, perspective, phase, scrollY, travel]);

  return (
    <motion.div
      ref={anchor}
      className="col-span-12 relative"
      data-scroll-tilt="row"
      style={{ perspective, perspectiveOrigin: 'center' }}
    >
      <motion.div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          columnGap: 'var(--grid-gap)',
          alignItems: 'start',
          rotateX, z, y, filter, opacity,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
