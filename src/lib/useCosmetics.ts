'use client';

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'mm-cosmetics';

export interface CosmeticTokens {
  'lockup-emblem-size': string;
  'lockup-name-size': string;
  'lockup-name-weight': string;
  'lockup-tagline-size': string;
  'lockup-tagline-max-width': string;
  'lockup-gap': string;
  'lockup-padding': string;
  'grid-columns': string;
  'grid-gap': string;
  'grid-padding-x': string;
  'grid-padding-top': string;
  'tile-radius': string;
  'tile-hover-scale': string;
  'perspective-distance': string;
  'perspective-tilt-max': string;
  'perspective-translate-z': string;
  'view-switcher-font-size': string;
  'view-switcher-radius': string;
  'font-tile-name-size': string;
  'font-tile-name-weight': string;
  'font-tile-meta-size': string;
}

export const DEFAULTS: CosmeticTokens = {
  'lockup-emblem-size': '60px',
  'lockup-name-size': '15px',
  'lockup-name-weight': '700',
  'lockup-tagline-size': '13px',
  'lockup-tagline-max-width': '260px',
  'lockup-gap': '12px',
  'lockup-padding': '24px',
  'grid-columns': '12',
  'grid-gap': '10px',
  'grid-padding-x': '10px',
  'grid-padding-top': '18vh',
  'tile-radius': '0px',
  'tile-hover-scale': '0.95',
  'perspective-distance': '1500px',
  'perspective-tilt-max': '60deg',
  'perspective-translate-z': '-200px',
  'view-switcher-font-size': '15px',
  'view-switcher-radius': '0px',
  'font-tile-name-size': '15px',
  'font-tile-name-weight': '700',
  'font-tile-meta-size': '15px',
};

export function useCosmetics() {
  const [tokens, setTokens] = useState<CosmeticTokens>(DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTokens({ ...DEFAULTS, ...parsed });
      }
    } catch (e) {
      console.warn('[cosmetics] failed to load:', e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const root = document.documentElement;
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, [tokens, isLoaded]);

  const setToken = useCallback((key: keyof CosmeticTokens, value: string) => {
    setTokens((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('[cosmetics] failed to save:', e);
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setTokens(DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    const root = document.documentElement;
    Object.keys(DEFAULTS).forEach((key) => {
      root.style.removeProperty(`--${key}`);
    });
  }, []);

  const exportAsCss = useCallback((): string => {
    const lines = [':root {'];
    Object.entries(tokens).forEach(([key, value]) => {
      if (value !== DEFAULTS[key as keyof CosmeticTokens]) {
        lines.push(`  --${key}: ${value};`);
      }
    });
    lines.push('}');
    return lines.join('\n');
  }, [tokens]);

  const exportAsJson = useCallback((): string => {
    return JSON.stringify(tokens, null, 2);
  }, [tokens]);

  const importFromJson = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      setTokens({ ...DEFAULTS, ...parsed });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULTS, ...parsed }));
    } catch (e) {
      console.error('[cosmetics] invalid json:', e);
      throw new Error('Invalid JSON');
    }
  }, []);

  return { tokens, setToken, reset, exportAsCss, exportAsJson, importFromJson, isLoaded };
}
