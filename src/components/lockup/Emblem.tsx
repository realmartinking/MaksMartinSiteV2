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
 * WebKit известный баг (2018+): SVG feColorMatrix filter не применяется 
 * к воспроизводимому video. Решение — копировать кадры video в canvas 
 * через requestAnimationFrame, а filter применять к canvas.
 * 
 * https://bugs.webkit.org/show_bug.cgi?id=184601
 */
export function Emblem({ height = 200, fill = false, className = '' }: EmblemProps) {
  const lightVideoRef = useRef<HTMLVideoElement | null>(null);
  const darkVideoRef = useRef<HTMLVideoElement | null>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const darkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  // RAF loop: копируем кадры из видео в canvas
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
        
        // Установить canvas internal size = native video size (preserves aspect)
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      
      rafId = requestAnimationFrame(tick);
    };
    
    rafId = requestAnimationFrame(tick);
    
    // Сигнал о crossfade при смене темы
    const onThemeChange = () => {
      crossfadeEndTime = performance.now() + 500;
    };
    
    window.addEventListener('emblem-theme-change', onThemeChange);
    
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('emblem-theme-change', onThemeChange);
    };
  }, [isDark]);
  
  // При смене темы сигналим что нужно crossfade
  useEffect(() => {
    window.dispatchEvent(new Event('emblem-theme-change'));
  }, [isDark]);
  
  // Принудительно запускаем play() для autoplay videos (Safari иногда требует)
  useEffect(() => {
    const tryPlay = (v: HTMLVideoElement | null) => {
      if (!v) return;
      v.play().catch(() => {
        // Fallback: пробуем ещё раз через 500ms
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
      {/* Скрытые источники видео (offscreen, не display:none — иначе autoplay ломается в Safari) */}
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
      
      {/* Видимые canvas — рендерят кадры с применённым SVG-фильтром */}
      <canvas
        ref={lightCanvasRef}
        className="emblem-canvas emblem-light absolute inset-0"
        style={{
          opacity: isDark ? 0 : 1,
          transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
      <canvas
        ref={darkCanvasRef}
        className="emblem-canvas emblem-dark absolute inset-0"
        style={{
          opacity: isDark ? 1 : 0,
          transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  );
}
