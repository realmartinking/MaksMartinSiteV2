'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ProjectVideo.module.css';

const pending = new Map<HTMLImageElement, () => void>();
let observer: IntersectionObserver | undefined;

interface ProjectImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className: string;
  pictureClassName?: string;
}

/** The initial server grid can have more columns than the hydrated phone layout.
 * Wait for the real layout before requesting distant posters or artwork. */
export function ProjectImage({ src, srcSet, sizes, alt, width, height, priority = false,
  className, pictureClassName }: ProjectImageProps) {
  const image = useRef<HTMLImageElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (priority || near) return;
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
  }, [priority, near]);

  function render(load: boolean, track: boolean) {
    const img = <img ref={track ? image : undefined} src={load ? src : undefined} alt={alt}
      width={width} height={height} loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined} decoding="async" className={load ? className : `${className} ${styles.pendingImage}`} />;
    return srcSet ? <picture className={pictureClassName}>
      <source type="image/webp" srcSet={load ? srcSet : undefined} sizes={sizes} />{img}
    </picture> : img;
  }
  return <>{render(priority || near, true)}{!priority && <noscript>{render(true, false)}</noscript>}</>;
}
