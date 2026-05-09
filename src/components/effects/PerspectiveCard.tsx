'use client';

import { ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';

interface PerspectiveCardProps {
  children: ReactNode;
  className?: string;
  /** Интенсивность наклона при уходе вверх. Default: 60 (градусов) */
  maxTilt?: number;
  /** На какой высоте от верха viewport начинается наклон (0..1). Default: 0.3 — наклон начинается когда карточка в верхних 30% экрана */
  triggerStart?: number;
}

/**
 * PerspectiveCard — наклон карточки при уходе вверх из viewport.
 *
 * Логика:
 *  - Карточка под экраном (visible bottom of viewport): rotateX = 0
 *  - Карточка в средней части экрана: rotateX = 0
 *  - Карточка приближается к верху экрана (triggerStart * viewportH): начинает наклоняться
 *  - Карточка ушла за верх viewport: rotateX = -maxTilt (карточка лежит "от зрителя")
 *
 * Это per-card эффект, не глобальный. Каждая карточка независимо отслеживает свою позицию.
 *
 * Эталон: emelecollab.com/grid — карточки наклоняются ТОЛЬКО когда уходят вверх.
 */
export function PerspectiveCard({
  children,
  className = '',
  maxTilt = 60,
  triggerStart = 0.3,
}: PerspectiveCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  // useScroll с offset 'start end' to 'end start' даст progress 0→1
  // когда карточка проходит весь путь от появления снизу до ухода сверху
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start start'],
    // 'start end' — top карточки на bottom viewport (карточка только появилась)
    // 'start start' — top карточки на top viewport (карточка прижата к верху)
    // После 'start start' (progress > 1) карточка уже ушла за верх — это нам и нужно
  });

  // smoothing
  const smooth = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  // Вторая фаза — когда карточка уходит за верх (offset start to end of card)
  const { scrollYProgress: exitProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
    // 'start start' — top карточки на top viewport (только начала уходить)
    // 'end start' — bottom карточки на top viewport (карточка полностью ушла)
  });
  const smoothExit = useSpring(exitProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  // Вход (снизу): карточка прозрачна → проявляется при подъёме до 0.3 viewport (triggerStart)
  // 0..triggerStart: opacity 0.3 → 1, blur 4 → 0
  // triggerStart..1: opacity 1, blur 0
  const enterOpacity = useTransform(smooth, [0, triggerStart, 1], [0.3, 1, 1]);
  const enterBlur = useTransform(smooth, [0, triggerStart, 1], [4, 0, 0]);

  // Выход (сверху): карточка наклоняется и приподнимается в перспективе
  // exitProgress 0..1:
  //   rotateX: 0 → -maxTilt (карточка ложится "от зрителя", низ к нам)
  //   translateZ: 0 → -200 (отдаляется)
  //   opacity: 1 → 0.4 (затухает)
  const tiltRotateX = useTransform(smoothExit, [0, 1], [0, -maxTilt]);
  const tiltZ = useTransform(smoothExit, [0, 1], [0, -200]);
  const tiltOpacity = useTransform(smoothExit, [0, 0.7, 1], [1, 0.7, 0.3]);

  // Композим opacity (вход × выход)
  const opacity = useCombinedOpacity(enterOpacity, tiltOpacity);

  // Filter blur(...)
  const filter = useTransform(enterBlur, (b) => `blur(${b}px)`);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        perspective: '1500px',
        perspectiveOrigin: 'center 30%',
        // perspective-origin: где находится "глаз зрителя"
        // 30% сверху значит зритель смотрит сверху-сверху, карточки наверху загибаются от него
      }}
    >
      <motion.div
        style={{
          rotateX: tiltRotateX,
          translateZ: tiltZ,
          opacity,
          filter,
          transformStyle: 'preserve-3d',
          transformOrigin: 'center top',
          // origin: top — наклон относительно ВЕРХНЕГО края карточки
          // Это создаёт эффект "карточка загибается верхом от зрителя"
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function useCombinedOpacity(
  a: MotionValue<number>,
  b: MotionValue<number>
): MotionValue<number> {
  return useTransform([a, b], (vals) => {
    const v = vals as number[];
    return Math.min(v[0], v[1]);
  });
}
