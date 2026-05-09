// Project tiles for Maks Martin portfolio.
// Source of truth — kept in sync with old index.html PROJECTS array.
// All assets live under /public/projects/.

export type TileType = "video" | "image"

/**
 * Visual size of a tile in the scattered grid.
 *
 * The grid is 3 columns wide on desktop. Each shape maps to:
 *   • aspectRatio   — width / height for the tile box
 *   • colSpan       — how many of the 3 columns the tile takes
 *
 *   square   → 1:1, 1 col
 *   portrait → 3:4, 1 col
 *   tall     → 9:16, 1 col
 *   landscape→ 4:3, 1 col
 *   wide     → 16:9, 2 cols (spans across two columns for visual punch)
 */
export type TileShape = "square" | "portrait" | "tall" | "landscape" | "wide"

export interface Tile {
  /** Stable id for React keys, animations, and analytics. */
  id: string
  /** Display name (multilingual ok). */
  name: string
  /** Filename inside /public/projects/ — case must match disk on Linux/Vercel. */
  file: string
  /** Asset format. */
  type: TileType
  /** Visual proportions in the grid. */
  shape: TileShape
  /**
   * Optional vertical offset in design-units to break the row baseline.
   * Positive = pushes tile down within its grid cell. 0–80 reads natural.
   */
  offsetY?: number
  /** Optional case-study href; if absent, tile is decorative. */
  href?: string
  /** Optional list of category labels (for future filter UI). */
  topics?: string[]
}

/**
 * 17 projects, ordered for visual rhythm in the scattered grid:
 * mix of orientations across each row of three.
 *
 * Ordering principles:
 *   • Avoid two `wide` (2-col) tiles in the same logical row.
 *   • Alternate orientations so the eye moves vertically as well as across.
 *   • Heaviest hero piece (Forma) first — it's a strong landscape video.
 */
export const TILES: Tile[] = [
  { id: "forma",        name: "Forma Houseboat",              file: "forma.mp4",        type: "video", shape: "wide",      topics: ["Identity", "Motion"] },
  { id: "aurica",       name: "Aurica",                       file: "aurica.mp4",       type: "video", shape: "portrait",  offsetY: 32, topics: ["Identity"] },
  { id: "vishnevetsky", name: "General Vishnevetsky's Dacha", file: "vishnevetsky.png", type: "image", shape: "tall",      topics: ["Identity"] },
  { id: "raif",         name: "Raif Vision Conference",       file: "raif.mp4",         type: "video", shape: "landscape", offsetY: 56, topics: ["Event", "Motion"] },
  { id: "muse",         name: "Muse",                         file: "muse.png",         type: "image", shape: "square",    topics: ["Identity"] },
  { id: "saga",         name: "Saga",                         file: "saga.mp4",         type: "video", shape: "portrait",  offsetY: 24, topics: ["Identity", "Motion"] },
  { id: "russia-expo",  name: "Russia Expo 25",               file: "russia-expo.mp4",  type: "video", shape: "wide",      topics: ["Event", "Motion"] },
  { id: "humber",       name: "Humber",                       file: "humber.png",       type: "image", shape: "portrait",  offsetY: 40, topics: ["Identity"] },
  { id: "aurix",        name: "AURIX",                        file: "aurix.mp4",        type: "video", shape: "square",    topics: ["Identity", "Motion"] },
  { id: "lumio",        name: "Lumio",                        file: "lumio.png",        type: "image", shape: "tall",      offsetY: 48, topics: ["Identity"] },
  { id: "hightbay",     name: "HightBay",                     file: "hightbay.mp4",     type: "video", shape: "landscape", topics: ["Identity", "Motion"] },
  { id: "manery",       name: "Манеры",                       file: "manery.mp4",       type: "video", shape: "square",    offsetY: 64, topics: ["Identity", "Motion"] },
  { id: "value",        name: "Value",                        file: "value.mp4",        type: "video", shape: "portrait",  topics: ["Identity", "Motion"] },
  { id: "nasledie",     name: "Наследие",                     file: "nasledie.mp4",     type: "video", shape: "wide",      offsetY: 32, topics: ["Identity", "Motion"] },
  { id: "semya",        name: "Supermarket Semya",            file: "semya.mp4",        type: "video", shape: "square",    topics: ["Identity", "Motion"] },
  { id: "maoundi",      name: "Maoundi",                      file: "maoundi.mp4",      type: "video", shape: "tall",      offsetY: 24, topics: ["Identity", "Motion"] },
  { id: "serdtse",      name: "Умное Сердце",                 file: "serdtse.mp4",      type: "video", shape: "landscape", topics: ["Identity", "Motion"] },
]

/** Public asset path for a tile. */
export function tileSrc(t: Tile): string {
  return `/projects/${t.file}`
}

/** CSS aspect-ratio value for a shape. */
export function tileAspectRatio(shape: TileShape): string {
  switch (shape) {
    case "square":    return "1 / 1"
    case "portrait":  return "3 / 4"
    case "tall":      return "9 / 16"
    case "landscape": return "4 / 3"
    case "wide":      return "16 / 9"
  }
}

/** Column span for a shape (1 or 2 of the 3-col grid). */
export function tileColSpan(shape: TileShape): 1 | 2 {
  return shape === "wide" || shape === "landscape" ? 2 : 1
}
