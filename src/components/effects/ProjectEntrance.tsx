import type { CSSProperties, ReactNode } from 'react';

export function entranceStyle(index: number): CSSProperties {
  return { '--entrance-delay': `${Math.min(index * 0.08, 1.2)}s` } as CSSProperties;
}

export function ProjectEntrance({ children, index = 0, className = '', enabled = true }: {
  children: ReactNode; index?: number; className?: string; enabled?: boolean;
}) {
  return <div className={`${enabled ? 'project-entrance' : ''} ${className}`} style={entranceStyle(index)}>{children}</div>;
}
