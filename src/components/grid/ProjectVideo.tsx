'use client';

import { useEffect, useRef, useState } from 'react';
import { MOBILE_PREVIEW_MEDIA, type Project } from '@/lib/projects';
import { observeVideoPlayback, requestProjectPlayback } from '@/lib/videoPlayback';
import { observeVideoFrame } from '@/lib/videoFrame';
import styles from './ProjectVideo.module.css';
import { ProjectImage } from './ProjectImage';

export function ProjectVideo({ project, fill = false, active, priority = false, eagerPoster = false }: {
  project: Project;
  fill?: boolean;
  /** Undefined follows the viewport; List and Production select their own preview. */
  active?: boolean;
  priority?: boolean;
  eagerPoster?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [control, setControl] = useState<'none' | 'button' | 'indicator' | 'poster'>('none');
  const [width, height] = project.mediaSize ?? [16, 9];
  useEffect(() => observeVideoFrame(video.current!, value => {
    root.current?.setAttribute('data-frame-ready', String(value));
  }, project.posterUntil), [project.videoSrc, project.posterUntil]);
  useEffect(() => {
    if (!project.videoSrc) return;
    const element = root.current!;
    const interactiveParent = element.closest('button, a');
    // Folder previews already live inside a button: the same gesture retries playback.
    const retry = () => requestProjectPlayback(element);
    interactiveParent?.addEventListener('click', retry);
    const fullVideo = project.videoSrc;
    const mobile = project.mobilePreviewBase ? window.matchMedia(MOBILE_PREVIEW_MEDIA) : undefined;
    let stop: (() => void) | undefined;
    const attach = () => {
      stop?.();
      const small = mobile?.matches ? project.mobilePreviewBase : undefined;
      stop = observeVideoPlayback(element, video.current!, small ? `${small}.mp4` : fullVideo, active,
        (show, deferred) => {
          if (!show) setControl('none');
          else if (deferred) setControl(interactiveParent ? 'none' : 'poster');
          else setControl(interactiveParent ? 'indicator' : 'button');
        },
        small ? `${small}.webp` : project.posterSrc);
    };
    attach();
    mobile?.addEventListener('change', attach);
    return () => {
      mobile?.removeEventListener('change', attach);
      interactiveParent?.removeEventListener('click', retry);
      stop?.();
    };
  }, [project.videoSrc, project.mobilePreviewBase, project.posterSrc, active]);
  const playIcon = <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="M4 2 14 8 4 14Z" fill="currentColor" /></svg>;
  return <div ref={root} className={styles.media} data-frame-ready="false"
    style={fill ? { width: '100%', height: '100%' } : { aspectRatio: `${width} / ${height}` }}>
    <video ref={video} width={width} height={height}
      muted loop playsInline preload="none" className={styles.video} aria-label={project.name} />
    {project.posterSrc && <ProjectImage src={project.posterSrc} width={width} height={height}
      mobileSrc={project.mobilePreviewBase ? `${project.mobilePreviewBase}.webp` : undefined}
      alt="" priority={priority || active === true} eager={eagerPoster}
      pictureClassName={styles.poster} className={styles.poster} />}

    {control === 'indicator' && <span className={styles.play} aria-hidden="true">{playIcon}</span>}
    {(control === 'button' || control === 'poster') && <button type="button"
      className={control === 'poster' ? styles.posterAction : styles.play} aria-label={`Play ${project.name}`}
      onClick={() => requestProjectPlayback(root.current!)}>
      {control === 'button' && playIcon}
    </button>}
  </div>;
}
