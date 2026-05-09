import { InfiniteCanvas } from "@/components/canvas/InfiniteCanvas"
import { EmblemOverlay } from "@/components/canvas/EmblemOverlay"
import { Chrome } from "@/components/chrome/Chrome"

/**
 * Home — the infinite, drag-and-pan canvas of selected work.
 *
 * Three layered components:
 *   1. <InfiniteCanvas/>  — full-viewport stage; 9-block tiling; rAF loop.
 *   2. <EmblemOverlay/>   — fixed emblem video tracking the centre block.
 *   3. <Chrome/>          — top nav + theme toggle; pointer-events:none
 *                            on the wrapper so the canvas stays grabbable.
 */
export default function Home() {
  return (
    <>
      <InfiniteCanvas />
      <EmblemOverlay />
      <Chrome />
    </>
  )
}
