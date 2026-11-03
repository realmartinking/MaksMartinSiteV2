'use client';

import { usePathname } from 'next/navigation';

export default function RouteError() {
  const pathname = usePathname();
  return (
    <main style={{ padding: 'var(--grid-padding-top) var(--grid-padding-x) 0' }}>
      <p role="alert">This page could not be loaded.</p>
      <a className="underline" href={pathname}>Reload page</a>
    </main>
  );
}
