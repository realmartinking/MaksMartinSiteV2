'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitch } from '@/components/theme/ThemeSwitch';

const NAV = [
  { href: '/list',    label: 'List'    },
  { href: '/grid',    label: 'Grid'    },
  { href: '/gallery', label: 'Gallery' },
];

export function Chrome() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href === '/grid' && pathname === '/');

  return (
    <>
      {/* ── Top bar: 3-column fixed header ── */}
      <header className="
        fixed inset-x-0 top-0 z-30
        grid grid-cols-3 items-start
        gap-6 px-6 pt-4 pb-3
        pointer-events-none
      ">
        {/* Top-left: emblem video + wordmark → /grid */}
        <Link
          href="/grid"
          className="pointer-events-auto flex items-center gap-3 w-fit"
          aria-label="Maks Martin — home"
        >
          <video
            src="/MaksMartinLogo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="h-[60px] w-auto"
          />
          <span className="font-bold text-[15px] leading-tight">Maks Martin</span>
        </Link>

        {/* Top-center: slogan + Contacts → /studio */}
        <div className="pointer-events-auto flex items-start justify-center gap-6 text-[15px] leading-tight">
          <p className="font-bold max-w-[22ch] text-center">
            Timeless design,<br />like classical music,<br />love and money
          </p>
          <Link
            href="/studio"
            className="font-bold whitespace-nowrap hover:opacity-60 transition-opacity duration-200"
          >
            Contacts
          </Link>
        </div>

        {/* Top-right: List · Grid · Gallery — no slashes, bold */}
        <nav className="
          pointer-events-auto justify-self-end
          flex items-center gap-7 text-[15px] font-bold
          [&:has(a:hover)_a:not(:hover)]:blur-[2px]
          [&:has(a:hover)_a:not(:hover)]:opacity-50
        ">
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={[
                'transition-[filter,opacity] duration-200',
                isActive(l.href) ? 'blur-[2px] opacity-50' : '',
              ].join(' ')}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ── Bottom center: theme switch ── */}
      <ThemeSwitch />

      {/* ── Bottom right: email ── */}
      <a
        href="mailto:martinmursalimov@gmail.com?subject=Hi%20Maks"
        className="fixed bottom-3 right-4 z-30 text-[15px] opacity-50 hover:opacity-100 transition-opacity duration-200"
      >
        Email Me
      </a>
    </>
  );
}
