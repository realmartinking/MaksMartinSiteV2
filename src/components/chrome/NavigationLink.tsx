'use client';

import { type ComponentProps, useEffect } from 'react';
import Link, { useLinkStatus } from 'next/link';
import styles from './Chrome.module.css';

function PendingNavigation({ href }: { href: string }) {
  const { pending } = useLinkStatus();

  useEffect(() => {
    if (!pending || !matchMedia('(hover: none) and (pointer: coarse)').matches) return;
    const start = location.href;
    const destination = new URL(href, start);
    if (destination.href === start) return;

    let expired = false;
    const openDocument = () => {
      if (expired && !document.hidden && location.href === start) {
        expired = false;
        location.assign(destination.href);
      }
    };
    const timer = window.setTimeout(() => {
      expired = true;
      openDocument();
    }, 5000);
    const cancel = () => {
      clearTimeout(timer);
      expired = false;
    };

    // A newer link clears Next's pending flag. History navigation or leaving the
    // document must also cancel this attempt, including when restored from bfcache.
    window.addEventListener('popstate', cancel);
    window.addEventListener('pagehide', cancel);
    document.addEventListener('visibilitychange', openDocument);
    return () => {
      cancel();
      window.removeEventListener('popstate', cancel);
      window.removeEventListener('pagehide', cancel);
      document.removeEventListener('visibilitychange', openDocument);
    };
  }, [href, pending]);

  return pending ? <span className={styles.pendingMarker} data-navigation-pending aria-hidden="true" /> : null;
}

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

export function NavigationLink({ href, children, ...props }: Props) {
  return (
    <Link href={href} {...props}>
      {children}
      <PendingNavigation href={href} />
    </Link>
  );
}
