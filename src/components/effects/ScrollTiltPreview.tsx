'use client';

import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { cubicBezier } from 'framer-motion';
import { subscribeScrollFrame } from '@/lib/scrollFrame';

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

type Row = {
  anchor: HTMLDivElement;
  plane: HTMLDivElement;
  top: number;
  height: number;
  referenceHeight: number;
  travel: number;
  perspective: number;
  phase: number | null;
};

/** One shared plane per row; the approved Ruixen curves and geometry are unchanged. */
export function ScrollTiltPreview({ children }: { children: ReactNode[] }) {
  const columns = useSyncExternalStore(subscribeColumns, getColumns, getServerColumns);
  const anchors = useRef(new Map<number, HTMLDivElement>());
  const rowCount = Math.ceil(children.length / columns);

  useLayoutEffect(() => {
    const rows: Row[] = [...anchors.current.entries()].sort(([a], [b]) => a - b).map(([, anchor]) => ({
      anchor, plane: anchor.firstElementChild as HTMLDivElement,
      top: 0, height: 0, referenceHeight: 0, travel: 0, perspective: 1000, phase: null,
    }));
    if (!rows.length) return;

    const desktop = window.matchMedia('(min-width: 768px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const active = new Set<Row>();
    let viewport = window.innerHeight;
    let overscan = 1200;
    let frame = 0;
    let needsMeasure = true;

    const reset = (row: Row) => {
      row.plane.style.transform = 'none';
      row.plane.style.filter = 'none';
      row.plane.style.opacity = '1';
      row.plane.style.willChange = '';
      row.anchor.dataset.motionActive = 'false';
      row.phase = null;
    };

    const measure = () => {
      viewport = window.innerHeight;
      const gap = parseFloat(getComputedStyle(rows[0].plane).columnGap) || 0;
      // Batch geometry reads before writing styles. No layout reads during scroll.
      rows.forEach((row) => {
        const rect = row.anchor.getBoundingClientRect();
        row.top = 0;
        for (let parent: HTMLElement | null = row.anchor; parent; parent = parent.offsetParent as HTMLElement | null) {
          row.top += parent.offsetTop;
        }
        row.height = rect.height;
        const width = (rect.width - gap * (columns - 1)) / columns;
        row.referenceHeight = Math.min(width * 0.75, viewport * 0.65);
        row.travel = Math.min(96, row.referenceHeight * 0.24);
        row.perspective = Math.max(1000, row.height * 1.6);
      });
      overscan = rows.reduce((margin, row) => Math.max(margin, row.height), 480);
      rows.forEach((row) => {
        row.anchor.style.perspective = `${row.perspective}px`;
        reset(row);
      });
      active.clear();
      needsMeasure = false;
    };

    const paint = () => {
      if (document.hidden) return;
      if (needsMeasure) measure();
      const scrollTop = window.scrollY;
      const start = scrollTop - overscan;
      const end = scrollTop + viewport + overscan;
      const enabled = desktop.matches && !reduced.matches;

      // Sorted row anchors keep per-frame work bounded as the infinite feed grows.
      let lo = 0, hi = rows.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (rows[mid].top + rows[mid].height < start) lo = mid + 1;
        else hi = mid;
      }
      active.forEach((row) => {
        if (row.top + row.height < start || row.top > end) {
          reset(row);
          active.delete(row);
        }
      });
      for (let i = lo; i < rows.length && rows[i].top <= end; i++) {
        const row = rows[i];
        if (!active.has(row)) {
          active.add(row);
          row.anchor.dataset.motionActive = 'true';
          // Retain the same plane through its flat focus region, avoiding a
          // fresh compositing allocation at every entry/exit on Safari.
          if (enabled) row.plane.style.willChange = 'transform';
        }
        const y = row.top - scrollTop;
        let phase = 0;
        if (enabled && y > viewport * 0.65) {
          phase = -(1 - enterEase(clamp((viewport - y) / (viewport * 0.35))));
        } else if (enabled && y < viewport * 0.12) {
          phase = exitEase(clamp((viewport * 0.12 - y) / (row.referenceHeight + viewport * 0.12)));
        }
        if (phase === row.phase) continue;
        row.phase = phase;
        const amount = Math.abs(phase);
        row.plane.style.transform = phase === 0 ? 'none'
          : `translateY(${-phase * row.travel}px) translateZ(${amount * 150}px) rotateX(${-phase * 62}deg)`;
        // An unfiltered row needs no offscreen blur surface while in focus.
        row.plane.style.filter = phase === 0 ? 'none' : `blur(${amount * 6}px)`;
        row.plane.style.opacity = `${1 - amount * 0.45}`;
      }
    };
    const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(() => { frame = 0; paint(); }); };
    const scheduleMeasure = () => { needsMeasure = true; schedule(); };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else scheduleMeasure();
    };

    paint();
    const observer = new ResizeObserver(scheduleMeasure);
    rows.forEach((row) => observer.observe(row.anchor));
    const grid = rows[0].anchor.closest('[data-project-grid]');
    if (grid) observer.observe(grid);
    const unsubscribe = subscribeScrollFrame(paint);
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('pageshow', scheduleMeasure);
    document.addEventListener('visibilitychange', onVisibility);
    desktop.addEventListener('change', scheduleMeasure);
    reduced.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      unsubscribe();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('pageshow', scheduleMeasure);
      document.removeEventListener('visibilitychange', onVisibility);
      desktop.removeEventListener('change', scheduleMeasure);
      reduced.removeEventListener('change', schedule);
    };
  }, [columns, rowCount]);

  return Array.from({ length: rowCount }, (_, row) => (
    <div
      key={row}
      ref={(element) => { if (element) anchors.current.set(row, element); else anchors.current.delete(row); }}
      className="col-span-12 relative"
      data-scroll-tilt="row"
      style={{ perspective: 1000, perspectiveOrigin: 'center' }}
    >
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        columnGap: 'var(--grid-gap)', alignItems: 'start', transformOrigin: 'center center',
      }}>
        {children.slice(row * columns, (row + 1) * columns)}
      </div>
    </div>
  ));
}
