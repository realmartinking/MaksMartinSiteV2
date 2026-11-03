'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ProjectVideo.module.css';
import { MOBILE_PREVIEW_MEDIA } from '@/lib/projects';

const pending = new Map<HTMLImageElement, () => void>();
let observer: IntersectionObserver | undefined;

interface ProjectImageProps {
  src: string;
  srcSet?: string;
  mobileSrc?: string;
  sizes?: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  eager?: boolean;
  className: string;
  pictureClassName?: string;
}

/** The initial server grid can have more columns than the hydrated phone layout.
 * Wait for the real layout before requesting distant posters or artwork. */
export function ProjectImage({ src, srcSet, mobileSrc, sizes, alt, width, height, priority = false, eager = false,
  className, pictureClassName }: ProjectImageProps) {
  const image = useRef<HTMLImageElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (priority || eager || near) return;
    const element = image.current!;
    observer ??= new IntersectionObserver(changes => {
      for (const change of changes) {
        if (change.isIntersecting) pending.get(change.target as HTMLImageElement)?.();
      }
    }, { rootMargin: '300px 0px' });
    pending.set(element, () => setNear(true));
    observer.observe(element);
    return () => {
      pending.delete(element);
      observer?.unobserve(element);
      if (!pending.size) { observer?.disconnect(); observer = undefined; }
    };
  }, [priority, eager, near]);

  function render(load: boolean, track: boolean) {
    const img = <img ref={track ? image : undefined} src={load ? src : undefined} alt={alt}
      width={width} height={height} loading={priority || eager ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : eager ? 'low' : undefined} decoding="async" className={load ? className : `${className} ${styles.pendingImage}`} />;
    return srcSet || mobileSrc ? <picture className={pictureClassName}>
      {mobileSrc && <source type="image/webp" media={MOBILE_PREVIEW_MEDIA} srcSet={load ? mobileSrc : undefined} />}
      {srcSet && <source type="image/webp" srcSet={load ? srcSet : undefined} sizes={sizes} />}{img}
    </picture> : img;
  }
  return <>{render(priority || eager || near, true)}{!priority && !eager && <noscript>{render(true, false)}</noscript>}</>;
}
