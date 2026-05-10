'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Theme toggle (light/dark).
 *
 * Glassmorph track with backdrop blur + contrasting knob with inverse icon.
 * Uses inline style with var(--background)/var(--foreground) because
 * Tailwind v4 bg-background doesn't resolve in this project's setup.
 */
export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 inline-flex items-center h-7 w-14 rounded-full transition-colors duration-200"
      style={{
        background: isDark
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(0, 0, 0, 0.10)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <span
        className="absolute top-0.5 inline-flex items-center justify-center h-6 w-6 rounded-full transition-transform duration-300 ease-out"
        style={{
          background: 'var(--foreground)',
          color: 'var(--background)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          transform: `translateX(${isDark ? 28 : 2}px)`,
          left: 0,
        }}
      >
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </span>
    </button>
  );
}
