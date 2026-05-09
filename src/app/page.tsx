'use client';

import { InfiniteGrid } from '@/components/canvas/InfiniteGrid';
import { Preloader } from '@/components/preloader/Preloader';
import { PROJECTS } from '@/lib/projects';

/**
 * MaksMartin v2 — итерация 1.
 *
 * Сейчас: бесконечная вертикальная лента из 17 проектов в 3 колонки,
 * с per-card perspective tilt при уходе вверх (emelecollab.com/grid стиль).
 *
 * Шапка (Lockup, ViewSwitcher) — добавляется в следующей итерации.
 */
export default function HomePage() {
  return (
    <>
      <Preloader />

      {/* Минимальный отступ сверху чтобы первый ряд не вплотную */}
      <main className="min-h-screen pt-8 md:pt-12 pb-20">
        <InfiniteGrid projects={PROJECTS} initialPages={4} maxPages={10} />
      </main>
    </>
  );
}
