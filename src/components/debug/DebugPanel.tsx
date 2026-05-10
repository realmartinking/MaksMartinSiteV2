'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useCosmetics, useElements } from '@/lib/useCosmetics';
import { Section, SliderControl, SelectControl } from './Controls';
import { ElementInspector } from './ElementInspector';
import { ElementProperties } from './ElementProperties';
import { ELEMENT_SCHEMAS, FALLBACK_SCHEMA } from './element-schemas';

const TOKEN = 'maks2026';

type Mode = 'global' | 'inspect';

export function DebugPanel() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [mode, setMode] = useState<Mode>('global');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'export' | 'meta'>('edit');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const { tokens, setToken, reset, exportAsCss, exportAsJson, importFromJson, isLoaded } = useCosmetics();
  const { elements, resetAllElements, exportElementsAsCss, isLoaded: elementsLoaded } = useElements();
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === TOKEN) setIsAuthorized(true);
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === 'Escape' && selectedId) {
        e.preventDefault();
        setSelectedId(null);
      }
      // I = inspect mode toggle
      if (e.key === 'i' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        setMode((m) => (m === 'inspect' ? 'global' : 'inspect'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAuthorized, selectedId]);

  if (!isAuthorized || !isLoaded || !elementsLoaded) return null;

  const handleCopy = async () => {
    const globalCss = exportAsCss();
    const elementsCss = exportElementsAsCss();
    const combined = [globalCss, elementsCss].filter(Boolean).join('\n\n');
    try {
      await navigator.clipboard.writeText(combined);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  const currentSchema = selectedId ? (ELEMENT_SCHEMAS[selectedId] || FALLBACK_SCHEMA) : null;

  return (
    <>
      {/* Element inspector overlay */}
      <ElementInspector
        isActive={mode === 'inspect'}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          if (id) setMode('global');
        }}
      />

      {/* Collapsed toggle */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-4 right-4 z-[10000] px-3 py-2 bg-black/90 text-white text-[11px] rounded-lg backdrop-blur-md border border-white/10 hover:bg-black"
          >
            ◐ Edit
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-4 right-4 z-[10000] w-[320px] max-h-[calc(100vh-32px)] bg-black/95 backdrop-blur-xl text-white rounded-xl border border-white/10 shadow-2xl flex flex-col"
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wide uppercase opacity-70">Debug</span>
                <span className="text-[10px] opacity-40">⌘E · I=inspect · ESC</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
              >
                ×
              </button>
            </div>

            {/* Mode switcher */}
            <div className="flex gap-1 p-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => { setMode('global'); setSelectedId(null); }}
                className={`flex-1 px-2 py-1.5 text-[11px] rounded transition-colors ${
                  mode === 'global' && !selectedId
                    ? 'bg-white text-black font-medium'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                Global
              </button>
              <button
                type="button"
                onClick={() => setMode('inspect')}
                className={`flex-1 px-2 py-1.5 text-[11px] rounded transition-colors flex items-center justify-center gap-1 ${
                  mode === 'inspect'
                    ? 'bg-blue-500 text-white font-medium'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                ⊕ Inspect {mode === 'inspect' && '(click element)'}
              </button>
              {selectedId && (
                <button
                  type="button"
                  className="flex-1 px-2 py-1.5 text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded font-mono truncate"
                  onClick={() => {}}
                >
                  {selectedId}
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 text-[11px]">
              {/* Per-element editing */}
              {selectedId && currentSchema && (
                <ElementProperties
                  elementId={selectedId}
                  schema={currentSchema}
                  onClose={() => setSelectedId(null)}
                />
              )}

              {/* Inspect mode hint */}
              {mode === 'inspect' && !selectedId && (
                <div className="text-center py-8 text-white/50">
                  <div className="text-2xl mb-2">⊕</div>
                  <div className="text-[12px] mb-1">Inspect mode</div>
                  <div className="text-[10px] text-white/40 max-w-[220px] mx-auto">
                    Hover over the page to see editable elements. Click one to select.
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode('global')}
                    className="mt-4 text-[10px] text-white/60 hover:text-white underline"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Global mode */}
              {!selectedId && mode === 'global' && (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-white/10 text-[11px] -mx-3 mb-3">
                    {(['edit', 'export', 'meta'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 capitalize transition-colors ${
                          activeTab === tab ? 'text-white border-b border-white' : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'edit' && (
                    <div className="flex flex-col gap-1">
                      <Section title="Theme">
                        <SelectControl
                          label="Mode"
                          value={(theme === 'system' ? resolvedTheme : theme) || 'light'}
                          onChange={setTheme}
                          options={[{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }]}
                        />
                      </Section>

                      <Section title="Typography Global">
                        <SliderControl label="Unified small text" value={tokens['unified-text-size']} onChange={(v) => setToken('unified-text-size', v)} min={9} max={24} step={1} />
                        <SliderControl label="Unified text weight" value={tokens['unified-text-weight']} onChange={(v) => setToken('unified-text-weight', v)} min={300} max={900} step={100} unit="" />
                      </Section>

                      <Section title="Header Lockup">
                        <SliderControl label="Emblem size" value={tokens['lockup-emblem-size']} onChange={(v) => setToken('lockup-emblem-size', v)} min={30} max={120} step={2} />
                        <SliderControl label="Padding from edge" value={tokens['lockup-padding']} onChange={(v) => setToken('lockup-padding', v)} min={8} max={80} step={2} />
                        <SliderControl label="Gap between" value={tokens['lockup-gap']} onChange={(v) => setToken('lockup-gap', v)} min={0} max={40} />
                      </Section>

                      <Section title="Grid">
                        <SliderControl label="Gap" value={tokens['grid-gap']} onChange={(v) => setToken('grid-gap', v)} min={0} max={80} step={2} />
                        <SliderControl label="Padding X" value={tokens['grid-padding-x']} onChange={(v) => setToken('grid-padding-x', v)} min={0} max={120} step={4} />
                      </Section>

                      <Section title="Tile" defaultOpen={false}>
                        <SliderControl label="Border radius" value={tokens['tile-radius']} onChange={(v) => setToken('tile-radius', v)} min={0} max={32} />
                        <SliderControl label="Hover scale" value={tokens['tile-hover-scale']} onChange={(v) => setToken('tile-hover-scale', v)} min={0.8} max={1.1} step={0.01} unit="" />
                      </Section>

                      <Section title="Perspective" defaultOpen={false}>
                        <SliderControl label="Depth" value={tokens['perspective-distance']} onChange={(v) => setToken('perspective-distance', v)} min={500} max={3000} step={50} />
                        <SliderControl label="Tilt max" value={tokens['perspective-tilt-max']} onChange={(v) => setToken('perspective-tilt-max', v)} min={0} max={90} step={5} unit="deg" />
                      </Section>

                      <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => { if (confirm('Reset all global tokens?')) reset(); }}
                          className="w-full py-2 text-[11px] text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 rounded"
                        >
                          Reset global
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (confirm('Reset ALL element overrides?')) resetAllElements(); }}
                          className="w-full py-2 text-[11px] text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 rounded"
                        >
                          Reset elements ({Object.keys(elements).length})
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'export' && (
                    <div className="flex flex-col gap-3">
                      <p className="text-white/60 leading-relaxed">
                        Copy CSS and paste into <code className="bg-white/10 px-1 rounded">globals.css</code>.
                      </p>
                      <pre className="bg-black/50 border border-white/10 rounded p-2 text-[10px] font-mono text-white/80 overflow-x-auto whitespace-pre-wrap break-all max-h-64">
                        {[exportAsCss(), exportElementsAsCss()].filter(Boolean).join('\n\n') || ':root {\n  /* no overrides */\n}'}
                      </pre>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="w-full py-2 bg-white text-black font-medium text-[11px] rounded hover:bg-white/90 transition-colors"
                      >
                        {copyState === 'copied' ? '✓ Copied' : 'Copy as CSS'}
                      </button>
                    </div>
                  )}

                  {activeTab === 'meta' && (
                    <div className="flex flex-col gap-3 text-[11px]">
                      <div>
                        <h3 className="text-white/70 font-medium mb-1">Modes</h3>
                        <p className="text-white/50 leading-relaxed">
                          <strong>Global</strong> — settings affect all elements with that token<br/>
                          <strong>Inspect</strong> — click any element on page to edit it individually
                        </p>
                      </div>
                      <div>
                        <h3 className="text-white/70 font-medium mb-1">Hotkeys</h3>
                        <div className="text-white/50 space-y-0.5">
                          <div>⌘E — toggle panel</div>
                          <div>I — toggle inspect mode</div>
                          <div>ESC — deselect element</div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white/70 font-medium mb-1">Editable elements</h3>
                        <p className="text-white/50">
                          Elements have <code className="bg-white/10 px-1 rounded text-[10px]">data-edit-id</code> attribute.
                          Click in inspect mode to select and edit individually.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
