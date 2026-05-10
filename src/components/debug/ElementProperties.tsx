'use client';

import { useEffect, useState, useRef } from 'react';
import { ElementToken, useElements } from '@/lib/useCosmetics';

interface ElementPropertiesProps {
  elementId: string;
  schema: ElementSchema;
  onClose: () => void;
}

export type PropertyType = 'slider' | 'select' | 'text' | 'color';

export interface PropertyDef {
  key: keyof ElementToken;
  label: string;
  type: PropertyType;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  defaultValue?: string;
  help?: string;
}

export interface ElementSchema {
  groups: { title: string; properties: PropertyDef[] }[];
}

export function ElementProperties({ elementId, schema, onClose }: ElementPropertiesProps) {
  const { elements, setElementToken, resetElement } = useElements();
  const token = elements[elementId] || {};

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = parseFloat(token.translateX || '0');
    const startY = parseFloat(token.translateY || '0');
    dragStartRef.current = { x: e.clientX, y: e.clientY, startX, startY };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      setElementToken(elementId, {
        translateX: `${Math.round(start.startX + dx)}px`,
        translateY: `${Math.round(start.startY + dy)}px`,
      });
    };

    const onUp = () => setIsDragging(false);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDragging, elementId, setElementToken]);

  const updateProp = (key: keyof ElementToken, value: string) => {
    setElementToken(elementId, { [key]: value });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div>
          <div className="text-[11px] font-mono text-blue-400">{elementId}</div>
          <div className="text-[10px] text-white/40 mt-0.5">
            {Object.keys(token).length} props edited
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/40 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10"
        >
          deselect
        </button>
      </div>

      {/* Drag handle */}
      <div className="flex flex-col gap-1.5 p-2 rounded bg-white/5 border border-white/10">
        <div className="text-[11px] text-white/70 font-medium">Position (drag below)</div>
        <button
          type="button"
          onPointerDown={startDrag}
          className={`w-full h-12 rounded cursor-move flex items-center justify-center text-[11px] font-mono transition-colors ${
            isDragging ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/15'
          }`}
        >
          {isDragging
            ? 'dragging…'
            : `↔ drag to move (${token.translateX || '0'}, ${token.translateY || '0'})`}
        </button>
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="number"
            placeholder="X"
            value={parseFloat(token.translateX || '0')}
            onChange={(e) => updateProp('translateX', `${e.target.value}px`)}
            className="bg-black/30 border border-white/10 rounded px-2 py-1 text-[11px] text-white font-mono"
          />
          <input
            type="number"
            placeholder="Y"
            value={parseFloat(token.translateY || '0')}
            onChange={(e) => updateProp('translateY', `${e.target.value}px`)}
            className="bg-black/30 border border-white/10 rounded px-2 py-1 text-[11px] text-white font-mono"
          />
        </div>
      </div>

      {/* Property groups */}
      {schema.groups.map((group) => (
        <details key={group.title} open className="group">
          <summary className="cursor-pointer list-none flex items-center justify-between py-1.5 text-[10px] uppercase tracking-wider text-white/50 font-medium hover:text-white/80">
            <span>{group.title}</span>
            <span className="group-open:rotate-90 transition-transform text-[9px]">›</span>
          </summary>
          <div className="flex flex-col gap-2.5 pb-2 pt-1">
            {group.properties.map((prop) => (
              <PropertyControl
                key={prop.key}
                prop={prop}
                value={token[prop.key]}
                onChange={(v) => updateProp(prop.key, v)}
              />
            ))}
          </div>
        </details>
      ))}

      {/* Reset */}
      <button
        type="button"
        onClick={() => {
          if (confirm(`Reset all overrides on ${elementId}?`)) resetElement(elementId);
        }}
        className="mt-2 py-1.5 text-[10px] text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 rounded"
      >
        Reset {elementId}
      </button>
    </div>
  );
}

interface PropertyControlProps {
  prop: PropertyDef;
  value: string | undefined;
  onChange: (value: string) => void;
}

function PropertyControl({ prop, value, onChange }: PropertyControlProps) {
  const currentValue = value ?? prop.defaultValue ?? '';
  const isOverridden = value !== undefined && value !== '';

  if (prop.type === 'slider') {
    const numeric = parseFloat(currentValue) || 0;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <label className={`font-medium ${isOverridden ? 'text-blue-400' : 'text-white/70'}`}>
            {prop.label}
            {isOverridden && <span className="ml-1 text-[8px]">●</span>}
          </label>
          <input
            type="text"
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-16 bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white/90 font-mono text-right"
          />
        </div>
        <input
          type="range"
          min={prop.min ?? 0}
          max={prop.max ?? 100}
          step={prop.step ?? 1}
          value={numeric}
          onChange={(e) => onChange(`${e.target.value}${prop.unit || ''}`)}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:h-3
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:cursor-pointer"
        />
        {prop.help && <p className="text-[9px] text-white/40">{prop.help}</p>}
      </div>
    );
  }

  if (prop.type === 'select') {
    return (
      <div className="flex flex-col gap-1">
        <label className={`text-[11px] font-medium ${isOverridden ? 'text-blue-400' : 'text-white/70'}`}>
          {prop.label}
          {isOverridden && <span className="ml-1 text-[8px]">●</span>}
        </label>
        <div className="grid grid-cols-2 gap-1">
          {prop.options?.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-1.5 py-1 text-[10px] rounded transition-colors ${
                currentValue === opt.value
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (prop.type === 'text') {
    return (
      <div className="flex flex-col gap-1">
        <label className={`text-[11px] font-medium ${isOverridden ? 'text-blue-400' : 'text-white/70'}`}>
          {prop.label}
        </label>
        <input
          type="text"
          value={currentValue}
          placeholder={prop.defaultValue}
          onChange={(e) => onChange(e.target.value)}
          className="bg-black/30 border border-white/10 rounded px-2 py-1 text-[11px] text-white font-mono"
        />
        {prop.help && <p className="text-[9px] text-white/40">{prop.help}</p>}
      </div>
    );
  }

  return null;
}
