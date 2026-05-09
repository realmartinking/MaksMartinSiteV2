'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'List',    href: '/'        },
  { label: 'Grid',    href: '/grid'    },
  { label: 'Gallery', href: '/gallery' },
];

export function Chrome() {
  const pathname = usePathname();

  return (
    <>
      {/* Top-right: List / Grid / Gallery */}
      <nav
        className="
          fixed top-2 right-3 z-30
          flex items-center gap-1
          text-[15px] leading-none
          [&:has(a:hover)_a:not(:hover)]:blur-[2px]
          [&:has(a:hover)_a:not(:hover)]:opacity-50
        "
      >
        {NAV.map((l, idx) => (
          <span key={l.href} className="flex items-center">
            <Link
              href={l.href}
              className={[
                'px-2 py-1 transition-[filter,opacity] duration-200',
                pathname === l.href ? 'blur-[2px] opacity-50' : '',
              ].join(' ')}
            >
              {l.label}
            </Link>
            {idx < NAV.length - 1 && (
              <span className="opacity-40 select-none">/</span>
            )}
          </span>
        ))}
      </nav>

      {/* Bottom-right: Email */}
      <a
        href="mailto:martinmursalimov@gmail.com?subject=Hi%20Maks"
        className="
          fixed bottom-3 right-3 z-30 text-[15px]
          opacity-50 hover:opacity-100 transition-opacity duration-200
        "
      >
        Email Me
      </a>
    </>
  );
}
