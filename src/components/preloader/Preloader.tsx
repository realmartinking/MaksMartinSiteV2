'use client';

import { useEffect, useRef, useState } from 'react';
import { Emblem } from '@/components/lockup/Emblem';
import styles from './Preloader.module.css';
import { mobileIntroQuery, mobileIntroScript } from './mobileIntro';

export function Preloader() {
  const [dismissed, setDismissed] = useState(false);
  const intro = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dismissed || !intro.current) return;
    const overlay = intro.current;
    const dismiss = () => setDismissed(true);
    if (window.matchMedia(mobileIntroQuery).matches) {
      if (overlay.hasAttribute('data-mobile-intro')) {
        overlay.addEventListener('mobile-intro-finished', dismiss, { once: true });
        return () => overlay.removeEventListener('mobile-intro-finished', dismiss);
      }
      dismiss();
      return;
    }
    // CSS may already have finished before hydration, or skipped reduced motion.
    const style = getComputedStyle(intro.current);
    if (style.visibility === 'hidden' || style.display === 'none') {
      setDismissed(true);
      return;
    }
    // On desktop the original short intro remains skippable.
    window.addEventListener('pointerdown', dismiss, { once: true, passive: true });
    window.addEventListener('keydown', dismiss, { once: true });
    return () => {
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('keydown', dismiss);
    };
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <>
      <div ref={intro} data-intro-overlay className={styles.intro} aria-hidden="true" suppressHydrationWarning onAnimationEnd={event => {
        if (event.target === event.currentTarget) setDismissed(true);
      }}>
        <div className={styles.art} data-preloader-emblem><Emblem fill /></div>
        <span className={styles.progress} data-preloader-progress>
          <span data-mobile-progress className={styles.mobileProgress} suppressHydrationWarning>0%</span>
        </span>
      </div>
      <script dangerouslySetInnerHTML={{ __html: mobileIntroScript }} />
    </>
  );
}
