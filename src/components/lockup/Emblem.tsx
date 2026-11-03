'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { DesktopEmblem } from './DesktopEmblem';
import styles from './Emblem.module.css';

interface EmblemProps {
  height?: number;
  fill?: boolean;
  className?: string;
  intro?: boolean;
}

const desktopMotion = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const prefersDesktop = () => window.matchMedia(desktopMotion).matches;
const serverFallback = () => false;

function subscribeDesktop(listener: () => void) {
  const query = window.matchMedia(desktopMotion);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

export function Emblem({ intro = false, ...props }: EmblemProps) {
  const desktop = useSyncExternalStore(subscribeDesktop, prefersDesktop, serverFallback);
  if (desktop) return <DesktopEmblem {...props} />;
  return <MobileEmblem {...props} intro={intro} />;
}

function MobileEmblem({ height = 200, fill = false, className = '', intro = false }: EmblemProps) {
  const { resolvedTheme } = useTheme();
  const [motionTheme, setMotionTheme] = useState<string>();
  const [loadedTheme, setLoadedTheme] = useState<string>();

  useEffect(() => {
    if (intro || prefersDesktop()) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setMotionTheme(preference.matches ? undefined : theme);
    };

    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, [resolvedTheme, intro]);

  const showingMotion = motionTheme !== undefined && loadedTheme === motionTheme;

  return (
    <div
      data-emblem
      data-motion-theme={showingMotion ? motionTheme : undefined}
      className={`${styles.emblem} ${intro ? styles.introArt : ''} ${className}`}
      style={fill ? { width: '100%', height: '100%' } : { height, aspectRatio: '4 / 5' }}
      aria-hidden="true"
    >
      {intro && <video data-intro-film muted playsInline preload="none" suppressHydrationWarning />}
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
