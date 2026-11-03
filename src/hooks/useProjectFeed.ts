'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { MOBILE_LAYOUT_QUERY } from '@/lib/productionNavigation';

type Window = { first: number; end: number; before: number; after: number; mobile: boolean };
type Period = { items: number; height: number; origin: number; expandedAt: number; extra: number };

// A group contains entire rows AND entire catalogues (e.g. 8 projects in
// a three-column gallery repeat their exact row pattern after 24 tiles).
function periodLength(items: number, columns: number) {
  let a = items, b = columns;
  while (b) [a, b] = [b, a % b];
  return items * columns / a;
}

function initialWindow(items: number): Window {
  return { first: 0, end: items, before: 0, after: 0, mobile: false };
}

export function useProjectFeed(size: number, initialCycles = 1, infinite = true, expanded: number | null = null) {
  const root = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [windowState, setWindowState] = useState(() => initialWindow(size * initialCycles));
  const current = useRef(windowState);
  const expandedIndex = useRef(expanded);
  const measure = useRef<() => void>(undefined);

  useLayoutEffect(() => {
    current.current = windowState;
    expandedIndex.current = expanded;
    measure.current?.();
  }, [windowState, expanded]);

  useLayoutEffect(() => {
    const feed = root.current;
    if (!feed || !infinite || !size) return;
    const mobile = window.matchMedia(MOBILE_LAYOUT_QUERY);
    let extent = size * initialCycles;
    let period: Period | undefined;
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    let observedEnd = -1;
    let desktopAnchor: { index: number; y: number } | undefined;

    function update(next: Window) {
      const last = current.current;
      if (last.mobile === next.mobile && last.first === next.first && last.end === next.end &&
          Math.abs(last.before - next.before) < 0.1 && Math.abs(last.after - next.after) < 0.1) return;
      setWindowState(next);
    }

    // Layout is read only on resize or when a different group mounts. During
    // a native fling use the measured pitch, with one viewport on each side.
    function onScroll() {
      if (!period || !mobile.matches) return;
      const { items, height, origin, expandedAt, extra } = period;
      const offset = (group: number) => group * height + (expandedAt >= 0 && group > expandedAt ? extra : 0);
      const groupAt = (y: number) => {
        if (expandedAt >= 0 && y >= expandedAt * height) {
          if (y < (expandedAt + 1) * height + extra) return expandedAt;
          y -= extra;
        }
        return Math.floor(Math.max(0, y) / height);
      };
      const y = window.scrollY - origin;
      const viewport = window.innerHeight;
      const first = groupAt(y - viewport);
      const end = Math.max(first + 2, groupAt(y + viewport * 2) + 1);
      // One additional physical period gives the compositor room to keep
      // scrolling even while React is mounting the next group.
      extent = Math.max(extent, (end + 1) * items);
      const total = Math.ceil(extent / items);
      update({ first: first * items, end: end * items, before: offset(first),
        after: offset(total) - offset(end), mobile: true });
    }

    function readGeometry() {
      if (!feed || !mobile.matches) return;
      const markers = feed.querySelectorAll<HTMLElement>('[data-feed-index]');
      if (!markers.length) return;
      const first = Number(markers[0].dataset.feedIndex);
      // In the tilted layout each row has a stationary anchor and a moving
      // inner plane. In portrait its wrapper is display:contents, so use the
      // individual tile boxes there, just as in flat galleries and lists.
      const row = markers[0].closest<HTMLElement>('[data-scroll-tilt]');
      const useRows = row && getComputedStyle(row).display !== 'contents';
      const topOf = (tile: HTMLElement) =>
        (useRows ? tile.closest<HTMLElement>('[data-scroll-tilt]')! : tile).getBoundingClientRect().top;
      const firstTop = topOf(markers[0]);
      let columns = 1;
      while (columns < markers.length && Math.abs(topOf(markers[columns]) - firstTop) < 1) columns++;
      const items = periodLength(size, columns);
      const origin = window.scrollY + firstTop - current.current.before;

      if (markers.length <= items || first % items !== 0) {
        const aligned = Math.floor(first / items) * items;
        update({ ...current.current, first: aligned, end: aligned + 2 * items, mobile: true });
        return;
      }
      const expandedAt = expandedIndex.current === null ? -1 : Math.floor(expandedIndex.current / items);
      const preview = feed.querySelector<HTMLElement>('[data-feed-expanded]');
      const extra = preview ? preview.getBoundingClientRect().height : expandedAt >= 0 &&
        expandedAt === period?.expandedAt ? period.extra : 0;
      const measured = topOf(markers[items]) - firstTop;
      const height = measured - (expandedAt === first / items ? extra : 0);
      if (height < 1) return;
      period = { items, height, origin, expandedAt, extra };
      onScroll();
    }
    function afterLayout() {
      if (mobile.matches) {
        readGeometry();
        return;
      }
      const state = current.current;
      if (state.mobile) return;
      if (desktopAnchor) {
        const target = feed?.querySelector<HTMLElement>(`[data-feed-index="${desktopAnchor.index}"]`);
        if (target) window.scrollBy({ top: target.getBoundingClientRect().top - desktopAnchor.y, behavior: 'instant' });
        desktopAnchor = undefined;
      }
      // A short desktop catalogue can fit several copies inside the prefetch
      // margin. Obtain a fresh intersection after appending each copy.
      if (observer && sentinel.current && observedEnd !== state.end) {
        observedEnd = state.end;
        observer.unobserve(sentinel.current);
        observer.observe(sentinel.current);
      }
    }
    measure.current = afterLayout;
    const onResize = () => {
      if (!mobile.matches || frame) return;
      frame = requestAnimationFrame(() => { frame = 0; readGeometry(); });
    };

    function switchLayout() {
      observer?.disconnect();
      period = undefined;
      if (mobile.matches) {
        readGeometry();
      } else {
        const previous = current.current;
        // An index of 50,000 is a position in the virtual collection, not
        // a request to allocate every preceding project on a width change.
        if (previous.mobile && previous.first > 0 && feed) {
          const cards = [...feed.querySelectorAll<HTMLElement>('[data-feed-index]')];
          const card = cards.find(el => el.getBoundingClientRect().bottom > innerHeight / 2) ?? cards.at(-1);
          if (card) desktopAnchor = { index: size + Number(card.dataset.feedIndex) % size,
            y: Math.max(0, Math.min(card.getBoundingClientRect().top, innerHeight / 2)) };
        }
        extent = size * (desktopAnchor ? 2 : initialCycles);
        observedEnd = -1;
        observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting && !mobile.matches) {
            setWindowState(previous => ({ ...previous, end: previous.end + size }));
          }
        }, { rootMargin: '1500px' });
        update(initialWindow(extent));
        afterLayout();
      }
    }

    const resize = new ResizeObserver(onResize);
    resize.observe(feed);
    window.addEventListener('resize', onResize);
    window.addEventListener('pageshow', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    mobile.addEventListener('change', switchLayout);
    switchLayout();
    return () => {
      measure.current = undefined;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer?.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pageshow', onResize);
      window.removeEventListener('scroll', onScroll);
      mobile.removeEventListener('change', switchLayout);
    };
  }, [size, initialCycles, infinite]);

  const indices = Array.from({ length: windowState.end - windowState.first }, (_, i) => windowState.first + i);
  return { root, sentinel, indices, ...windowState };
}
