'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

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
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="
        fixed bottom-3 left-1/2 -translate-x-1/2 z-30
        inline-flex items-center
        h-7 w-14 rounded-full
        bg-foreground/10 hover:bg-foreground/20
        transition-colors duration-200
      "
    >
      <span
        className={[
          'absolute top-0.5 left-0.5',
          'inline-flex items-center justify-center',
          'h-6 w-6 rounded-full bg-background shadow',
          'transition-transform duration-300 ease-out',
          isDark ? 'translate-x-7' : 'translate-x-0',
        ].join(' ')}
      >
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
