'use client';

import type { Project } from '@/lib/projects';
import { ProjectVideo } from './ProjectVideo';

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
  const mediaClass =
    sizing === 'fill'
      ? 'w-full h-full object-contain'
      : 'w-full h-auto';

  return (
    <div className={`overflow-hidden ${className}`} style={{ borderRadius: 'var(--tile-radius)' }}>
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
        <ProjectVideo project={project} fill={sizing === 'fill'} />
      )}
    </div>
  );
}
