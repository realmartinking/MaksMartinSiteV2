'use client';

import { motion } from 'framer-motion';
import { ProjectTile } from '../../canvas/ProjectTile';
import { ScrollTiltedGrid } from '../ScrollTiltedGrid';
import type { Project } from '@/lib/projects';

interface GridViewProps {
  projects: Project[];
}

/**
 * GRID режим — хаотичная сетка где плитки имеют разные aspect ratio.
 * Layout: max 3 колонки × 2 ряда видимо. Остальное при скролле.
 * Плитки разных пропорций (16:9 / 9:16 / 1:1) хаотично перемежаются.
 */
export function GridView({ projects }: GridViewProps) {
  // Разбиваем на чанки по 6 проектов (3×2 видимая область)
  const chunks: Project[][] = [];
  for (let i = 0; i < projects.length; i += 6) {
    chunks.push(projects.slice(i, i + 6));
  }
  
  return (
    <div className="w-full">
      {chunks.map((chunk, chunkIdx) => (
        <ScrollTiltedGrid key={chunkIdx} className="mb-16">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 auto-rows-fr"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.08 },
              },
            }}
          >
            {chunk.map((project) => (
              <motion.div
                key={project.id}
                variants={{
                  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                className={getSpanClass(project.aspect)}
              >
                <ProjectTile project={project} />
              </motion.div>
            ))}
          </motion.div>
        </ScrollTiltedGrid>
      ))}
    </div>
  );
}

/**
 * Дать плитке span в сетке в зависимости от aspect ratio.
 * Vertical плитки могут занимать 2 ряда чтобы выглядеть пропорционально.
 * Square — обычный 1×1.
 * Wide — обычный 1×1 (но aspect-video внутри сделает пропорции правильными).
 */
function getSpanClass(aspect: Project['aspect']): string {
  switch (aspect) {
    case 'vertical':
      return 'sm:row-span-2';
    case 'wide':
    case 'square':
    default:
      return '';
  }
}
