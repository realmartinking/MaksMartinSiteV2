'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitch } from '@/components/theme/ThemeSwitch';
import { Emblem } from '@/components/lockup/Emblem';
import styles from './Chrome.module.css';

const VIEWS = [
  { href: '/list', label: 'List' },
  { href: '/grid', label: 'Grid' },
  { href: '/gallery', label: 'Gallery' },
];

const UPCOMING = ['AI BrandStudio', 'Tools'];
const PRODUCTION_VIEWS = [
  { href: '/production/list', label: 'List' },
  { href: '/production/roll', label: 'Roll' },
  { href: '/production/gallery', label: 'Gallery' },
  { href: '/production/folder', label: 'Folder' },
];

// Keep the existing visual editor's overrides available on the rebuilt header.
function elementStyle(id: string, fontSize = 'inherit', lineHeight = 'inherit'): React.CSSProperties {
  const value = (property: string, fallback: string) => `var(--el-${id}-${property}, ${fallback})`;
  return {
    fontSize: value('font-size', fontSize),
    fontWeight: value('font-weight', 'inherit') as React.CSSProperties['fontWeight'],
    letterSpacing: value('letter-spacing', 'normal'),
    lineHeight: value('line-height', lineHeight),
    fontStyle: value('font-style', 'normal'),
    textTransform: value('text-transform', 'none') as React.CSSProperties['textTransform'],
    textAlign: value('text-align', 'left') as React.CSSProperties['textAlign'],
    maxWidth: value('max-width', 'none'),
    opacity: value('opacity', '1'),
    transform: `translate(${value('translate-x', '0px')}, ${value('translate-y', '0px')})`,
    paddingTop: value('padding-top', '0px'),
    paddingRight: value('padding-right', '0px'),
    paddingBottom: value('padding-bottom', '0px'),
    paddingLeft: value('padding-left', '0px'),
    marginTop: value('margin-top', '0px'),
    marginBottom: value('margin-bottom', '0px'),
  };
}

export function Chrome() {
  const pathname = usePathname();
  const isProduction = pathname.startsWith('/production');
  const views = isProduction ? PRODUCTION_VIEWS : VIEWS;
  const isActive = (href: string) => pathname === href || (href === '/grid' && pathname === '/') || (href === '/production/folder' && pathname === '/production');
  const isBranding = pathname === '/' || VIEWS.some(({ href }) => pathname === href);

  return (
    <>
      <header className={styles.header}>
        <Link href="/grid" className={styles.brand} aria-label="Maks Martin — home">
          <div
            data-edit-id="lockup-emblem"
            className={styles.emblem}
            style={{
              height: 'var(--el-lockup-emblem-height, var(--emblem-anchor-height))',
              transform: 'translate(var(--el-lockup-emblem-translate-x, 0px), var(--el-lockup-emblem-translate-y, 0px))',
            }}
          >
            <div className={styles.emblemStage}><Emblem fill /></div>
          </div>
          <span data-edit-id="lockup-name" className={styles.wordmark} style={elementStyle('lockup-name', 'var(--lockup-name-size)')}>
            MaksMartin
          </span>
        </Link>

        <nav className={styles.sections} aria-label="Studio sections">
          <Link href="/grid" className={isBranding ? styles.active : undefined} aria-current={isBranding ? 'page' : undefined}>
            Branding
          </Link>
          <Link href="/production/folder" className={isProduction ? styles.active : undefined} aria-current={isProduction ? 'page' : undefined}>Production</Link>
          {UPCOMING.map((label) => (
            <button key={label} type="button" className={styles.upcoming} aria-disabled="true" aria-label={`${label} — coming soon`}>
              <span className={styles.upcomingLabel} aria-hidden="true">{label}</span>
              <span className={styles.soon} aria-hidden="true">Soon</span>
            </button>
          ))}
          <Link href="/info" data-edit-id="lockup-contacts" className={isActive('/info') ? styles.active : undefined} aria-current={isActive('/info') ? 'page' : undefined} style={elementStyle('lockup-contacts')}>
            Info
          </Link>
        </nav>

        <nav data-edit-id="view-switcher" className={`${styles.views} ${isProduction ? styles.productionViews : ''}`} aria-label="Project view" style={elementStyle('view-switcher', 'var(--view-font-size)', '22.5px')}>
          {views.map(({ href, label }) => (
            <Link key={href} href={href} className={isActive(href) ? styles.active : undefined} aria-current={isActive(href) ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <ThemeSwitch />
    </>
  );
}
