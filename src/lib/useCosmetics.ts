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
  'unified-text-size': string;
  'unified-text-weight': string;
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
  'unified-text-size': '15px',
  'unified-text-weight': '700',
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

// ═══════════════════════════════════════════════
// PER-ELEMENT TOKENS
// ═══════════════════════════════════════════════

const ELEMENTS_STORAGE_KEY = 'mm-elements';

export interface ElementToken {
  // Typography
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
  textTransform?: string;
  fontStyle?: string;

  // Container
  maxWidth?: string;
  textAlign?: string;

  // Position (через transform: translate)
  translateX?: string;
  translateY?: string;

  // Spacing
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  // Color
  color?: string;
  opacity?: string;

  // Size
  width?: string;
  height?: string;
}

export type ElementsMap = Record<string, ElementToken>;

const DEFAULT_ELEMENTS: ElementsMap = {};

export function useElements() {
  const [elements, setElements] = useState<ElementsMap>(DEFAULT_ELEMENTS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ELEMENTS_STORAGE_KEY);
      if (stored) setElements(JSON.parse(stored));
    } catch (e) {
      console.warn('[elements] load failed:', e);
    }
    setIsLoaded(true);
  }, []);

  // Apply: каждый element token превращается в CSS var на :root
  useEffect(() => {
    if (!isLoaded) return;
    const root = document.documentElement;

    // Очистим старые --el-*
    Array.from(root.style).forEach((prop) => {
      if (prop.startsWith('--el-')) root.style.removeProperty(prop);
    });

    // Применим текущие
    Object.entries(elements).forEach(([elementId, token]) => {
      Object.entries(token).forEach(([prop, value]) => {
        if (value === undefined || value === '') return;
        const cssProp = prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
        root.style.setProperty(`--el-${elementId}-${cssProp}`, String(value));
      });
    });
  }, [elements, isLoaded]);

  const setElementToken = useCallback((elementId: string, token: Partial<ElementToken>) => {
    setElements((prev) => {
      const current = prev[elementId] || {};
      const updated = { ...current, ...token };
      // Удалим пустые значения
      Object.keys(updated).forEach((k) => {
        if (updated[k as keyof ElementToken] === undefined || updated[k as keyof ElementToken] === '') {
          delete updated[k as keyof ElementToken];
        }
      });
      const next = { ...prev, [elementId]: updated };
      try {
        localStorage.setItem(ELEMENTS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('[elements] save failed:', e);
      }
      return next;
    });
  }, []);

  const resetElement = useCallback((elementId: string) => {
    setElements((prev) => {
      const next = { ...prev };
      delete next[elementId];
      try {
        localStorage.setItem(ELEMENTS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const resetAllElements = useCallback(() => {
    setElements({});
    try {
      localStorage.removeItem(ELEMENTS_STORAGE_KEY);
    } catch {}
    const root = document.documentElement;
    Array.from(root.style).forEach((prop) => {
      if (prop.startsWith('--el-')) root.style.removeProperty(prop);
    });
  }, []);

  const exportElementsAsCss = useCallback((): string => {
    const lines = [':root {'];
    Object.entries(elements).forEach(([elementId, token]) => {
      Object.entries(token).forEach(([prop, value]) => {
        if (value === undefined || value === '') return;
        const cssProp = prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
        lines.push(`  --el-${elementId}-${cssProp}: ${value};`);
      });
    });
    lines.push('}');
    return lines.length > 2 ? lines.join('\n') : '';
  }, [elements]);

  return {
    elements,
    setElementToken,
    resetElement,
    resetAllElements,
    exportElementsAsCss,
    isLoaded,
  };
}
