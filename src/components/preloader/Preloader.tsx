'use client';

import { useEffect, useRef, useState } from 'react';
import { Emblem } from '@/components/lockup/Emblem';
import styles from './Preloader.module.css';

export function Preloader() {
  const [dismissed, setDismissed] = useState(false);
  const intro = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dismissed || !intro.current) return;
    // CSS may already have finished before hydration, or skipped reduced motion.
    const style = getComputedStyle(intro.current);
    if (style.visibility === 'hidden' || style.display === 'none') {
      setDismissed(true);
      return;
    }
    const dismiss = () => setDismissed(true);
    // The header and links are already interactive in the server-rendered HTML.
    window.addEventListener('pointerdown', dismiss, { once: true, passive: true });
    window.addEventListener('keydown', dismiss, { once: true });
    return () => {
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('keydown', dismiss);
    };
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div ref={intro} className={styles.intro} aria-hidden="true" onAnimationEnd={event => {
      if (event.target === event.currentTarget) setDismissed(true);
    }}>
      <div className={styles.art} data-preloader-emblem><Emblem fill /></div>
      <span className={styles.progress} data-preloader-progress />
    </div>
  );
}
