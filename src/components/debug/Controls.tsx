'use client';

import { ReactNode } from 'react';

interface SliderControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  help?: string;
}

export function SliderControl({ label, value, onChange, min, max, step = 1, unit = 'px', help }: SliderControlProps) {
  const numeric = parseFloat(value) || 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <label className="text-white/70 font-medium">{label}</label>
        <span className="text-white/90 font-mono tabular-nums">{numeric}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numeric}
        onChange={(e) => onChange(`${e.target.value}${unit}`)}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-white
                   [&::-webkit-slider-thumb]:cursor-pointer"
      />
      {help && <p className="text-[10px] text-white/40 leading-tight">{help}</p>}
    </div>
  );
}

interface SelectControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  help?: string;
}

export function SelectControl({ label, value, onChange, options, help }: SelectControlProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <label className="text-white/70 font-medium">{label}</label>
        <span className="text-white/90 font-mono">{value}</span>
      </div>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-2 py-1 text-[11px] rounded transition-colors ${
              value === opt.value
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {help && <p className="text-[10px] text-white/40 leading-tight">{help}</p>}
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Section({ title, children, defaultOpen = true }: SectionProps) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="cursor-pointer list-none flex items-center justify-between py-2 text-[11px] uppercase tracking-wider text-white/50 font-medium hover:text-white/80 transition-colors">
        <span>{title}</span>
        <span className="group-open:rotate-90 transition-transform">›</span>
      </summary>
      <div className="flex flex-col gap-3 pb-3 pl-1">
        {children}
      </div>
    </details>
  );
}
