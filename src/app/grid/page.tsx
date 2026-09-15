import GridPage from './_GridPage';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ motion?: string }>;
}) {
  const { motion } = await searchParams;
  return <GridPage motionPreview={motion !== 'classic'} />;
}
