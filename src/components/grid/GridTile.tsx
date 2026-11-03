'use client';

import type { Project } from '@/lib/projects';
import { ProjectVideo } from './ProjectVideo';
import { ProjectImage } from './ProjectImage';

interface GridTileProps {
  project: Project;
  /** 'fill' — fill container (gallery), 'natural' — natural video height (grid). Default: 'natural' */
  sizing?: 'fill' | 'natural';
  className?: string;
  active?: boolean;
  priority?: boolean;
}

/**
 * Видео-тайл для grid и gallery.
 * - Lazy play через IntersectionObserver
 * - Для grid: w-full h-auto (native aspect ratio, masonry feel)
 * - Для gallery: w-full h-full object-contain (uniform cells)
 */
export function GridTile({ project, sizing = 'natural', className = '', active, priority = false }: GridTileProps) {
  const mediaClass =
    sizing === 'fill'
      ? 'w-full h-full object-contain'
      : 'w-full h-auto';

  const sizes = sizing === 'fill'
    ? '(min-width: 1536px) 14vw, (min-width: 1280px) 17vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, 33vw'
    : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, calc(100vw - 24px)';

  return (
    <div className={`overflow-hidden ${className}`} style={{ borderRadius: 'var(--tile-radius)' }}>
      {project.imageSrc ? (
        <ProjectImage src={project.imageSrc} srcSet={project.imagePreviewSrcSet ?? project.imageWebpSrc}
          sizes={sizes} alt={project.name} width={project.mediaSize?.[0]} height={project.mediaSize?.[1]}
          priority={priority} pictureClassName={sizing === 'fill' ? 'block w-full h-full' : 'block'}
          className={mediaClass} />
      ) : (
        <ProjectVideo project={project} active={active} priority={priority} fill={sizing === 'fill'} />
      )}
    </div>
  );
}
