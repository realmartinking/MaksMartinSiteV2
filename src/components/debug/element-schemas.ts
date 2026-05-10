import type { ElementSchema } from './ElementProperties';

/**
 * Реестр элементов которые можно редактировать.
 * Key = data-edit-id, value = схема разрешённых свойств.
 */

const TYPOGRAPHY_FULL: ElementSchema['groups'][0] = {
  title: 'Typography',
  properties: [
    { key: 'fontSize', label: 'Font size', type: 'slider', unit: 'px', min: 8, max: 120, step: 1, defaultValue: '36px' },
    { key: 'fontWeight', label: 'Weight', type: 'slider', unit: '', min: 100, max: 900, step: 100, defaultValue: '700' },
    {
      key: 'letterSpacing', label: 'Letter spacing', type: 'slider', unit: 'em',
      min: -0.1, max: 0.3, step: 0.005, defaultValue: '0em',
      help: 'Negative = tighter, positive = wider',
    },
    { key: 'lineHeight', label: 'Line height', type: 'slider', unit: '', min: 0.7, max: 2, step: 0.05, defaultValue: '1.1' },
    {
      key: 'fontStyle', label: 'Style', type: 'select',
      options: [{ label: 'Normal', value: 'normal' }, { label: 'Italic', value: 'italic' }],
      defaultValue: 'normal',
    },
    {
      key: 'textTransform', label: 'Case', type: 'select',
      options: [{ label: 'aA', value: 'none' }, { label: 'AA', value: 'uppercase' }],
      defaultValue: 'none',
    },
    {
      key: 'textAlign', label: 'Align', type: 'select',
      options: [{ label: 'L', value: 'left' }, { label: 'C', value: 'center' }, { label: 'R', value: 'right' }],
      defaultValue: 'left',
    },
  ],
};

const CONTAINER_FULL: ElementSchema['groups'][0] = {
  title: 'Container',
  properties: [
    { key: 'maxWidth', label: 'Max width', type: 'text', defaultValue: '100%', help: 'Try: 6ch, 12ch, 280px' },
    { key: 'opacity', label: 'Opacity', type: 'slider', unit: '', min: 0, max: 1, step: 0.05, defaultValue: '1' },
  ],
};

const SPACING_FULL: ElementSchema['groups'][0] = {
  title: 'Spacing',
  properties: [
    { key: 'paddingTop',    label: 'Padding top',    type: 'slider', unit: 'px', min: 0,   max: 80, step: 1, defaultValue: '0px' },
    { key: 'paddingRight',  label: 'Padding right',  type: 'slider', unit: 'px', min: 0,   max: 80, step: 1, defaultValue: '0px' },
    { key: 'paddingBottom', label: 'Padding bottom', type: 'slider', unit: 'px', min: 0,   max: 80, step: 1, defaultValue: '0px' },
    { key: 'paddingLeft',   label: 'Padding left',   type: 'slider', unit: 'px', min: 0,   max: 80, step: 1, defaultValue: '0px' },
    { key: 'marginTop',     label: 'Margin top',     type: 'slider', unit: 'px', min: -80, max: 80, step: 1, defaultValue: '0px' },
    { key: 'marginBottom',  label: 'Margin bottom',  type: 'slider', unit: 'px', min: -80, max: 80, step: 1, defaultValue: '0px' },
  ],
};

const SIZE_BLOCK: ElementSchema['groups'][0] = {
  title: 'Size',
  properties: [
    { key: 'width',  label: 'Width',  type: 'text', defaultValue: 'auto', help: 'auto, 100%, 200px, 50vw' },
    { key: 'height', label: 'Height', type: 'text', defaultValue: 'auto' },
  ],
};

export const ELEMENT_SCHEMAS: Record<string, ElementSchema> = {
  'lockup-name': {
    groups: [TYPOGRAPHY_FULL, CONTAINER_FULL, SPACING_FULL],
  },
  'lockup-tagline': {
    groups: [TYPOGRAPHY_FULL, CONTAINER_FULL, SPACING_FULL],
  },
  'lockup-emblem': {
    groups: [SIZE_BLOCK, SPACING_FULL],
  },
  'lockup-buttons': {
    groups: [SPACING_FULL],
  },
  'view-switcher': {
    groups: [TYPOGRAPHY_FULL, SPACING_FULL],
  },
};

/** Fallback универсальный если элемента нет в реестре */
export const FALLBACK_SCHEMA: ElementSchema = {
  groups: [TYPOGRAPHY_FULL, CONTAINER_FULL, SPACING_FULL, SIZE_BLOCK],
};
