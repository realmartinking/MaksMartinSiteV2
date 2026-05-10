'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface EmblemProps {
  /** Высота эмблемы в px (ширина = height * 0.8) */
  height?: number;
  /** Если true, эмблема растягивается на 100% контейнера */
  fill?: boolean;
  className?: string;
}

/**
 * Cross-browser эмблема через canvas.
 *
 * Фикс прозрачности: вместо SVG фильтра (не работает в Safari на canvas)
 * используем pixel-level alpha manipulation прямо в canvas getImageData/putImageData.
 *
 * Light video (MaksMartinLogo.mp4) — тёмная эмблема на белом фоне:
 *   alpha = 255 - luminance (тёмные пиксели непрозрачны, белые прозрачны)
 *
 * Dark video (MaksMartinLogoBlack.mp4) — светлая эмблема на чёрном фоне:
 *   alpha = luminance (светлые пиксели непрозрачны, чёрные прозрачны)
 */
function drawWithTransparency(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  isDarkVersion: boolean
) {
  ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);

  try {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;

    if (isDarkVersion) {
      // Эмблема светлая на тёмном фоне: оставляем светлые пиксели
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i + 3] = Math.min(255, luminance * 1.2);
      }
    } else {
      // Эмблема тёмная на светлом фоне: оставляем тёмные пиксели
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const alpha = 255 - luminance;
        data[i + 3] = Math.min(255, alpha * 1.2);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  } catch (e) {
    // putImageData может упасть если видео cross-origin.
    // Для same-origin /MaksMartinLogo.mp4 не должно происходить.
    console.warn('[emblem] putImageData failed, using raw frame:', e);
  }
}

export function Emblem({ height = 200, fill = false, className = '' }: EmblemProps) {
  const lightVideoRef = useRef<HTMLVideoElement | null>(null);
  const darkVideoRef = useRef<HTMLVideoElement | null>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const darkCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // RAF loop: копируем кадры из видео в canvas с pixel-level alpha
  useEffect(() => {
    let rafId: number;
    let crossfadeEndTime = 0;

    const tick = () => {
      const now = performance.now();
      const isCrossfading = now < crossfadeEndTime;

      const pairs = [
        { video: lightVideoRef.current, canvas: lightCanvasRef.current, isThisDark: false },
        { video: darkVideoRef.current,  canvas: darkCanvasRef.current,  isThisDark: true },
      ];

      for (const { video, canvas, isThisDark } of pairs) {
        if (!video || !canvas) continue;

        const isVisible = isThisDark === isDark;
        if (!isVisible && !isCrossfading) continue;

        if (video.readyState < 2 || !video.videoWidth) continue;

        // Установить canvas internal size = native video size
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        drawWithTransparency(ctx, video, isThisDark);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const onThemeChange = () => {
      crossfadeEndTime = performance.now() + 500;
    };

    window.addEventListener('emblem-theme-change', onThemeChange);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('emblem-theme-change', onThemeChange);
    };
  }, [isDark]);

  // При смене темы сигналим о crossfade
  useEffect(() => {
    window.dispatchEvent(new Event('emblem-theme-change'));
  }, [isDark]);

  // Принудительно запускаем play() для autoplay videos
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

  const containerStyle = fill
    ? { width: '100%', height: '100%' }
    : { height, aspectRatio: '4 / 5' };

  return (
    <div
      className={`relative inline-block ${className}`}
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

      {/* Canvas — рендерят кадры с прозрачным фоном (без SVG-фильтра) */}
      <canvas
        ref={lightCanvasRef}
        className="emblem-canvas absolute inset-0"
        style={{
          opacity: isDark ? 0 : 1,
          transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
      <canvas
        ref={darkCanvasRef}
        className="emblem-canvas absolute inset-0"
        style={{
          opacity: isDark ? 1 : 0,
          transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  );
}
