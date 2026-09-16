'use client';

import { useEffect, useRef } from 'react';
import type { Project } from '@/lib/projects';
import { observeVideoPlayback } from '@/lib/videoPlayback';
import { observeVideoFrame } from '@/lib/videoFrame';
import styles from './ProjectVideo.module.css';

export function ProjectVideo({ project, fill = false, active }: {
  project: Project;
  fill?: boolean;
  /** Undefined follows the viewport; List explicitly controls its preview. */
  active?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [width, height] = project.mediaSize ?? [16, 9];
  useEffect(() => observeVideoFrame(video.current!, value => {
    root.current?.setAttribute('data-frame-ready', String(value));
  }), [project.videoSrc]);
  useEffect(() => observeVideoPlayback(root.current!, video.current!, active), [project.videoSrc, active]);
  return <div ref={root} className={styles.media} data-frame-ready="false"
    style={fill ? { width: '100%', height: '100%' } : { aspectRatio: `${width} / ${height}` }}>
    <video ref={video} src={project.videoSrc} poster={project.posterSrc} width={width} height={height}
      muted loop playsInline preload="none" className={styles.video} aria-label={project.name} />
    <img src={project.posterSrc} width={width} height={height} alt="" aria-hidden="true"
      decoding="async" className={styles.poster} />
  </div>;
}
