'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'framer-motion';
import { PRODUCTION_PROJECTS } from '@/lib/projects';
import { FolderGesture, folderPose, wrapProject } from '@/lib/folderMotion';
import { GridTile } from '@/components/grid/GridTile';
import { ProjectEntrance } from '@/components/effects/ProjectEntrance';
import styles from './Production.module.css';

export function ProductionReel({ mode }: { mode: 'folder' | 'roll' }) {
  const folder = mode === 'folder';
  const position = useMotionValue(0);
  const reduced = useReducedMotion();
  const [center, setCenter] = useState(0);
  const [entering, setEntering] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);
  const planes = useRef(new Map<number, HTMLDivElement>());
  const openings = useRef(new Map<number, number>());
  const root = useRef<HTMLElement>(null);
  const target = useRef(0);
  const lastInput = useRef(-Infinity);
  const move = useRef<(value: number) => void>(() => {});
  const repaint = useRef<() => void>(() => {});
  // Include an offscreen buffer beyond the far end of the receding stack.
  const radius = folder ? 10 : 3;
  const slots = Array.from({ length: radius * 2 + 1 }, (_, index) => center + index - radius);

  useLayoutEffect(() => {
    let height = innerHeight;
    let cardHeight = 0;
    const paint = () => {
      const progress = position.get();
      planes.current.forEach((plane, index) => {
        const distance = index - progress;
        if (folder) {
          const pose = folderPose(distance, height);
          const open = openings.current.get(index) ?? 0;
          let shift = 0;
          openings.current.forEach((amount, openIndex) => {
            if (openIndex !== index) shift += Math.sign(index - openIndex) * cardHeight * 0.36 * amount;
          });
          const scale = 1600 / (1600 - pose.z - open * 70);
          // Apply depth to the card's center and its size, then tilt locally.
          // A single viewport vanishing point would flatten the nearest cards
          // to a hairline on tall screens instead of keeping readable folders.
          plane.style.transform = `translate(-50%, -50%) translateY(${(pose.y + shift) * scale}px) scale(${scale}) perspective(1600px) rotateX(${reduced ? 0 : pose.rotateX * (1 - open)}deg)`;
          plane.style.zIndex = `${open > 0.01 ? 500 : 100 + Math.round(distance * 10)}`;
          plane.style.filter = 'none';
          plane.style.opacity = '1';
        } else {
          const amount = reduced ? 0 : Math.max(0, Math.min(1, (Math.abs(distance) - 0.12) / 0.88));
          plane.style.transform = `translate(-50%, -50%) translate3d(0, ${distance * height * 0.58}px, ${amount * 150}px) rotateX(${Math.sign(distance) * amount * 62}deg)`;
          plane.style.filter = amount === 0 ? 'none' : `blur(${amount * 6}px)`;
          plane.style.opacity = `${1 - amount * 0.45}`;
          plane.style.zIndex = `${100 - Math.round(Math.abs(distance) * 10)}`;
        }
      });
    };
    repaint.current = paint;
    const measure = () => {
      height = innerHeight;
      cardHeight = planes.current.values().next().value?.offsetHeight ?? 0;
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
  }, [position, reduced, folder, center]);

  useEffect(() => {
    if (!folder) return;
    const indices = new Set([...openings.current.keys(), ...(hovered === null ? [] : [hovered])]);
    const controls = [...indices].map((index) => {
      const from = openings.current.get(index) ?? 0;
      const to = hovered === index ? 1 : 0;
      return animate(from, to, {
        duration: reduced ? 0 : 0.65, ease: [0.22, 1, 0.36, 1],
        onUpdate: (value) => { openings.current.set(index, value); repaint.current(); },
        onComplete: () => { if (!to) openings.current.delete(index); },
      });
    });
    return () => controls.forEach((control) => control.stop());
  }, [hovered, folder, reduced]);

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
      lastInput.current = performance.now();
      setHovered(null);
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
    const gesture = new FolderGesture();
    const advance = (pixels: number, time: number) => {
      if (folder) {
        const step = gesture.push(pixels, time);
        if (step) move.current(Math.round(target.current) + step);
      } else move.current(target.current + pixels * 1.08 / (innerHeight * 0.58));
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if ((event.target as Element).closest('[data-lenis-prevent]')) return;
      event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      lastInput.current = performance.now();
      setHovered(null);
      advance(pixels, event.timeStamp);
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
        gesture.reset();
        move.current(event.key === 'Home' ? 0 : Math.round(target.current) + (down ? 1 : -1));
      }
    };
    let touchY = 0;
    const start = (event: TouchEvent) => { gesture.reset(); touchY = event.touches[0].clientY; };
    const touch = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      event.preventDefault();
      const next = event.touches[0].clientY;
      advance((touchY - next) * (folder ? 2 : 1), event.timeStamp);
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
  }, [folder]);

  const open = (index: number) => {
    if (performance.now() - lastInput.current > 450) setHovered(index);
  };
  return (
    <main ref={root} className={styles.reel} aria-label={`Production ${folder ? 'Folder' : 'Roll'}`} data-reel-position={center}>
      <div className={styles.reelStage} style={folder ? { perspective: 'none' } : undefined}>
        {slots.map((index, slot) => {
          const project = PRODUCTION_PROJECTS[wrapProject(index, PRODUCTION_PROJECTS.length)];
          return (
            <div key={index} data-reel-card={index} ref={(element) => { if (element) planes.current.set(index, element); else planes.current.delete(index); }} className={folder ? styles.folderPlane : styles.rollPlane}>
              <ProjectEntrance index={slot} enabled={entering}>
                {folder ? (
                  <button type="button" className={styles.folderCard} onPointerMove={() => open(index)} onPointerEnter={() => open(index)} onPointerLeave={() => setHovered((current) => current === index ? null : current)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onClick={() => setHovered(index)} aria-label={`Preview ${project.name}`} aria-expanded={hovered === index}>
                    <GridTile project={project} reserveSpace className="w-full" />
                    <span className={styles.caption}>{project.name}. {project.type?.split(' / ')[0]}</span>
                  </button>
                ) : (
                  <><GridTile project={project} reserveSpace className="w-full" /><p className={styles.caption}>{project.name}. {project.type?.split(' / ')[0]}</p></>
                )}
              </ProjectEntrance>
            </div>
          );
        })}
      </div>
      {folder && <nav className={styles.folderControls} aria-label="Folder navigation">
        <button type="button" onClick={() => move.current(Math.round(target.current) - 1)} aria-label="Previous project">↑</button>
        <span aria-live="polite" aria-atomic="true">{String(wrapProject(center, 4) + 1).padStart(2, '0')} / 04</span>
        <button type="button" onClick={() => move.current(Math.round(target.current) + 1)} aria-label="Next project">↓</button>
      </nav>}
    </main>
  );
}
