'use client';

import { useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productionLanding, MOBILE_LAYOUT_QUERY } from '@/lib/productionNavigation';

/** Only the entry route chooses a default. Resizing never replaces a chosen view. */
export function ProductionEntry() {
  const router = useRouter();
  useLayoutEffect(() => {
    router.replace(productionLanding(window.matchMedia(MOBILE_LAYOUT_QUERY).matches));
  }, [router]);
  return (
    <main aria-label="Production" style={{ padding: 'var(--grid-padding-top) var(--grid-padding-x) 0' }}>
      <a href="/production/folder">Open Folder</a>
      <span aria-hidden="true"> / </span>
      <a href="/production/roll">Open Roll</a>
    </main>
  );
}
