'use client';

import { useEffect, useState } from 'react';

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;

    const tick = () => {
      if (!mounted) return;
      const videos = document.querySelectorAll<HTMLVideoElement>('video');
      const ready = [...videos].filter((v) => v.readyState >= 2).length;
      const total = Math.max(videos.length, 1);
      const docReady = document.readyState === 'complete' ? 1 : 0.6;
      const ratio = (ready / total) * 0.7 + docReady * 0.3;
      setProgress((prev) => Math.max(prev, Math.min(1, ratio)));
    };

    const interval = setInterval(tick, 80);

    window.addEventListener(
      'load',
      () => {
        setProgress(1);
        setTimeout(() => mounted && setDone(true), 600);
        clearInterval(interval);
      },
      { once: true }
    );

    // Safety fallback — never block more than 8s
    const safety = setTimeout(() => {
      if (!mounted) return;
      setProgress(1);
      setTimeout(() => mounted && setDone(true), 600);
    }, 8000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(safety);
    };
  }, []);

  if (done) return null;

  const pct = Math.round(progress * 100);

  return (
    <div
      className={[
        'fixed inset-0 z-50',
        'bg-background',
        'flex items-center justify-center gap-8',
        'transition-opacity duration-500',
        progress >= 1 ? 'opacity-0 pointer-events-none' : 'opacity-100',
      ].join(' ')}
      aria-hidden={progress >= 1}
      role="status"
    >
      {/* Bull-mermaid emblem */}
      <video
        src="/MaksMartinLogo.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="h-[180px] w-auto"
      />

      {/* Percentage counter */}
      <span className="font-bold text-[80px] leading-none tabular-nums select-none">
        {pct}%
      </span>
    </div>
  );
}
