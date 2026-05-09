"use client"

import { useEffect, useRef } from "react"
import {
  BLOCK_W,
  BLOCK_H,
  CAM_EASE,
  PARALLAX_AMPLITUDE,
  PARALLAX_EASE,
} from "@/lib/canvas"
import { Block } from "./Block"

/**
 * Endlessly pannable, infinitely tiled canvas.
 *
 * Mechanics ported one-to-one from the legacy index.html (`__frozen_v3`):
 *
 *   1. **Camera state** is mutable refs (camX/Y, targetX/Y, parallaxX/Y).
 *      We bypass React state intentionally — the render loop runs at
 *      60fps and would thrash reconciliation; CSS transforms are the
 *      only thing changing per frame.
 *
 *   2. **Pointer drag** updates `targetX/Y` directly. Sign is inverted:
 *      dragging right pulls the world right, so the camera moves left.
 *
 *   3. **Wheel** also feeds `targetX/Y` (deltaX/deltaY divided by `u`).
 *
 *   4. **Parallax** comes from mouse position (mouseNX/Y normalised to
 *      −1..1 across the viewport). Eased with PARALLAX_EASE = 0.08.
 *
 *   5. **Render loop** writes two transforms per frame:
 *        a) the world wrapper gets `translate3d(tx, ty, 0) scale(u)`
 *           where `u = innerWidth / DESIGN_W`. This is the global pan.
 *        b) each of the 9 blocks gets a `translate3d(...)` that snaps
 *           its position to the camera's nearest block and offsets by
 *           ±BLOCK_W / ±BLOCK_H. As the camera crosses a block edge,
 *           a block jumps to the opposite side — invisible because
 *           every block holds the same content. That's the modulo
 *           tiling that makes the infinite scroll possible.
 *
 *   6. The centre block (index 4) is always closest to screen centre.
 *      `<EmblemOverlay>` reads its `.lockup-emblem` rect each frame
 *      to position the actual emblem video on top of the canvas.
 */
export function InfiniteCanvas({
  designWidth = 1440,
}: {
  /** Design-width that drives the `u` unit. 1440 desktop, 600 mobile. */
  designWidth?: number
}) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const worldRef = useRef<HTMLDivElement | null>(null)
  const blockRefs = useRef<(HTMLDivElement | null)[]>([])

  // Camera + parallax state in mutable refs so the rAF loop avoids
  // React re-render cost.
  const cam = useRef({
    x: 0, y: 0,
    tx: 0, ty: 0,
    px: 0, py: 0,
    mnx: 0, mny: 0,
  })

  const drag = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
  })

  useEffect(() => {
    const stage = stageRef.current
    const world = worldRef.current
    if (!stage || !world) return

    /* ─── unit factor ───────────────────────────────────────── */
    const getU = () => {
      const designW = window.innerWidth <= 768 ? 600 : designWidth
      return window.innerWidth / designW
    }

    /* ─── input handlers ────────────────────────────────────── */

    const onPointerDown = (e: PointerEvent) => {
      drag.current.dragging = true
      drag.current.lastX = e.clientX
      drag.current.lastY = e.clientY
      stage.classList.add("dragging")
      try { stage.setPointerCapture(e.pointerId) } catch { /* noop */ }
    }

    const endPointer = (e: PointerEvent) => {
      if (!drag.current.dragging) return
      drag.current.dragging = false
      stage.classList.remove("dragging")
      try { stage.releasePointerCapture(e.pointerId) } catch { /* noop */ }
    }

    const onPointerMove = (e: PointerEvent) => {
      cam.current.mnx = (e.clientX / window.innerWidth) * 2 - 1
      cam.current.mny = (e.clientY / window.innerHeight) * 2 - 1
      if (!drag.current.dragging) return
      const u = getU()
      cam.current.tx -= (e.clientX - drag.current.lastX) / u
      cam.current.ty -= (e.clientY - drag.current.lastY) / u
      drag.current.lastX = e.clientX
      drag.current.lastY = e.clientY
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const u = getU()
      cam.current.tx += e.deltaX / u
      cam.current.ty += e.deltaY / u
    }

    stage.addEventListener("pointerdown", onPointerDown)
    stage.addEventListener("pointermove", onPointerMove)
    stage.addEventListener("pointerup", endPointer)
    stage.addEventListener("pointercancel", endPointer)
    stage.addEventListener("pointerleave", endPointer)
    stage.addEventListener("wheel", onWheel, { passive: false })

    /* ─── render loop ───────────────────────────────────────── */

    let frameId = 0

    const render = () => {
      const u = getU()
      const c = cam.current

      // Ease parallax toward target (mouseNX × amplitude).
      c.px += (c.mnx * PARALLAX_AMPLITUDE - c.px) * PARALLAX_EASE
      c.py += (c.mny * PARALLAX_AMPLITUDE - c.py) * PARALLAX_EASE
      // Ease camera toward target.
      c.x += (c.tx - c.x) * CAM_EASE
      c.y += (c.ty - c.y) * CAM_EASE

      const vw = window.innerWidth
      const vh = window.innerHeight
      const tx = (-c.x - c.px) * u + vw / 2
      const ty = (-c.y - c.py) * u + vh / 2

      world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${u})`
      world.style.transformOrigin = "0 0"

      // Snap base block to the camera's nearest block, then tile 3×3.
      const baseBX = Math.round(c.x / BLOCK_W) * BLOCK_W
      const baseBY = Math.round(c.y / BLOCK_H) * BLOCK_H

      let i = 0
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const node = blockRefs.current[i++]
          if (!node) continue
          const bx = baseBX + ox * BLOCK_W - BLOCK_W / 2
          const by = baseBY + oy * BLOCK_H - BLOCK_H / 2
          node.style.transform = `translate3d(${bx}px, ${by}px, 0)`
        }
      }

      frameId = requestAnimationFrame(render)
    }
    frameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frameId)
      stage.removeEventListener("pointerdown", onPointerDown)
      stage.removeEventListener("pointermove", onPointerMove)
      stage.removeEventListener("pointerup", endPointer)
      stage.removeEventListener("pointercancel", endPointer)
      stage.removeEventListener("pointerleave", endPointer)
      stage.removeEventListener("wheel", onWheel as EventListener)
    }
  }, [designWidth])

  return (
    <div
      ref={stageRef}
      className="stage fixed inset-0 overflow-hidden cursor-grab touch-none bg-bg"
      style={{ touchAction: "none" }}
    >
      <div
        ref={worldRef}
        className="absolute inset-0 will-change-transform"
      >
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            ref={(el) => { blockRefs.current[i] = el }}
            className="absolute top-0 left-0 will-change-transform"
            style={{ width: BLOCK_W, height: BLOCK_H }}
          >
            <Block blockIndex={i} />
          </div>
        ))}
      </div>
    </div>
  )
}
