'use client';

import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';

/**
 * Прелоадер в стиле emelecollab.com/grid.
 *
 * Тайминг (td=600ms):
 *  0ms       фон (var(--background))
 *  +1000ms   текст fade-in (blur 10→0, y 20→0, easeOutCubic)
 *  +1000ms   текст hold
 *  -100ms    текст fade-out (blur 0→10, y 0→-20, easeInCubic)
 *  complete: прелоадер fade-out 300ms (delay 200ms)
 *  +300ms    контент fade-in (blur 10→0, y 20→0, easeOutCubic)
 */
export function Preloader() {
  const prldrRef = useRef<HTMLDivElement | null>(null);
  const txtRef = useRef<HTMLDivElement | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!prldrRef.current || !txtRef.current) return;

    const prldr = prldrRef.current;
    const txt = txtRef.current;
    const td = 600;

    // Главный контент сайта
    const cnt = document.querySelector('main');

    // Скрываем контент пока идёт прелоадер
    if (cnt) {
      (cnt as HTMLElement).style.opacity = '0';
    }

    const tl = anime.timeline({});

    // 1. Текст появляется
    tl.add({
      targets: txt,
      opacity: [0, 1],
      filter: ['blur(10px)', 'blur(0px)'],
      translateY: ['20px', '0'],
      easing: 'easeOutCubic',
      duration: td,
      delay: 1000,
    });

    // 2. Hold 1000ms
    tl.add({
      targets: txt,
      duration: 1000,
    });

    // 3. Текст исчезает
    tl.add({
      targets: txt,
      opacity: [1, 0],
      filter: ['blur(0px)', 'blur(10px)'],
      translateY: ['0', '-20px'],
      easing: 'easeInCubic',
      duration: td,
      delay: 100,
      complete: () => {
        // Прелоадер уходит
        anime({
          targets: prldr,
          opacity: [1, 0],
          easing: 'easeOutCubic',
          duration: 300,
          delay: 200,
          complete: () => {
            setDone(true);
          },
        });

        // Контент появляется
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
        ref={txtRef}
        style={{
          fontSize: '15px',
          color: 'var(--foreground)',
          letterSpacing: '-0.01em',
          opacity: 0,
          userSelect: 'none',
          fontFamily: 'inherit',
        }}
      >
        MaksMartin — Creative Studio
      </div>
    </div>
  );
}
