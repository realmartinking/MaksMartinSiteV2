'use client';

import { ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface ScrollTiltedGridProps {
  children: ReactNode;
  className?: string;
  /** Сила наклона в градусах (по X), default 25 */
  tiltStrength?: number;
}

/**
 * Перспективный наклон сетки при скролле.
 * Воссоздание эффекта 21st.dev/community/components/ruixenui/scroll-tilted-grid
 * 
 * Принцип: используем useScroll → useTransform → rotateX
 * При скролле вниз — сетка наклоняется к зрителю (rotateX от 25° → 0°)
 * Это создаёт эффект "пробуждения" контента из плоскости
 */
export function ScrollTiltedGrid({
  children,
  className = '',
  tiltStrength = 25,
}: ScrollTiltedGridProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  
  // Сглаживаем scroll прогресс для плавности
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  
  // На входе в viewport: наклон 25° → 0° (выпрямляется)
  // В середине: 0° (плоский)
  // На выходе: 0° → -10° (немного отклоняется обратно)
  const rotateX = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [tiltStrength, 0, 0, -tiltStrength * 0.4]);
  
  // Z-translate для эффекта приближения
  const translateZ = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [-100, 0, 0, -50]);
  
  // Opacity — слегка приглушаем на краях
  const opacity = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.6]);
  
  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{ perspective: '1200px' }}
    >
      <motion.div
        style={{
          rotateX,
          translateZ,
          opacity,
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
        }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}
