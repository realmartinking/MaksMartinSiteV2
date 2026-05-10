'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface EmblemProps {
  height?: number;
  fill?: boolean;
  className?: string;
}

/**
 * Cross-browser эмблема через mix-blend-mode.
 *
 * - Light: MaksMartinLogo.mp4 (белый фон, тёмная эмблема) + multiply → белый прозрачен
 * - Dark: MaksMartinLogoBlack.mp4 (чёрный фон, светлая эмблема) + screen → чёрный прозрачен
 */
export function Emblem({ height = 200, fill = false, className = '' }: EmblemProps) {
  const lightVideoRef = useRef<HTMLVideoElement | null>(null);
  const darkVideoRef = useRef<HTMLVideoElement | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const tryPlay = (v: HTMLVideoElement | null) => {
      if (!v) return;
      v.play().catch(() => {
        setTimeout(() => v.play().catch(() => {}), 500);
      });
    };
    tryPlay(lightVideoRef.current);
    tryPlay(darkVideoRef.current);
  }, []);

  const containerStyle: React.CSSProperties = fill
    ? { width: '100%', height: '100%' }
    : { height, aspectRatio: '4 / 5' };

  return (
    <div
      className={`relative ${className}`}
      style={{
        ...containerStyle,
        isolation: 'isolate',
        background: 'var(--background)',
      }}
      aria-hidden="true"
    >
      <video
        ref={lightVideoRef}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-contain"
        style={{
          mixBlendMode: 'multiply',
          opacity: isDark ? 0 : 1,
          transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <source src="/MaksMartinLogo.mp4" type="video/mp4" />
      </video>

      <video
        ref={darkVideoRef}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-contain"
        style={{
          mixBlendMode: 'screen',
          opacity: isDark ? 1 : 0,
          transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <source src="/MaksMartinLogoBlack.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
