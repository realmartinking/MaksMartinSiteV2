'use client';

import { motion } from 'framer-motion';
import { LayoutList, LayoutGrid, Images } from 'lucide-react';
import type { ViewMode } from './types';

interface ViewSwitcherProps {
  current: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const VIEWS: { mode: ViewMode; label: string; Icon: typeof LayoutList }[] = [
  { mode: 'list',    label: 'List',    Icon: LayoutList },
  { mode: 'grid',    label: 'Grid',    Icon: LayoutGrid },
  { mode: 'gallery', label: 'Gallery', Icon: Images },
];

export function ViewSwitcher({ current, onChange }: ViewSwitcherProps) {
  return (
    <motion.div
      className="fixed top-[var(--lockup-padding)] left-[var(--lockup-padding)] z-40 flex items-center gap-1 p-1 rounded-full border border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md"
      initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
    >
      {VIEWS.map(({ mode, label, Icon }) => {
        const isActive = current === mode;
        return (
          <motion.button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isActive
                ? 'text-[var(--primary-foreground)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            whileTap={{ scale: 0.95 }}
            aria-label={label}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.span
                layoutId="view-pill"
                className="absolute inset-0 bg-[var(--primary)] rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
