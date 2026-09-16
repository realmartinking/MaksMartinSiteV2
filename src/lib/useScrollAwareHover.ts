'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { isScrollMoving, subscribeScrollActivity } from './scrollActivity';

/** A passing card under a stationary pointer is not a new hover during scroll.
 * Restore the card under the pointer once the scroll settles. Keyboard focus
 * remains immediate; touch taps do not leave a synthetic hover behind.
 */
export function useScrollAwareHover<T extends HTMLElement>(
  ref: RefObject<T | null>, selector: string, onChange?: (element: HTMLElement | null) => void,
) {
  const callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let active: HTMLElement | null = null;
    let point: { x: number; y: number } | null = null;
    let focused: HTMLElement | null = null;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const find = (node: EventTarget | null) => {
      const element = node instanceof Element ? node.closest<HTMLElement>(selector) : null;
      return element && root.contains(element) ? element : null;
    };
    const apply = (element: HTMLElement | null) => {
      if (active === element) return;
      active?.removeAttribute('data-hovered');
      active = element;
      active?.setAttribute('data-hovered', '');
      root.toggleAttribute('data-hover-active', !!active);
      callback.current?.(active);
    };
    const restore = () => apply(focused ?? (point && fine.matches ? find(document.elementFromPoint(point.x, point.y)) : null));
    const remember = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && fine.matches) point = { x: event.clientX, y: event.clientY };
    };
    const move = (event: PointerEvent) => {
      remember(event);
      if (event.pointerType !== 'touch' && fine.matches && !isScrollMoving()) apply(find(event.target));
    };
    const leave = () => { point = null; apply(focused); };
    const focus = (event: FocusEvent) => {
      const target = find(event.target);
      if (target?.matches(':focus-visible')) { focused = target; apply(target); }
    };
    const blur = () => { focused = null; if (!isScrollMoving()) restore(); else apply(null); };
    const unsubscribe = subscribeScrollActivity(moving => {
      if (moving) apply(focused); else restore();
    });
    root.addEventListener('pointerover', remember);
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', leave);
    root.addEventListener('focusin', focus);
    root.addEventListener('focusout', blur);
    return () => {
      unsubscribe();
      active?.removeAttribute('data-hovered'); root.removeAttribute('data-hover-active');
      root.removeEventListener('pointerover', remember);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      root.removeEventListener('focusin', focus);
      root.removeEventListener('focusout', blur);
    };
  }, [ref, selector]);
}
