'use client';

import { useEffect, useRef, useState } from 'react';
import { Emblem } from '@/components/lockup/Emblem';

/**
 * Прелоадер: эмблема + счётчик процентов на белом/чёрном фоне.
 *
 * Тайминг (td=600ms):
 *  0ms       прелоадер виден, контент скрыт
 *  +100ms    inner fade-in (blur+y, 600ms easeOutCubic)
 *  параллельно — счётчик 0→100 за 1900ms
 *  +2000ms   inner fade-out (blur+y up, 600ms easeInCubic)
 *  +2700ms   prldr fade-out (300ms)
 *  +3000ms   контент fade-in (blur+y, 600ms)
 *  +3600ms   готово
 */
export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'in' | 'hold' | 'out' | 'gone'>('in');
  const [done, setDone] = useState(false);
  const startedRef = useRef<number | null>(null);

  useEffect(() => {
    const cnt = document.querySelector('main') as HTMLElement | null;
    if (cnt) cnt.style.opacity = '0';

    startedRef.current = performance.now();

    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - (startedRef.current || 0);

      // Counter 0→100 over 1900ms (от 100ms до 2000ms)
      if (elapsed < 100) {
        setProgress(0);
      } else if (elapsed < 2000) {
        const t = (elapsed - 100) / 1900;
        setProgress(Math.min(100, Math.round(t * 100)));
      } else {
        setProgress(100);
      }

      // Stage transitions
      if (elapsed < 100) {
        setStage('in');
      } else if (elapsed < 2000) {
        setStage('hold');
      } else if (elapsed < 2700) {
        setStage('out');
      } else if (elapsed >= 2700) {
        cancelAnimationFrame(raf);
        setStage('gone');

        // Контент появляется
        if (cnt) {
          cnt.style.transition = 'opacity 600ms cubic-bezier(0.215, 0.61, 0.355, 1), filter 600ms cubic-bezier(0.215, 0.61, 0.355, 1), transform 600ms cubic-bezier(0.215, 0.61, 0.355, 1)';
          cnt.style.filter = 'blur(10px)';
          cnt.style.transform = 'translateY(20px)';
          cnt.style.opacity = '0';

          requestAnimationFrame(() => {
            cnt.style.opacity = '1';
            cnt.style.filter = 'blur(0px)';
            cnt.style.transform = 'translateY(0)';
          });

          setTimeout(() => {
            cnt.style.transition = '';
            cnt.style.filter = '';
            cnt.style.transform = '';
          }, 700);
        }

        setTimeout(() => setDone(true), 350);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  if (done) return null;

  const innerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    transition: 'opacity 600ms cubic-bezier(0.215, 0.61, 0.355, 1), filter 600ms cubic-bezier(0.215, 0.61, 0.355, 1), transform 600ms cubic-bezier(0.215, 0.61, 0.355, 1)',
    opacity: stage === 'in' ? 0 : stage === 'out' ? 0 : 1,
    filter: stage === 'in' ? 'blur(10px)' : stage === 'out' ? 'blur(10px)' : 'blur(0px)',
    transform:
      stage === 'in' ? 'translateY(20px)'
      : stage === 'out' ? 'translateY(-20px)'
      : 'translateY(0)',
  };

  const prldrStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100dvh',
    background: 'var(--background)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'opacity 300ms cubic-bezier(0.215, 0.61, 0.355, 1)',
    opacity: stage === 'gone' ? 0 : 1,
    pointerEvents: stage === 'gone' ? 'none' : 'auto',
  };

  return (
    <div role="status" aria-hidden={done} style={prldrStyle}>
      <div style={innerStyle}>
        <div style={{ height: '180px', aspectRatio: '4 / 5' }}>
          <Emblem fill />
        </div>
        <span
          style={{
            fontSize: '80px',
            fontWeight: 700,
            lineHeight: 1,
            color: 'var(--foreground)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            userSelect: 'none',
          }}
        >
          {progress}%
        </span>
      </div>
    </div>
  );
}
