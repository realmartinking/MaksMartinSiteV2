'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { PRODUCTION_PROJECTS } from '@/lib/projects';
import { FolderScroll, folderPose, folderMediaScale, folderBottomInset, wrapProject, type FolderMetrics } from '@/lib/folderMotion';
import { GridTile } from '@/components/grid/GridTile';
import { ProjectEntrance } from '@/components/effects/ProjectEntrance';
import styles from './Production.module.css';

const RADIUS = 10;
export function ProductionFolder() {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const planes = useRef(new Map<number, HTMLDivElement>());
  const [center, setCenter] = useState(0);
  const [entering, setEntering] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const state = useRef({ position: 0, target: 0, opening: 0, openWanted: false, selected: null as number | null, pending: null as number | null });
  const measure = useRef<() => void>(() => {});
  const wake = useRef<() => void>(() => {});
  const choose = useRef<(index: number) => void>(() => {});
  const slots = Array.from({ length: RADIUS * 2 + 1 }, (_, offset) => center + offset - RADIUS);

  useLayoutEffect(() => {
    let frame = 0, lastTime = 0;
    let metrics: FolderMetrics = { width: innerWidth, height: innerHeight, cardWidth: 0, cardHeight: 0 };
    let previousCenter = Math.round(state.current.position);
    const paint = () => {
      const current = state.current;
      if (stage.current) stage.current.style.clipPath = `inset(0 0 ${folderBottomInset(metrics, current.opening)}px 0)`;
      planes.current.forEach((plane, index) => {
        const pose = folderPose(index - current.position, metrics, current.opening, (current.selected ?? current.position) - current.position);
        plane.style.transform = `translate(-50%, -50%) translateY(${pose.y}px) scale(${pose.scale}) perspective(${pose.perspective}px) rotateX(${pose.angle}deg)`;
        // Nearer files occlude the distant files; no selected-card z-index hack.
        plane.style.zIndex = `${100 + index - Math.round(current.position)}`;
        // Blur the video inside its clipped surface, never the projected plane
        // or its edges. Use the same opening clock as the stack geometry.
        const blur = current.selected !== null && index !== current.selected ? current.opening * 5 : 0;
        plane.style.setProperty('--folder-content-filter', blur < 0.01 ? 'none' : `blur(${blur}px)`);
        const mediaScale = folderMediaScale(blur, metrics.cardWidth, metrics.cardHeight);
        plane.style.setProperty('--folder-content-transform', mediaScale === 1 ? 'none' : `scale(${mediaScale})`);
      });
      root.current?.setAttribute('data-folder-opening', current.opening.toFixed(3));
      root.current?.setAttribute('data-folder-position', current.position.toFixed(4));
    };
    measure.current = () => {
      const card = planes.current.values().next().value;
      metrics = { width: innerWidth, height: innerHeight, cardWidth: card?.offsetWidth ?? 0, cardHeight: card?.offsetHeight ?? 0 };
      paint();
    };
    const tick = (time: number) => {
      const dt = lastTime ? Math.min(64, time - lastTime) : 1000 / 60;
      lastTime = time;
      const current = state.current;
      const difference = current.target - current.position;
      current.position = reduced || Math.abs(difference) < 0.001 ? current.target : current.position + difference * (1 - Math.exp(-dt / 155));
      if (current.pending !== null && Math.abs(current.position - current.pending) < 0.015 && current.opening < 0.002) {
        current.position = current.pending;
        current.selected = current.pending;
        current.openWanted = true;
        current.pending = null;
        setSelected(current.selected);
      }
      const openTarget = current.openWanted ? 1 : 0;
      const openDifference = openTarget - current.opening;
      current.opening = reduced || Math.abs(openDifference) < 0.001 ? openTarget : current.opening + openDifference * (1 - Math.exp(-dt / (openTarget ? 190 : 95)));
      if (current.opening === 0 && !current.openWanted) current.selected = null;
      const next = Math.round(current.position);
      if (previousCenter !== next) { previousCenter = next; setCenter(next); }
      paint();
      if (current.position !== current.target || current.opening !== openTarget || current.pending !== null) frame = requestAnimationFrame(tick);
      else { frame = 0; lastTime = 0; }
    };
    wake.current = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
      else wake.current();
    };
    measure.current();
    const observer = new ResizeObserver(() => measure.current());
    observer.observe(root.current!);
    const resize = () => measure.current();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', visibility);
    wake.current();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility); };
  }, [reduced]);

  useLayoutEffect(() => { measure.current(); }, [center]);

  useEffect(() => {
    const scroll = new FolderScroll();
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    const close = () => {
      state.current.openWanted = false;
      state.current.pending = null;
      setSelected(null);
      setHovered(null);
      setEntering(false);
    };
    const snap = () => {
      state.current.target = scroll.snap(state.current.target);
      scroll.reset();
      wake.current();
    };
    const input = (pixels: number, time: number) => {
      close();
      state.current.target = scroll.push(pixels, time, state.current.target, Math.max(360, innerHeight * 0.55));
      clearTimeout(snapTimer);
      snapTimer = setTimeout(snap, 140);
      wake.current();
    };
    choose.current = (index) => {
      if (state.current.selected === index && state.current.openWanted) return;
      clearTimeout(snapTimer);
      scroll.reset();
      setEntering(false);
      // Clicking a second file closes the previous selection while centering
      // the new one. Opening starts only once the requested file is centered.
      state.current.target = index;
      state.current.openWanted = false;
      state.current.pending = index;
      setSelected(null);
      setHovered(index);
      wake.current();
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || (event.target as Element).closest('[data-lenis-prevent]')) return;
      event.preventDefault();
      input(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1), event.timeStamp);
    };
    const key = (event: KeyboardEvent) => {
      if ((event.target as Element).closest('input,textarea,select,[contenteditable="true"],[data-lenis-prevent]') || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape') { close(); wake.current(); return; }
      if (event.key === ' ' && (event.target as Element).closest('a,button')) return;
      const down = ['ArrowDown','ArrowRight','PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey);
      const up = ['ArrowUp','ArrowLeft','PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey);
      if (!down && !up && event.key !== 'Home') return;
      event.preventDefault();
      clearTimeout(snapTimer); scroll.reset(); close();
      state.current.target = event.key === 'Home' ? 0 : Math.round(state.current.target) + (down ? 1 : -1);
      wake.current();
    };
    let touchY = 0;
    const start = (event: TouchEvent) => { scroll.reset(); touchY = event.touches[0].clientY; };
    const touch = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      event.preventDefault();
      const y = event.touches[0].clientY;
      input((touchY - y) * 2, event.timeStamp);
      touchY = y;
    };
    const element = root.current!;
    window.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', key);
    element.addEventListener('touchstart', start, { passive: true });
    element.addEventListener('touchmove', touch, { passive: false });
    return () => {
      clearTimeout(snapTimer);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', key);
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchmove', touch);
    };
  }, []);

  const hover = (index: number) => {
    const current = state.current;
    // Moving planes passing beneath a stationary pointer are not a new hover.
    if (current.pending !== null || Math.abs(current.position - current.target) > 0.02 || (current.opening > 0.001 && current.opening < 0.999)) return;
    setHovered(index);
  };
  const labelIndex = hovered ?? selected;
  const label = labelIndex === null ? null : PRODUCTION_PROJECTS[wrapProject(labelIndex, PRODUCTION_PROJECTS.length)];
  return <main ref={root} className={styles.reel} aria-label="Production Folder" data-reel-position={center} data-folder-selection={selected ?? ''}>
    <div ref={stage} className={`${styles.reelStage} ${styles.folderStage}`}>
      {slots.map((index, slot) => {
        const project = PRODUCTION_PROJECTS[wrapProject(index, PRODUCTION_PROJECTS.length)];
        return <div key={index} data-reel-card={index} ref={(element) => { if (element) planes.current.set(index, element); else planes.current.delete(index); }} className={styles.folderPlane}>
          <ProjectEntrance index={slot} enabled={entering}>
            <button type="button" className={styles.folderCard} aria-label={`Preview ${project.name}`} aria-expanded={selected === index}
              onPointerEnter={() => hover(index)} onPointerMove={() => hover(index)} onPointerLeave={() => setHovered(current => current === index ? null : current)}
              onFocus={() => setHovered(index)} onBlur={() => setHovered(current => current === index ? null : current)} onClick={() => choose.current(index)}>
              <div className={styles.folderMediaClip}>
                <div className={styles.folderMediaContent}><GridTile project={project} reserveSpace className="w-full" /></div>
              </div>
            </button>
          </ProjectEntrance>
        </div>;
      })}
    </div>
    <div className={styles.folderLabel} aria-live="polite">{label && <span key={label.id}>{label.name}</span>}</div>
    <div className={styles.folderCount}>{PRODUCTION_PROJECTS.length} projects</div>
  </main>;
}
