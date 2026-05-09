import { BLOCK_W, BLOCK_H, CANVAS_LAYOUT } from "@/lib/canvas"
import { CanvasLockup } from "./CanvasLockup"
import { CanvasTile } from "./CanvasTile"

interface Props {
  /** Stable index 0..8 used for ordering and the centre-block lookup. */
  blockIndex: number
}

/**
 * One repeating cell of the infinite-tiled canvas.
 *
 * The block has fixed design dimensions (BLOCK_W × BLOCK_H). All 9
 * instances render the same layout — that's how the canvas reads as
 * truly endless when the camera pans across the seam.
 *
 * The rendered tree:
 *   .block.block-N   (positioned by InfiniteCanvas via inline transform)
 *     ├ .lockup            ← CanvasLockup (centred Maks/Martin/tagline)
 *     └ .tile × 17         ← CanvasTile (each pinned at its design coord)
 */
export function Block({ blockIndex }: Props) {
  return (
    <div
      className={`block block-${blockIndex} absolute top-0 left-0`}
      style={{ width: BLOCK_W, height: BLOCK_H }}
      data-block-index={blockIndex}
    >
      <CanvasLockup />
      {CANVAS_LAYOUT.map((c, i) => (
        <CanvasTile key={`${blockIndex}-${i}-${c.tile.id}`} {...c} />
      ))}
    </div>
  )
}
