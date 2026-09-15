'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMotionValue, useReducedMotion } from 'framer-motion';
import { PRODUCTION_PROJECTS } from '@/lib/projects';
import { wrapProject } from '@/lib/folderMotion';
import { GridTile } from '@/components/grid/GridTile';
import { ProjectEntrance } from '@/components/effects/ProjectEntrance';
import styles from './Production.module.css';

export function ProductionReel() {
  const position = useMotionValue(0);
  const reduced = useReducedMotion();
  const [center, setCenter] = useState(0);
  const [entering, setEntering] = useState(true);
  const planes = useRef(new Map<number, HTMLDivElement>());
  const root = useRef<HTMLElement>(null);
  const target = useRef(0);
  const move = useRef<(value: number) => void>(() => {});
  const radius = 3;
  const slots = Array.from({ length: radius * 2 + 1 }, (_, index) => center + index - radius);

  useLayoutEffect(() => {
    let height = innerHeight;
    const paint = () => {
      const progress = position.get();
      planes.current.forEach((plane, index) => {
        const distance = index - progress;
        const amount = reduced ? 0 : Math.max(0, Math.min(1, (Math.abs(distance) - 0.12) / 0.88));
        plane.style.transform = `translate(-50%, -50%) translate3d(0, ${distance * height * 0.58}px, ${amount * 150}px) rotateX(${Math.sign(distance) * amount * 62}deg)`;
        plane.style.filter = amount === 0 ? 'none' : `blur(${amount * 6}px)`;
        plane.style.opacity = `${1 - amount * 0.45}`;
        plane.style.zIndex = `${100 - Math.round(Math.abs(distance) * 10)}`;
      });
    };
    const measure = () => {
      height = innerHeight;
      paint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    planes.current.forEach((plane) => observer.observe(plane));
    let windowCenter = center;
    const unsubscribe = position.on('change', (value) => {
      paint();
      const next = Math.round(value);
      if (next !== windowCenter) { windowCenter = next; setCenter(next); }
    });
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); unsubscribe(); window.removeEventListener('resize', measure); };
  }, [position, reduced, center]);

  useEffect(() => {
    let raf = 0, lastTime = 0;
    const tick = (time: number) => {
      const dt = lastTime ? Math.min(64, time - lastTime) : 1000 / 60;
      lastTime = time;
      const difference = target.current - position.get();
      if (Math.abs(difference) < 0.0005 || reduced) {
        position.set(target.current);
        raf = 0; lastTime = 0;
      } else {
        // The same time-corrected inertia as the reference's Lenis settings.
        position.set(position.get() + difference * (1 - Math.pow(1 - 0.085, dt / (1000 / 60))));
        raf = requestAnimationFrame(tick);
      }
    };
    move.current = (value) => {
      target.current = value;
      setEntering(false);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
      else if (position.get() !== target.current && !raf) raf = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', visibility);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', visibility); };
  }, [position, reduced]);

  useEffect(() => {
    const advance = (pixels: number) => move.current(target.current + pixels * 1.08 / (innerHeight * 0.58));
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if ((event.target as Element).closest('[data-lenis-prevent]')) return;
      event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      advance(pixels);
    };
    const keyboard = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement;
      if (element.closest('input, textarea, select, [contenteditable="true"], [data-lenis-prevent]') || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === ' ' && element.closest('button, a')) return;
      const down = ['ArrowDown', 'ArrowRight', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey);
      const up = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey);
      if (down || up || event.key === 'Home') {
        event.preventDefault();
        if (event.repeat) return;
        move.current(event.key === 'Home' ? 0 : Math.round(target.current) + (down ? 1 : -1));
      }
    };
    let touchY = 0;
    const start = (event: TouchEvent) => { touchY = event.touches[0].clientY; };
    const touch = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      event.preventDefault();
      const next = event.touches[0].clientY;
      advance(touchY - next);
      touchY = next;
    };
    const element = root.current!;
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', keyboard);
    element.addEventListener('touchstart', start, { passive: true });
    element.addEventListener('touchmove', touch, { passive: false });
    return () => {
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', keyboard);
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchmove', touch);
    };
  }, []);

  return (
    <main ref={root} className={styles.reel} aria-label="Production Roll" data-reel-position={center}>
      <div className={styles.reelStage}>
        {slots.map((index, slot) => {
          const project = PRODUCTION_PROJECTS[wrapProject(index, PRODUCTION_PROJECTS.length)];
          return (
            <div key={index} data-reel-card={index} ref={(element) => { if (element) planes.current.set(index, element); else planes.current.delete(index); }} className={styles.rollPlane}>
              <ProjectEntrance index={slot} enabled={entering}>
                <GridTile project={project} reserveSpace className="w-full" />
                <p className={styles.caption}>{project.name}. {project.type?.split(' / ')[0]}</p>
              </ProjectEntrance>
            </div>
          );
        })}
      </div>
    </main>
  );
}
