// Frozen state ported from the legacy index.html (`__frozen_v3`).
// This is the single source of truth for the infinite-canvas geometry:
// block size, tile positions inside the block, and the lockup layout.
//
// Coordinate system — all values are in *design pixels*. The render loop
// scales the world by `u = innerWidth / DESIGN_W` so design pixels map
// to viewport pixels at any size.
//
// Origin: the block has size BLOCK_W × BLOCK_H and its top-left corner
// is at (0, 0). The lockup is anchored at the block centre.

import { TILES, type Tile } from "./tiles"

/* ─── Block ─────────────────────────────────────────────── */

export const BLOCK_W = 4003
export const BLOCK_H = 3589

/* ─── Camera tunables (copied from legacy) ──────────────── */

export const PARALLAX_AMPLITUDE = 60
export const PARALLAX_EASE = 0.08
export const CAM_EASE = 0.11

/* ─── Lockup layout ─────────────────────────────────────── */

/** Emblem geometry, in design units, anchored to lockup centre. */
export const EMBLEM = {
  w: 400,
  h: 400,
  dx: -6,
  dy: -5,
} as const

/** Two stacked wordmarks ("Maks" / "Martin"). Coordinates are relative
 *  to the block centre (lockup origin). Values from the saved layout.   */
export const WORDMARKS = [
  { id: "name-maks",   text: "Maks",   x: 88, y: -182, fontSize: 60, weight: 700, lineHeight: 0.8 },
  { id: "name-martin", text: "Martin", x: 88, y: -134, fontSize: 60, weight: 700, lineHeight: 0.8 },
] as const

/** Tagline. Coordinates relative to lockup origin. */
export const TAGLINE = {
  text: "Timeless design,\nlike classical music,\nlove and money",
  x: 85,
  y: 63,
  width: 134,
  fontSize: 15,
  weight: 700,
  align: "left" as const,
}

/** Optional global lockup offset from block centre. Legacy preserves it. */
export const LOCKUP_OFFSET = { x: 0, y: 0 } as const

/* ─── Tile placement (17 entries) ───────────────────────── */

/**
 * Order matches `layout` in the frozen state. `pi` is the original
 * project index (PROJECTS array in the legacy index.html). We turn it
 * into a Tile id with the table below so the rest of the codebase can
 * keep using the typed `Tile` model.
 */
const PI_TO_ID: Record<number, string> = {
  0:  "aurica",
  1:  "aurix",
  2:  "forma",
  3:  "vishnevetsky",
  4:  "hightbay",
  5:  "humber",
  6:  "lumio",
  7:  "maoundi",
  8:  "muse",
  9:  "raif",
  10: "russia-expo",
  11: "saga",
  12: "semya",
  13: "value",
  14: "manery",
  15: "nasledie",
  16: "serdtse",
}

export interface CanvasTile {
  /** Reference to the Tile in lib/tiles.ts (image/video metadata, name). */
  tile: Tile
  /** Top-left X in design pixels, relative to the block. */
  x: number
  /** Top-left Y in design pixels, relative to the block. */
  y: number
  /** Width in design pixels. */
  w: number
  /** Height in design pixels. */
  h: number
}

/** Frozen layout — 17 tiles. */
const RAW_LAYOUT: { x: number; y: number; w: number; h: number; pi: number }[] = [
  { x: 897.0006472124528,  y: 93.23352746336695,  w: 541.3392857142858, h: 336.20089285714283, pi: 14 },
  { x: 3139.6816100104124, y: 310.13591876165447, w: 609.8363095238096, h: 373.2730654761905,  pi: 4  },
  { x: 2350.1644345238096, y: 2105.3274542941554, w: 602.671130952381,  h: 395.1927083333333,  pi: 0  },
  { x: 1361.4739583333333, y: 683.408984237845,   w: 560.0520833333334, h: 348.3846726190476,  pi: 13 },
  { x: 1078.0032960635262, y: 2264.6601368907045, w: 302,                h: 340,                 pi: 8  },
  { x: 2454.714669820319,  y: 2834.909027669858,  w: 544.4791666666666, h: 366.64732142857144, pi: 5  },
  { x: 51.7152256335537,   y: 496.7724514997497,  w: 497.1019345238095, h: 332.1160714285714,  pi: 1  },
  { x: 1580.8931034980997, y: 2556.3216940648986, w: 642.9203869047619, h: 369.2366071428571,  pi: 16 },
  { x: 3234.923253050795,  y: 1193.3196078070387, w: 273.87276785714283, h: 434.8794642857143,  pi: 15 },
  { x: 700.5136392123856,  y: 2961.7836566586543, w: 580,                h: 326,                 pi: 11 },
  { x: 3491.107776860319,  y: 3018.232688384144,  w: 323.8154761904762,  h: 423.984375,          pi: 3  },
  { x: 2041.9252890018743, y: 310.13591876165447, w: 580,                h: 326,                 pi: 6  },
  { x: 2287.088309147163,  y: 1030.3196078070387, w: 580,                h: 326,                 pi: 2  },
  { x: 867.2632161979501,  y: 1248.3415572118006, w: 527.9947916666666,  h: 324.8355654761905,  pi: 9  },
  { x: 320.07679546810243, y: 2266.691758914514,  w: 513.8876488095239,  h: 335.93675595238096, pi: 12 },
  { x: 3234.923253050795,  y: 1790.5182461151744, w: 580,                h: 326,                 pi: 7  },
  { x: 320.07679546810243, y: 1649.196817543746,  w: 431.0453869047619,  h: 467.3214285714286,  pi: 10 },
]

const tilesById = new Map(TILES.map((t) => [t.id, t]))

export const CANVAS_LAYOUT: CanvasTile[] = RAW_LAYOUT.map((r) => {
  const id = PI_TO_ID[r.pi]
  const tile = tilesById.get(id)
  if (!tile) throw new Error(`Unknown tile id "${id}" for pi=${r.pi}`)
  return { tile, x: r.x, y: r.y, w: r.w, h: r.h }
})
