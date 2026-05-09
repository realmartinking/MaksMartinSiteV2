'use client';

import { useEffect, useRef, useState } from 'react';
import { ProjectTile } from './ProjectTile';
import { PerspectiveCard } from '../effects/PerspectiveCard';
import type { Project } from '@/lib/projects';

interface InfiniteGridProps {
  projects: Project[];
  /** Сколько раз повторять список проектов при первом рендере. Default: 4 */
  initialPages?: number;
  /** Максимум видимых страниц одновременно (для performance). Default: 8 */
  maxPages?: number;
}

/**
 * Бесконечная вертикальная лента в 3 колонки.
 *
 * - Карточки разных aspect ratios (16:9, 9:16, 1:1) распределяются по колонкам как masonry
 * - При скролле к концу — подгружается ещё одна "страница" (повторение всех проектов)
 * - Старые страницы не удаляются (max 8 страниц = ~136 карточек, потом перестаёт расти)
 * - Каждая карточка обёрнута в PerspectiveCard — наклон при уходе вверх
 *
 * Эталон: emelecollab.com/grid — длинная лента в 3 колонки, бесконечный скролл.
 */
export function InfiniteGrid({ projects, initialPages = 4, maxPages = 8 }: InfiniteGridProps) {
  const [pages, setPages] = useState(initialPages);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver на sentinel внизу — добавляет страницы
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPages((p) => Math.min(p + 1, maxPages));
        }
      },
      { rootMargin: '500px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [maxPages]);

  // Распределение проектов по 3 колонкам.
  // Простой round-robin даёт неровные высоты, но визуально это ОК для асимметричной сетки.
  // Для более точного masonry нужна реальная высота, но это переусложнит.
  const totalProjects: Project[] = [];
  for (let p = 0; p < pages; p++) {
    totalProjects.push(...projects);
  }

  // Распределяем по 3 колонкам так, чтобы получалась хаотичность aspect-ratio
  const columns: Project[][] = [[], [], []];
  totalProjects.forEach((proj, i) => {
    columns[i % 3].push(proj);
  });

  return (
    <div className="w-full px-4 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-4 md:gap-6">
            {col.map((project, idx) => (
              <PerspectiveCard
                key={`${colIdx}-${idx}-${project.id}`}
                className="w-full"
              >
                <ProjectTile project={project} />
              </PerspectiveCard>
            ))}
          </div>
        ))}
      </div>

      {/* Sentinel для подгрузки — невидимый, в самом низу */}
      <div ref={sentinelRef} className="h-32" aria-hidden="true" />

      {/* Визуальный footer когда достигнут maxPages */}
      {pages >= maxPages && (
        <div className="text-center py-12 text-xs opacity-30">
          End of grid
        </div>
      )}
    </div>
  );
}
