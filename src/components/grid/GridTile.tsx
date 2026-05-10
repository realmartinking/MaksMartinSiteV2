'use client';

import { useEffect, useRef } from 'react';
import type { Project } from '@/lib/projects';

interface GridTileProps {
  project: Project;
  /** 'fill' — fill container (gallery), 'natural' — natural video height (grid). Default: 'natural' */
  sizing?: 'fill' | 'natural';
  className?: string;
}

/**
 * Видео-тайл для grid и gallery.
 * - Lazy play через IntersectionObserver
 * - Для grid: w-full h-auto (native aspect ratio, masonry feel)
 * - Для gallery: w-full h-full object-contain (uniform cells)
 */
export function GridTile({ project, sizing = 'natural', className = '' }: GridTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!video) return;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.05, rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const mediaClass =
    sizing === 'fill'
      ? 'w-full h-full object-contain'
      : 'w-full h-auto';

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`} style={{ borderRadius: 'var(--tile-radius)' }}>
      {project.imageSrc ? (
        <img
          src={project.imageSrc}
          alt={project.name}
          className={mediaClass}
        />
      ) : (
        <video
          ref={videoRef}
          src={project.videoSrc}
          muted
          loop
          playsInline
          preload="metadata"
          className={mediaClass}
        />
      )}
    </div>
  );
}
