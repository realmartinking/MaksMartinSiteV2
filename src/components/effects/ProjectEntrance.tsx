import type { CSSProperties, ReactNode } from 'react';

export function entranceStyle(index: number): CSSProperties {
  return { '--entrance-delay': `${Math.min(index * 0.08, 1.2)}s` } as CSSProperties;
}

export function ProjectEntrance({ children, index = 0, className = '', enabled = true, feedIndex }: {
  children: ReactNode; index?: number; className?: string; enabled?: boolean; feedIndex?: number;
}) {
  // Measure the untransformed box while its contents animate into view.
  if (feedIndex !== undefined) return <div data-feed-index={feedIndex} className={className}>
    <div className="project-entrance h-full" style={entranceStyle(index)}>{children}</div>
  </div>;
  return <div className={`${enabled ? 'project-entrance' : ''} ${className}`} style={entranceStyle(index)}>{children}</div>;
}
