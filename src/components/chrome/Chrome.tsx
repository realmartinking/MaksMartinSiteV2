'use client';

import React from 'react';
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
            data-edit-id="lockup-emblem"
            src="/MaksMartinLogo.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              height: 'var(--lockup-emblem-size)',
              width: 'auto',
              transform: 'translate(var(--el-lockup-emblem-translate-x, 0px), var(--el-lockup-emblem-translate-y, 0px))',
              marginTop: 'var(--el-lockup-emblem-margin-top, 0)',
              marginBottom: 'var(--el-lockup-emblem-margin-bottom, 0)',
            }}
          />
          <span
            data-edit-id="lockup-name"
            className="leading-tight"
            style={{
              fontSize: 'var(--lockup-name-size)',
              fontWeight: 'var(--lockup-name-weight)' as React.CSSProperties['fontWeight'],
              // Per-element overrides:
              letterSpacing: 'var(--el-lockup-name-letter-spacing, normal)',
              lineHeight: 'var(--el-lockup-name-line-height, 1.1)' as React.CSSProperties['lineHeight'],
              fontStyle: 'var(--el-lockup-name-font-style, normal)' as React.CSSProperties['fontStyle'],
              textTransform: 'var(--el-lockup-name-text-transform, none)' as React.CSSProperties['textTransform'],
              textAlign: 'var(--el-lockup-name-text-align, left)' as React.CSSProperties['textAlign'],
              maxWidth: 'var(--el-lockup-name-max-width, none)',
              opacity: 'var(--el-lockup-name-opacity, 1)' as unknown as number,
              transform: 'translate(var(--el-lockup-name-translate-x, 0px), var(--el-lockup-name-translate-y, 0px))',
              paddingTop: 'var(--el-lockup-name-padding-top, 0)',
              paddingRight: 'var(--el-lockup-name-padding-right, 0)',
              paddingBottom: 'var(--el-lockup-name-padding-bottom, 0)',
              paddingLeft: 'var(--el-lockup-name-padding-left, 0)',
              marginTop: 'var(--el-lockup-name-margin-top, 0)',
              marginBottom: 'var(--el-lockup-name-margin-bottom, 0)',
            }}
          >
            Maks Martin
          </span>
        </Link>

        {/* Top-center: slogan + Contacts → /studio */}
        <div className="pointer-events-auto flex items-start justify-center gap-6 leading-tight" style={{ fontSize: 'var(--lockup-tagline-size)' }}>
          <p
            data-edit-id="lockup-tagline"
            className="font-bold text-center"
            style={{
              maxWidth: 'var(--el-lockup-tagline-max-width, 22ch)',
              letterSpacing: 'var(--el-lockup-tagline-letter-spacing, normal)',
              lineHeight: 'var(--el-lockup-tagline-line-height, 1.3)' as React.CSSProperties['lineHeight'],
              fontStyle: 'var(--el-lockup-tagline-font-style, normal)' as React.CSSProperties['fontStyle'],
              textAlign: 'var(--el-lockup-tagline-text-align, center)' as React.CSSProperties['textAlign'],
              textTransform: 'var(--el-lockup-tagline-text-transform, none)' as React.CSSProperties['textTransform'],
              opacity: 'var(--el-lockup-tagline-opacity, 1)' as unknown as number,
              transform: 'translate(var(--el-lockup-tagline-translate-x, 0px), var(--el-lockup-tagline-translate-y, 0px))',
              paddingTop: 'var(--el-lockup-tagline-padding-top, 0)',
              paddingRight: 'var(--el-lockup-tagline-padding-right, 0)',
              paddingBottom: 'var(--el-lockup-tagline-padding-bottom, 0)',
              paddingLeft: 'var(--el-lockup-tagline-padding-left, 0)',
              marginTop: 'var(--el-lockup-tagline-margin-top, 0)',
              marginBottom: 'var(--el-lockup-tagline-margin-bottom, 0)',
            }}
          >
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
        <nav
          data-edit-id="view-switcher"
          className="
            pointer-events-auto justify-self-end
            flex items-center gap-7 font-bold
            [&:has(a:hover)_a:not(:hover)]:blur-[2px]
            [&:has(a:hover)_a:not(:hover)]:opacity-50
          "
          style={{
            fontSize: 'var(--view-switcher-font-size)',
            transform: 'translate(var(--el-view-switcher-translate-x, 0px), var(--el-view-switcher-translate-y, 0px))',
          }}
        >
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
