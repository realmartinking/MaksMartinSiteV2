'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

// Uint8ClampedArray preserves the original alpha rounding for every RGB sum.
const DARK_ALPHA = Uint8ClampedArray.from({ length: 766 }, (_, sum) => Math.min(255, (sum / 3) * 1.5));
const LIGHT_ALPHA = Uint8ClampedArray.from({ length: 766 }, (_, sum) => Math.max(0, 255 - (sum / 3) * 1.2));
// Both original emblem sources are 145 frames at 24 fps. Cache the exact pixels
// after alpha conversion to avoid a GPU-to-CPU readback on every repeated loop.
const SOURCE_FPS = 24;
const FRAME_CACHE_BYTES = 64 * 1024 * 1024;

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
  const positionRef = useRef(0);

  const { resolvedTheme } = useTheme();

  // Process a source frame once, retaining the exact canvas resolution and alpha.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const dark = resolvedTheme === undefined
      ? document.documentElement.classList.contains('dark') : resolvedTheme === 'dark';
    const video = dark ? darkVideoRef.current : lightVideoRef.current;
    const inactive = dark ? lightVideoRef.current : darkVideoRef.current;
    if (!canvas || !container || !video) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    inactive?.pause();
    const alpha = dark ? DARK_ALPHA : LIGHT_ALPHA;
    const videoFrames = typeof video.requestVideoFrameCallback === 'function';
    let stopped = false;
    let videoFrame: number | null = null;
    let animationFrame: number | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let lastFrame = -1;
    let pendingPosition: number | null = positionRef.current;
    const frames = new Map<number, ImageData>();

    const draw = (force = false, frameTime = video.currentTime, sourceFrame?: number) => {
      if (stopped || document.hidden || video.readyState < 2 || video.seeking || !video.videoWidth || !canvas.width || !canvas.height) return;
      if (!force && frameTime === lastFrame) return;
      lastFrame = frameTime;
      const cached = sourceFrame === undefined ? undefined : frames.get(sourceFrame);
      if (cached) {
        ctx.putImageData(cached, 0, 0);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = pixels.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i + 3] = alpha[data[i] + data[i + 1] + data[i + 2]];
        }
        ctx.putImageData(pixels, 0, 0);
        // Keep the entire loop or none of it: partial LRU caching would thrash.
        const loopBytes = Math.ceil(video.duration * SOURCE_FPS) * pixels.data.byteLength;
        if (sourceFrame !== undefined && loopBytes <= FRAME_CACHE_BYTES) frames.set(sourceFrame, pixels);
      } catch (error) {
        console.warn('[emblem] putImageData failed:', error);
      }
    };

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        frames.clear();
        canvas.width = width;
        canvas.height = height;
        draw(true);
      }
    };
    const syncPosition = () => {
      if (pendingPosition === null || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const time = pendingPosition % video.duration;
      pendingPosition = null;
      if (Math.abs(video.currentTime - time) > 1 / 48) video.currentTime = time;
    };
    const queueFrame = () => {
      if (stopped || document.hidden || videoFrame !== null || animationFrame !== null) return;
      if (videoFrames) {
        videoFrame = video.requestVideoFrameCallback((_now, metadata) => {
          videoFrame = null;
          draw(false, metadata.mediaTime, Math.round(metadata.mediaTime * SOURCE_FPS));
          queueFrame();
        });
      } else {
        animationFrame = requestAnimationFrame(() => {
          animationFrame = null;
          const frames = typeof video.getVideoPlaybackQuality === 'function'
            ? video.getVideoPlaybackQuality().totalVideoFrames : 0;
          draw(false, frames > 0 ? frames : video.currentTime);
          queueFrame();
        });
      }
    };
    const pause = () => {
      if (videoFrame !== null) video.cancelVideoFrameCallback(videoFrame);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      videoFrame = null;
      animationFrame = null;
      clearTimeout(retry);
      video.pause();
    };
    const play = () => {
      if (stopped || document.hidden) return;
      syncPosition();
      video.play().catch(() => {
        if (stopped || document.hidden) return;
        clearTimeout(retry);
        retry = setTimeout(() => {
          if (!stopped && !document.hidden) video.play().catch(() => {});
        }, 500);
      });
      queueFrame();
    };
    const onReady = () => { syncPosition(); draw(true); };
    const onVisibility = () => {
      if (document.hidden) pause();
      else { updateSize(); play(); }
    };

    updateSize();
    draw(true);
    play();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    window.addEventListener('resize', updateSize);
    document.addEventListener('visibilitychange', onVisibility);
    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('seeked', onReady);
    return () => {
      stopped = true;
      positionRef.current = video.currentTime;
      pause();
      frames.clear();
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
      document.removeEventListener('visibilitychange', onVisibility);
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('seeked', onReady);
    };
  }, [resolvedTheme]);

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
