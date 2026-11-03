'use client';

import { useEffect, useRef, useState } from 'react';
import type { Project } from '@/lib/projects';
import { observeVideoPlayback, requestProjectPlayback } from '@/lib/videoPlayback';
import { observeVideoFrame } from '@/lib/videoFrame';
import styles from './ProjectVideo.module.css';
import { ProjectImage } from './ProjectImage';

export function ProjectVideo({ project, fill = false, active, priority = false }: {
  project: Project;
  fill?: boolean;
  /** Undefined follows the viewport; List and Production select their own preview. */
  active?: boolean;
  priority?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [control, setControl] = useState<'none' | 'button' | 'indicator'>('none');
  const [width, height] = project.mediaSize ?? [16, 9];
  useEffect(() => observeVideoFrame(video.current!, value => {
    root.current?.setAttribute('data-frame-ready', String(value));
  }), [project.videoSrc]);
  useEffect(() => {
    if (!project.videoSrc) return;
    const element = root.current!;
    const interactiveParent = element.closest('button, a');
    // Folder previews already live inside a button: the same gesture retries playback.
    const retry = () => requestProjectPlayback(element);
    interactiveParent?.addEventListener('click', retry);
    const stop = observeVideoPlayback(element, video.current!, project.videoSrc, active,
      show => setControl(show ? (interactiveParent ? 'indicator' : 'button') : 'none'));
    return () => { interactiveParent?.removeEventListener('click', retry); stop(); };
  }, [project.videoSrc, active]);
  const playIcon = <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="M4 2 14 8 4 14Z" fill="currentColor" /></svg>;
  return <div ref={root} className={styles.media} data-frame-ready="false"
    style={fill ? { width: '100%', height: '100%' } : { aspectRatio: `${width} / ${height}` }}>
    <video ref={video} width={width} height={height}
      muted loop playsInline preload="none" className={styles.video} aria-label={project.name} />
    {project.posterSrc && <ProjectImage src={project.posterSrc} width={width} height={height}
      alt="" priority={priority} className={styles.poster} />}
    {control === 'indicator' && <span className={styles.play} aria-hidden="true">{playIcon}</span>}
    {control === 'button' && <button type="button" className={styles.play} aria-label={`Play ${project.name}`}
      onClick={() => requestProjectPlayback(root.current!)}>
      {playIcon}
    </button>}
  </div>;
}
