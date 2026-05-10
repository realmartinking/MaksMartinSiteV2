'use client';

import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { Emblem } from '@/components/lockup/Emblem';

/**
 * Прелоадер: эмблема MaksMartin + счётчик процентов рядом справа.
 *
 * Тайминг (td=600ms):
 *  0ms       фон по теме
 *  +1000ms   контент fade-in (blur 10→0, y 20→0, easeOutCubic)
 *  +1000ms   hold (счётчик идёт от 0 до 100)
 *  +600ms    контент fade-out (blur 0→10, y 0→-20, easeInCubic)
 *  complete: prldr fade-out 300ms → main контент fade-in
 */
export function Preloader() {
  const prldrRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!prldrRef.current || !innerRef.current) return;

    const prldr = prldrRef.current;
    const inner = innerRef.current;
    const td = 600;

    const cnt = document.querySelector('main');
    if (cnt) (cnt as HTMLElement).style.opacity = '0';

    // Анимация счётчика 0 → 100 за 1600ms (1000ms delay + 600ms fade-in overlap)
    const counterAnim = anime({
      targets: { value: 0 },
      value: 100,
      duration: 1600,
      delay: 1000,
      easing: 'linear',
      update: (a) => {
        const v = Math.round((a.animations[0].currentValue as unknown) as number);
        setProgress(v);
      },
    });

    const tl = anime.timeline({});

    // 1. Эмблема + счётчик появляются
    tl.add({
      targets: inner,
      opacity: [0, 1],
      filter: ['blur(10px)', 'blur(0px)'],
      translateY: ['20px', '0'],
      easing: 'easeOutCubic',
      duration: td,
      delay: 1000,
    });

    // 2. Hold 1000ms
    tl.add({
      targets: inner,
      duration: 1000,
    });

    // 3. Уезжают вверх с blur
    tl.add({
      targets: inner,
      opacity: [1, 0],
      filter: ['blur(0px)', 'blur(10px)'],
      translateY: ['0', '-20px'],
      easing: 'easeInCubic',
      duration: td,
      delay: 100,
      complete: () => {
        anime({
          targets: prldr,
          opacity: [1, 0],
          easing: 'easeOutCubic',
          duration: 300,
          delay: 200,
          complete: () => setDone(true),
        });
        if (cnt) {
          anime({
            targets: cnt,
            opacity: [0, 1],
            filter: ['blur(10px)', 'blur(0px)'],
            translateY: ['20px', '0px'],
            easing: 'easeOutCubic',
            duration: td,
            delay: 300,
            complete: () => {
              (cnt as HTMLElement).style.transform = '';
              (cnt as HTMLElement).style.filter = '';
            },
          });
        }
      },
    });

    return () => {
      tl.pause();
      counterAnim.pause();
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={prldrRef}
      role="status"
      aria-hidden={done}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100dvh',
        background: 'var(--background)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 1,
        pointerEvents: done ? 'none' : 'auto',
      }}
    >
      <div
        ref={innerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          opacity: 0,
        }}
      >
        {/* Эмблема */}
        <div style={{ height: '180px', aspectRatio: '4 / 5' }}>
          <Emblem fill />
        </div>

        {/* Счётчик процентов */}
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
