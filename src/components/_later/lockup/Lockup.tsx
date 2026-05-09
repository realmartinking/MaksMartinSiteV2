'use client';

import { motion } from 'framer-motion';
import { Emblem } from '../../lockup/Emblem';
import { LockupButtons } from './Buttons';
import { SITE_INFO } from '@/lib/projects';

/**
 * Шапка сайта состоит из двух частей:
 *  - LockupCenter: эмблема в центре сверху (200px высоты)
 *  - LockupSide: слева под переключателем видов — Maks Martin + слоган + кнопки
 */

export function LockupCenter() {
  return (
    <motion.div
      className="fixed top-[var(--lockup-padding)] left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      style={{ height: 'var(--emblem-size)' }}
    >
      <div className="pointer-events-auto h-full">
        <Emblem fill />
      </div>
    </motion.div>
  );
}

export function LockupSide() {
  return (
    <motion.div
      className="fixed top-[calc(var(--lockup-padding)+72px)] left-[var(--lockup-padding)] z-40 flex flex-col gap-2 pointer-events-none"
      initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
    >
      <h1 className="text-[28px] md:text-[36px] font-bold leading-none tracking-tight pointer-events-auto">
        {SITE_INFO.name}
      </h1>

      <p className="font-times italic text-[12px] md:text-[13px] max-w-[260px] pointer-events-auto leading-snug opacity-70 mt-1">
        {SITE_INFO.slogan}
      </p>

      <div className="pointer-events-auto mt-2">
        <LockupButtons />
      </div>
    </motion.div>
  );
}
