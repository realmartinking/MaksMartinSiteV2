'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface EmblemProps {
  height?: number;
  fill?: boolean;
  className?: string;
}

/**
 * Эмблема через canvas pixel manipulation.
 *
 * В отличие от mix-blend-mode (который не работает поверх произвольного контента),
 * этот подход физически вычисляет alpha-канал из luminance каждого пикселя.
 *
 * Light theme: белый фон видео → прозрачный, тёмная эмблема остаётся
 * Dark theme: чёрный фон видео → прозрачный, светлая эмблема остаётся
 *
 * Работает поверх любого фона (плитки, картинки, цветные блоки).
 */
export function Emblem({ height = 200, fill = false, className = '' }: EmblemProps) {
  const lightVideoRef = useRef<HTMLVideoElement | null>(null);
  const darkVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Запуск видео (Safari требует явный play)
  useEffect(() => {
    const tryPlay = (v: HTMLVideoElement | null) => {
      if (!v) return;
      v.play().catch(() => setTimeout(() => v.play().catch(() => {}), 500));
    };
    tryPlay(lightVideoRef.current);
    tryPlay(darkVideoRef.current);
  }, []);

  // RAF loop: рисуем кадры на canvas с применением альфа-маски по luminance
  useEffect(() => {
    let rafId: number;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const tick = () => {
      const dark = document.documentElement.classList.contains('dark');
      const v = dark ? darkVideoRef.current : lightVideoRef.current;

      if (v && v.readyState >= 2 && v.videoWidth > 0 && canvas.width > 0) {
        updateSize();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          if (dark) {
            // Чёрный → прозрачный (luminance низкий → alpha низкий)
            for (let i = 0; i < data.length; i += 4) {
              const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i + 3] = Math.min(255, lum * 1.5);
            }
          } else {
            // Белый → прозрачный (luminance высокий → alpha низкий)
            for (let i = 0; i < data.length; i += 4) {
              const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i + 3] = Math.max(0, 255 - lum * 1.2);
            }
          }

          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.warn('[emblem] putImageData failed:', e);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const containerStyle: React.CSSProperties = fill
    ? { width: '100%', height: '100%' }
    : { height, aspectRatio: '4 / 5' };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={containerStyle}
      aria-hidden="true"
    >
      {/* Скрытые источники видео */}
      <video
        ref={lightVideoRef}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          left: '-99999px',
          top: '-99999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
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
        style={{
          position: 'absolute',
          left: '-99999px',
          top: '-99999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <source src="/MaksMartinLogoBlack.mp4" type="video/mp4" />
      </video>

      {/* Видимый canvas с прозрачным фоном */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}
