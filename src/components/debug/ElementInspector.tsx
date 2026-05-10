'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ElementInspectorProps {
  /** Активен ли inspector mode */
  isActive: boolean;
  /** Текущий выбранный element ID или null */
  selectedId: string | null;
  /** Колбэк при выборе элемента */
  onSelect: (id: string | null) => void;
}

/**
 * Inspector overlay: при isActive=true показывает обводку при hover на элементах
 * с атрибутом data-edit-id, и при клике вызывает onSelect(id).
 */
export function ElementInspector({ isActive, selectedId, onSelect }: ElementInspectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);

  // Обновляем rect выбранного элемента при scroll/resize
  const updateRects = useCallback(() => {
    if (selectedId) {
      const el = document.querySelector(`[data-edit-id="${selectedId}"]`);
      if (el) setSelectedRect(el.getBoundingClientRect());
    } else {
      setSelectedRect(null);
    }
  }, [selectedId]);

  useEffect(() => {
    updateRects();
    if (!isActive) return;

    window.addEventListener('scroll', updateRects, true);
    window.addEventListener('resize', updateRects);
    const interval = setInterval(updateRects, 200);

    return () => {
      window.removeEventListener('scroll', updateRects, true);
      window.removeEventListener('resize', updateRects);
      clearInterval(interval);
    };
  }, [isActive, updateRects]);

  // Hover + click handlers
  useEffect(() => {
    if (!isActive) {
      setHoveredId(null);
      setHoverRect(null);
      return;
    }

    const onMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-edit-id]');
      if (target) {
        const id = target.getAttribute('data-edit-id');
        setHoveredId(id);
        setHoverRect(target.getBoundingClientRect());
      } else {
        setHoveredId(null);
        setHoverRect(null);
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-edit-id]');
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        const id = target.getAttribute('data-edit-id');
        if (id) onSelect(id);
      }
    };

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('click', onClick, true);

    return () => {
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('click', onClick, true);
    };
  }, [isActive, onSelect]);

  if (!isActive && !selectedRect) return null;

  return (
    <>
      {/* Hover outline */}
      <AnimatePresence>
        {isActive && hoverRect && hoveredId !== selectedId && (
          <motion.div
            key="hover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              top: hoverRect.top - 2,
              left: hoverRect.left - 2,
              width: hoverRect.width + 4,
              height: hoverRect.height + 4,
              border: '1.5px dashed #3b82f6',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 9998,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -22,
                left: 0,
                background: '#3b82f6',
                color: 'white',
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 3,
                whiteSpace: 'nowrap',
                fontFamily: 'monospace',
              }}
            >
              {hoveredId}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected outline */}
      <AnimatePresence>
        {selectedRect && (
          <motion.div
            key="selected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: selectedRect.top - 2,
              left: selectedRect.left - 2,
              width: selectedRect.width + 4,
              height: selectedRect.height + 4,
              border: '2px solid #3b82f6',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 9999,
              boxShadow: '0 0 0 1px rgba(59,130,246,0.2)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -24,
                left: 0,
                background: '#3b82f6',
                color: 'white',
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                fontFamily: 'monospace',
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
            >
              {selectedId} ×
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
