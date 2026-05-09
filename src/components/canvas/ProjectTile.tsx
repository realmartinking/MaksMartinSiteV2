'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Project } from '@/lib/projects';

interface ProjectTileProps {
  project: Project;
  className?: string;
}

/**
 * Плитка проекта.
 * - Aspect ratio из data: wide (16:9), vertical (9:16), square (1:1)
 * - Видео autoplay muted loop, играет только при попадании в viewport (IntersectionObserver)
 * - Сам фрейм НЕ вращается (отличие от старой версии — там был spin)
 * - Hover: subtle scale + проявляется имя проекта
 *
 * NOTE: PerspectiveCard wrapper (родитель) применяет 3D-наклон. Тайл сам по себе плоский.
 */
export function ProjectTile({ project, className = '' }: ProjectTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Lazy play: видео играет только когда в viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || project.imageSrc) return;

    if (isInView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isInView, project.imageSrc]);

  // Aspect ratio через CSS
  const aspectClass = {
    wide: 'aspect-video', // 16:9
    vertical: 'aspect-[9/16]', // 9:16
    square: 'aspect-square', // 1:1
  }[project.aspect];

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg bg-[var(--tile-bg)] ${aspectClass} ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {project.imageSrc ? (
        <img
          src={project.imageSrc}
          alt={project.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={project.videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Overlay с именем при hover */}
      <motion.div
        className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-white">
          <div className="text-sm font-medium">{project.name}</div>
          {project.year && <div className="text-xs opacity-70 mt-0.5">{project.year}</div>}
        </div>
      </motion.div>
    </motion.div>
  );
}
