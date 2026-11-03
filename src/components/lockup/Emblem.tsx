'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import styles from './Emblem.module.css';

interface EmblemProps {
  height?: number;
  fill?: boolean;
  className?: string;
}

export function Emblem({ height = 200, fill = false, className = '' }: EmblemProps) {
  const { resolvedTheme } = useTheme();
  const [motionTheme, setMotionTheme] = useState<string>();
  const [loadedTheme, setLoadedTheme] = useState<string>();

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setMotionTheme(preference.matches ? undefined : theme);
    };

    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, [resolvedTheme]);

  const showingMotion = motionTheme !== undefined && loadedTheme === motionTheme;

  return (
    <div
      data-emblem
      data-motion-theme={showingMotion ? motionTheme : undefined}
      className={`${styles.emblem} ${className}`}
      style={fill ? { width: '100%', height: '100%' } : { height, aspectRatio: '4 / 5' }}
      aria-hidden="true"
    >
      {motionTheme && (
        <img
          key={motionTheme}
          src={`/emblem/${motionTheme}.webp`}
          width="144"
          height="180"
          alt=""
          draggable={false}
          onLoad={() => setLoadedTheme(motionTheme)}
          onError={() => setLoadedTheme(undefined)}
        />
      )}
    </div>
  );
}
