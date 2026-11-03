'use client';

import { useEffect, useRef, useState } from 'react';
import { Emblem } from '@/components/lockup/Emblem';
import styles from './Preloader.module.css';
import { mobileIntroScript } from './mobileIntro';

export function Preloader() {
  const [dismissed, setDismissed] = useState(false);
  const intro = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = intro.current;
    if (!overlay) return;
    const dismiss = () => setDismissed(true);
    if (!overlay.hasAttribute('data-mobile-intro') && !overlay.hasAttribute('data-desktop-intro')) {
      dismiss();
      return;
    }
    // The parser-time controller owns the clock. Hydration must never rewind it.
    overlay.addEventListener('intro-finished', dismiss, { once: true });
    return () => overlay.removeEventListener('intro-finished', dismiss);
  }, []);

  if (dismissed) return null;
  return <>
    <div ref={intro} data-intro-overlay aria-hidden="true" className={styles.intro} suppressHydrationWarning>
      <div className={styles.group} data-intro-group>
        <div className={styles.art} data-preloader-emblem><Emblem fill intro /></div>
        <span data-preloader-progress className={styles.progress}>
          <span data-mobile-progress suppressHydrationWarning>0%</span>
        </span>
      </div>
    </div>
    <script dangerouslySetInnerHTML={{ __html: mobileIntroScript }} />
  </>;
}
