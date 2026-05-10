'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useCosmetics } from '@/lib/useCosmetics';
import { Section, SliderControl, SelectControl } from './Controls';

const TOKEN = 'maks2026';

export function DebugPanel() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'edit' | 'export' | 'meta'>('edit');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const { tokens, setToken, reset, exportAsCss, exportAsJson, importFromJson, isLoaded } = useCosmetics();
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
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAuthorized]);

  if (!isAuthorized || !isLoaded) return null;

  const handleCopy = async () => {
    const css = exportAsCss();
    try {
      await navigator.clipboard.writeText(css);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = css;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-4 right-4 z-[10000] px-3 py-2 bg-black/90 text-white text-[11px] rounded-lg backdrop-blur-md border border-white/10 hover:bg-black"
            title="Open debug panel (⌘E)"
          >
            ◐ Edit
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-4 right-4 z-[10000] w-[300px] max-h-[calc(100vh-32px)] bg-black/95 backdrop-blur-xl text-white rounded-xl border border-white/10 shadow-2xl flex flex-col"
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wide uppercase opacity-70">Debug</span>
                <span className="text-[10px] opacity-40">⌘E</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex border-b border-white/10 text-[11px]">
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

            <div className="flex-1 overflow-y-auto p-3 text-[11px]">
              {activeTab === 'edit' && (
                <div className="flex flex-col gap-1">
                  <Section title="Theme">
                    <SelectControl
                      label="Mode"
                      value={(theme === 'system' ? resolvedTheme : theme) || 'light'}
                      onChange={setTheme}
                      options={[
                        { label: 'Light', value: 'light' },
                        { label: 'Dark', value: 'dark' },
                      ]}
                    />
                  </Section>

                  <Section title="Header Lockup">
                    <SliderControl label="Emblem size" value={tokens['lockup-emblem-size']} onChange={(v) => setToken('lockup-emblem-size', v)} min={30} max={120} step={2} />
                    <SliderControl label="Name size" value={tokens['lockup-name-size']} onChange={(v) => setToken('lockup-name-size', v)} min={10} max={40} />
                    <SliderControl label="Name weight" value={tokens['lockup-name-weight']} onChange={(v) => setToken('lockup-name-weight', v)} min={300} max={900} step={100} unit="" />
                    <SliderControl label="Tagline size" value={tokens['lockup-tagline-size']} onChange={(v) => setToken('lockup-tagline-size', v)} min={9} max={20} />
                    <SliderControl label="Tagline width" value={tokens['lockup-tagline-max-width']} onChange={(v) => setToken('lockup-tagline-max-width', v)} min={150} max={400} step={5} />
                    <SliderControl label="Gap between" value={tokens['lockup-gap']} onChange={(v) => setToken('lockup-gap', v)} min={0} max={40} />
                    <SliderControl label="Padding from edge" value={tokens['lockup-padding']} onChange={(v) => setToken('lockup-padding', v)} min={8} max={80} step={2} />
                  </Section>

                  <Section title="Grid">
                    <SliderControl label="Gap between tiles" value={tokens['grid-gap']} onChange={(v) => setToken('grid-gap', v)} min={0} max={80} step={2} />
                    <SliderControl label="Padding X (sides)" value={tokens['grid-padding-x']} onChange={(v) => setToken('grid-padding-x', v)} min={0} max={120} step={4} />
                  </Section>

                  <Section title="Tile">
                    <SliderControl label="Border radius" value={tokens['tile-radius']} onChange={(v) => setToken('tile-radius', v)} min={0} max={32} />
                    <SliderControl label="Hover scale" value={tokens['tile-hover-scale']} onChange={(v) => setToken('tile-hover-scale', v)} min={0.8} max={1.1} step={0.01} unit="" help="0.95 = shrink on hover (emele style)" />
                  </Section>

                  <Section title="Perspective" defaultOpen={false}>
                    <SliderControl label="Depth" value={tokens['perspective-distance']} onChange={(v) => setToken('perspective-distance', v)} min={500} max={3000} step={50} help="Smaller = stronger perspective" />
                    <SliderControl label="Tilt max" value={tokens['perspective-tilt-max']} onChange={(v) => setToken('perspective-tilt-max', v)} min={0} max={90} step={5} unit="deg" />
                    <SliderControl label="Push back (Z)" value={tokens['perspective-translate-z']} onChange={(v) => setToken('perspective-translate-z', v)} min={-500} max={0} step={10} />
                  </Section>

                  <Section title="Typography" defaultOpen={false}>
                    <SliderControl label="Tile name size" value={tokens['font-tile-name-size']} onChange={(v) => setToken('font-tile-name-size', v)} min={10} max={24} />
                    <SliderControl label="Tile name weight" value={tokens['font-tile-name-weight']} onChange={(v) => setToken('font-tile-name-weight', v)} min={300} max={900} step={100} unit="" />
                    <SliderControl label="Tile meta size" value={tokens['font-tile-meta-size']} onChange={(v) => setToken('font-tile-meta-size', v)} min={9} max={16} />
                    <SliderControl label="Nav font size" value={tokens['view-switcher-font-size']} onChange={(v) => setToken('view-switcher-font-size', v)} min={10} max={24} />
                  </Section>

                  <div className="pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => { if (confirm('Reset all to defaults?')) reset(); }}
                      className="w-full py-2 text-[11px] text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 rounded transition-colors"
                    >
                      Reset to defaults
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'export' && (
                <div className="flex flex-col gap-3">
                  <p className="text-white/60 leading-relaxed">
                    Copy this CSS block and paste into <code className="bg-white/10 px-1 rounded">src/app/globals.css</code> inside <code className="bg-white/10 px-1 rounded">:root {'{'}</code> to make changes permanent.
                  </p>

                  <pre className="bg-black/50 border border-white/10 rounded p-2 text-[10px] font-mono text-white/80 overflow-x-auto whitespace-pre-wrap break-all">
                    {exportAsCss()}
                  </pre>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full py-2 bg-white text-black font-medium text-[11px] rounded hover:bg-white/90 transition-colors"
                  >
                    {copyState === 'copied' ? '✓ Copied to clipboard' : 'Copy as CSS'}
                  </button>

                  <details className="text-[10px]">
                    <summary className="cursor-pointer text-white/50 hover:text-white/80">Advanced: JSON export/import</summary>
                    <div className="flex flex-col gap-2 mt-2">
                      <textarea
                        defaultValue={exportAsJson()}
                        className="w-full h-32 bg-black/50 border border-white/10 rounded p-2 text-[10px] font-mono text-white/80"
                        onBlur={(e) => {
                          if (e.target.value !== exportAsJson()) {
                            try { importFromJson(e.target.value); } catch { alert('Invalid JSON'); }
                          }
                        }}
                      />
                      <p className="text-white/40">Edit JSON and blur to apply</p>
                    </div>
                  </details>
                </div>
              )}

              {activeTab === 'meta' && (
                <div className="flex flex-col gap-3 text-[11px]">
                  <div>
                    <h3 className="text-white/70 font-medium mb-1">About this panel</h3>
                    <p className="text-white/50 leading-relaxed">
                      Visual debug panel for fine-tuning cosmetic parameters. Only modifies CSS variables — never touches DOM structure. Safe to use, can&apos;t break the site.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-white/70 font-medium mb-1">Workflow</h3>
                    <ol className="text-white/50 space-y-1 list-decimal pl-4">
                      <li>Tweak values in Edit tab</li>
                      <li>Changes auto-save to localStorage</li>
                      <li>When happy → Export tab → Copy CSS</li>
                      <li>Paste into globals.css to make permanent</li>
                      <li>Reset to clear localStorage</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-white/70 font-medium mb-1">Hotkeys</h3>
                    <div className="text-white/50 space-y-0.5">
                      <div>⌘E — toggle panel</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white/70 font-medium mb-1">Access</h3>
                    <p className="text-white/50">
                      URL: <code className="bg-white/10 px-1 rounded">?edit=maks2026</code><br/>
                      Without token, panel does not render.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
