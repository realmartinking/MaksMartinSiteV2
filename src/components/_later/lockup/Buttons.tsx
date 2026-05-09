'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sun, Moon } from 'lucide-react';
import { SITE_INFO } from '@/lib/projects';

export function LockupButtons() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  const isDark = mounted && resolvedTheme === 'dark';
  
  return (
    <div className="flex items-center gap-2 mt-4">
      <motion.a
        href={SITE_INFO.telegram}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Telegram"
      >
        <Send size={16} />
      </motion.a>
      
      <motion.button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle theme"
        suppressHydrationWarning
      >
        {mounted ? (isDark ? <Sun size={16} /> : <Moon size={16} />) : <Moon size={16} />}
      </motion.button>
    </div>
  );
}
