import { notFound } from 'next/navigation';
import { PRODUCTION_PROJECTS } from '@/lib/projects';
import { ProjectList } from '@/components/views/ProjectList';
import { ProjectGallery } from '@/components/views/ProjectGallery';
import { ProductionRoll } from '@/components/production/ProductionRoll';
import { ProductionFolder } from '@/components/production/ProductionFolder';

export function generateStaticParams() {
  return ['list', 'roll', 'gallery', 'folder'].map((view) => ({ view }));
}

export default async function ProductionView({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (view === 'list') return <ProjectList projects={PRODUCTION_PROJECTS} />;
  if (view === 'gallery') return <ProjectGallery projects={PRODUCTION_PROJECTS} />;
  if (view === 'roll') return <ProductionRoll />;
  if (view === 'folder') return <ProductionFolder />;
  notFound();
}
