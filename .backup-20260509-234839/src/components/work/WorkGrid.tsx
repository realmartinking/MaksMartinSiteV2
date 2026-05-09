"use client"

import { TILES } from "@/lib/tiles"
import { WorkTile } from "./WorkTile"

/**
 * The scattered project grid.
 *
 * Three columns on desktop, two on tablet, one on phone. Each tile picks
 * its own aspect ratio and may set a vertical offset to break the row
 * baseline (the "scattered" feel referenced from briganti.works).
 *
 * `auto-rows-auto` lets each tile keep its natural height, so rows wrap
 * naturally when one column has more vertical content. Wide/landscape
 * tiles span 2 of the 3 columns for visual contrast.
 */
export function WorkGrid() {
  return (
    <section
      aria-label="Selected work"
      className="
        grid w-full
        grid-cols-1 gap-x-6 gap-y-12
        sm:grid-cols-2
        lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16
      "
    >
      {TILES.map((t, i) => (
        <WorkTile key={t.id} tile={t} index={i + 1} />
      ))}
    </section>
  )
}
