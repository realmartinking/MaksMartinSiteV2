'use client';

import { motion } from 'framer-motion';
import { ProjectTile } from '../../canvas/ProjectTile';
import type { Project } from '@/lib/projects';

interface GalleryViewProps {
  projects: Project[];
}

/**
 * GALLERY режим — горизонтальная прокрутка крупных плиток.
 * Плитки идут одна за другой по горизонтали, занимая ~70% viewport ширины.
 * Скролл колесом мыши = горизонтальная прокрутка.
 */
export function GalleryView({ projects }: GalleryViewProps) {
  return (
    <div className="w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory">
      <motion.div
        className="inline-flex items-center gap-6 md:gap-12 px-8 md:px-16"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: { staggerChildren: 0.08 },
          },
        }}
      >
        {projects.map((project) => (
          <motion.div
            key={project.id}
            variants={{
              hidden: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
              visible: {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="snap-center flex-shrink-0"
            style={{
              width: aspectToWidth(project.aspect),
            }}
          >
            <div className="mb-3">
              <h3 className="text-base font-medium">{project.name}</h3>
              {project.year && (
                <span className="text-xs opacity-50">{project.year}</span>
              )}
            </div>
            <ProjectTile project={project} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function aspectToWidth(aspect: Project['aspect']): string {
  switch (aspect) {
    case 'wide':     return 'min(70vw, 800px)';
    case 'vertical': return 'min(40vw, 450px)';
    case 'square':   return 'min(50vw, 600px)';
  }
}
