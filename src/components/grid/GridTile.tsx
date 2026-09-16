'use client';

import { useEffect, useRef } from 'react';
import type { Project } from '@/lib/projects';
import { observeVideoPlayback } from '@/lib/videoPlayback';

interface GridTileProps {
  project: Project;
  /** 'fill' — fill container (gallery), 'natural' — natural video height (grid). Default: 'natural' */
  sizing?: 'fill' | 'natural';
  className?: string;
  reserveSpace?: boolean;
}

/**
 * Видео-тайл для grid и gallery.
 * - Lazy play через IntersectionObserver
 * - Для grid: w-full h-auto (native aspect ratio, masonry feel)
 * - Для gallery: w-full h-full object-contain (uniform cells)
 */
export function GridTile({ project, sizing = 'natural', className = '', reserveSpace = false }: GridTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;
    return observeVideoPlayback(el, video);
  }, []);

  const mediaClass =
    sizing === 'fill'
      ? 'w-full h-full object-contain'
      : 'w-full h-auto';

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`} style={{ borderRadius: 'var(--tile-radius)' }}>
      {project.imageSrc ? (
        <picture className={sizing === 'fill' ? 'block w-full h-full' : 'block'}>
          {project.imageWebpSrc && <source srcSet={project.imageWebpSrc} type="image/webp" />}
          <img
            src={project.imageSrc}
            alt={project.name}
            width={reserveSpace ? project.mediaSize?.[0] : undefined}
            height={reserveSpace ? project.mediaSize?.[1] : undefined}
            decoding="async"
            className={mediaClass}
          />
        </picture>
      ) : (
        <video
          ref={videoRef}
          src={project.videoSrc}
          width={reserveSpace ? project.mediaSize?.[0] : undefined}
          height={reserveSpace ? project.mediaSize?.[1] : undefined}
          muted
          loop
          playsInline
          preload="none"
          className={mediaClass}
        />
      )}
    </div>
  );
}
