'use client';

import { motion } from 'framer-motion';
import { ProjectTile } from '../../canvas/ProjectTile';
import { ScrollTiltedGrid } from '../ScrollTiltedGrid';
import type { Project } from '@/lib/projects';

interface ListViewProps {
  projects: Project[];
}

/**
 * LIST режим — вертикальный список крупных плиток.
 * Каждая плитка занимает значительную часть viewport.
 * Минималистичный, медленный скролл.
 */
export function ListView({ projects }: ListViewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <ScrollTiltedGrid tiltStrength={15}>
        <motion.div
          className="flex flex-col gap-12 md:gap-20"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={{
                hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="w-full"
            >
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="text-lg md:text-xl font-medium">{project.name}</h3>
                {project.year && (
                  <span className="text-sm opacity-50">{project.year}</span>
                )}
              </div>
              <ProjectTile project={project} />
            </motion.div>
          ))}
        </motion.div>
      </ScrollTiltedGrid>
    </div>
  );
}
