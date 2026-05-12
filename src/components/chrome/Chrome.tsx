'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitch } from '@/components/theme/ThemeSwitch';
import { Emblem } from '@/components/lockup/Emblem';

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
      <header
        className="
          fixed inset-x-0 top-0 z-30
          grid grid-cols-3 items-start
          gap-6 px-6 pb-3
          pointer-events-none
        "
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        {/* Top-left: emblem video + wordmark → /grid */}
        <Link
          href="/grid"
          className="pointer-events-auto flex items-center gap-3 w-fit"
          aria-label="Maks Martin — home"
        >
          <div
            data-edit-id="lockup-emblem"
            style={{
              height: 'var(--el-lockup-emblem-height, var(--lockup-emblem-size))',
              aspectRatio: '4 / 5',
              flexShrink: 0,
              transform: 'translate(var(--el-lockup-emblem-translate-x, 0px), var(--el-lockup-emblem-translate-y, 0px))',
              paddingTop: 'var(--el-lockup-emblem-padding-top, 0)',
              paddingRight: 'var(--el-lockup-emblem-padding-right, 0)',
              paddingBottom: 'var(--el-lockup-emblem-padding-bottom, 0)',
              paddingLeft: 'var(--el-lockup-emblem-padding-left, 0)',
              marginTop: 'var(--el-lockup-emblem-margin-top, 0)',
              marginBottom: 'var(--el-lockup-emblem-margin-bottom, 0)',
            }}
          >
            <Emblem fill />
          </div>
          <span
            data-edit-id="lockup-name"
            style={{
              fontSize: 'var(--el-lockup-name-font-size, var(--lockup-name-size))',
              fontWeight: 'var(--el-lockup-name-font-weight, var(--lockup-name-weight))' as React.CSSProperties['fontWeight'],
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
              display: 'block',
              whiteSpace: 'normal',
              wordBreak: 'normal',
            }}
          >
            MaksMartin
          </span>
        </Link>

        {/* Top-center: slogan + Info → /info */}
        <div className="pointer-events-auto flex items-start justify-center gap-6 leading-tight">
          <p
            data-edit-id="lockup-tagline"
            style={{
              fontSize: 'var(--el-lockup-tagline-font-size, var(--unified-text-size))',
              fontWeight: 'var(--el-lockup-tagline-font-weight, var(--unified-text-weight))' as React.CSSProperties['fontWeight'],
              maxWidth: 'var(--el-lockup-tagline-max-width, var(--lockup-tagline-max-width))',
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
              display: 'block',
              whiteSpace: 'normal',
              wordBreak: 'normal',
              overflowWrap: 'normal',
            }}
          >
            Timeless design, like classical<br />music, love, and money
          </p>
          <Link
            href="/info"
            data-edit-id="lockup-contacts"
            className="whitespace-nowrap hover:opacity-60 transition-opacity duration-200"
            style={{
              fontSize: 'var(--el-lockup-contacts-font-size, var(--unified-text-size))',
              fontWeight: 'var(--el-lockup-contacts-font-weight, var(--unified-text-weight))' as React.CSSProperties['fontWeight'],
              transform: 'translate(var(--el-lockup-contacts-translate-x, 0px), var(--el-lockup-contacts-translate-y, 0px))',
            }}
          >
            Info
          </Link>
        </div>

        {/* Top-right: List · Grid · Gallery */}
        <nav
          data-edit-id="view-switcher"
          className="
            pointer-events-auto justify-self-end
            flex items-center gap-7
            [&:has(a:hover)_a:not(:hover)]:blur-[2px]
            [&:has(a:hover)_a:not(:hover)]:opacity-50
          "
          style={{
            fontSize: 'var(--el-view-switcher-font-size, var(--unified-text-size))',
            fontWeight: 'var(--el-view-switcher-font-weight, var(--unified-text-weight))' as React.CSSProperties['fontWeight'],
            transform: 'translate(var(--el-view-switcher-translate-x, 0px), var(--el-view-switcher-translate-y, 0px))',
            paddingTop: 'var(--el-view-switcher-padding-top, 0)',
            paddingRight: 'var(--el-view-switcher-padding-right, 0)',
            paddingBottom: 'var(--el-view-switcher-padding-bottom, 0)',
            paddingLeft: 'var(--el-view-switcher-padding-left, 0)',
          }}
        >
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={[
                'transition-[filter,opacity] duration-200 py-3 -my-3',
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

    </>
  );
}
