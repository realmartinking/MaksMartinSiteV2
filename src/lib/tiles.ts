// Project tiles for Maks Martin portfolio.
// Source of truth — kept in sync with old index.html PROJECTS array.
// All assets live under /public/projects/.

export type TileType = "video" | "image"

export interface Tile {
  /** Stable id for React keys, animations, and analytics. */
  id: string
  /** Display name (multilingual ok). */
  name: string
  /** Filename inside /public/projects/ — case must match disk on Linux/Vercel. */
  file: string
  /** Asset format. */
  type: TileType
  /** Optional case-study href; if absent, tile is decorative. */
  href?: string
}

export const TILES: Tile[] = [
  { id: "aurica",       name: "Aurica",                       file: "aurica.mp4",       type: "video" },
  { id: "aurix",        name: "AURIX",                        file: "aurix.mp4",        type: "video" },
  { id: "forma",        name: "Forma Houseboat",              file: "forma.mp4",        type: "video" },
  { id: "vishnevetsky", name: "General Vishnevetsky's Dacha", file: "vishnevetsky.png", type: "image" },
  { id: "hightbay",     name: "HightBay",                     file: "hightbay.mp4",     type: "video" },
  { id: "humber",       name: "Humber",                       file: "humber.png",       type: "image" },
  { id: "lumio",        name: "Lumio",                        file: "lumio.png",        type: "image" },
  { id: "maoundi",      name: "Maoundi",                      file: "maoundi.mp4",      type: "video" },
  { id: "muse",         name: "Muse",                         file: "muse.png",         type: "image" },
  { id: "raif",         name: "Raif Vision Conference",       file: "raif.mp4",         type: "video" },
  { id: "russia-expo",  name: "Russia Expo 25",               file: "russia-expo.mp4",  type: "video" },
  { id: "saga",         name: "Saga",                         file: "saga.mp4",         type: "video" },
  { id: "semya",        name: "Supermarket Semya",            file: "semya.mp4",        type: "video" },
  { id: "value",        name: "Value",                        file: "value.mp4",        type: "video" },
  { id: "manery",       name: "Манеры",                       file: "manery.mp4",       type: "video" },
  { id: "nasledie",     name: "Наследие",                     file: "nasledie.mp4",     type: "video" },
  { id: "serdtse",      name: "Умное Сердце",                 file: "serdtse.mp4",      type: "video" },
]

/** Convenience accessor. */
export function tileSrc(t: Tile): string {
  return `/projects/${t.file}`
}
