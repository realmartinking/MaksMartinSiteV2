'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Emblem } from '../lockup/Emblem';

/**
 * Прелоудер: эмблема в центре viewport + счётчик 0% → 100%.
 * После 100% — fade out 700ms, потом убирается из DOM.
 * Параллельно открываются основные элементы сайта.
 */
export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  // Симуляция прогресса загрузки (можно подключить к real video buffered events)
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const duration = 2200; // ms
    
    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        // Подождать 300ms на 100%, потом fade out
        setTimeout(() => setIsVisible(false), 300);
      }
    };
    
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--background)]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative flex items-center justify-center">
            <Emblem height={280} />
            
            {/* Счётчик % справа от эмблемы */}
            <motion.div
              className="absolute font-times text-[42px] md:text-[56px] font-bold tabular-nums leading-none"
              style={{
                top: '5%',
                right: '-30%',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: progress < 100 ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            >
              {progress}%
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
