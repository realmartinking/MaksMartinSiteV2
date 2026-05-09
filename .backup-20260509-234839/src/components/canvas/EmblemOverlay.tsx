"use client"

import { useEffect, useRef } from "react"

/**
 * Emblem overlay — a fixed DOM node positioned to track the centre
 * block's `.lockup-emblem` anchor every frame.
 *
 * Why an overlay? The 9-block tiling means the emblem element actually
 * lives inside *every* block. Rendering nine simultaneous emblem videos
 * would be wasteful and would also produce subtle seams when the
 * camera crosses a tile boundary. Instead we draw the emblem ONCE,
 * fixed to the page, and snap it onto the nearest visible instance.
 *
 * The legacy implementation used a `<canvas>` that sampled frames from
 * the source video through SVG colour-matrix filters. We use a plainer
 * `<video>` + `mix-blend-mode` here (same approach as Phase 2): same
 * visible result, no extra rAF copy step, and no Chrome-specific
 * filter-on-video quirks.
 */
export function EmblemOverlay() {
  const overlayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let frameId = 0

    const sync = () => {
      const overlay = overlayRef.current
      if (overlay) {
        // BLOCKS[4] is the centre instance — same convention as legacy.
        const centerBlock = document.querySelector('[data-block-index="4"]')
        const anchor = centerBlock?.querySelector(".lockup-emblem") as HTMLElement | null
        if (anchor) {
          const r = anchor.getBoundingClientRect()
          overlay.style.left = `${r.left}px`
          overlay.style.top = `${r.top}px`
          overlay.style.width = `${r.width}px`
          overlay.style.height = `${r.height}px`
        }
      }
      frameId = requestAnimationFrame(sync)
    }
    frameId = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="fixed pointer-events-none z-30"
      style={{ left: 0, top: 0, width: 0, height: 0 }}
    >
      {/* Light variant — black ink on white field, multiplied onto bg. */}
      <video
        className="absolute inset-0 h-full w-full object-contain block dark:hidden"
        style={{ mixBlendMode: "multiply" }}
        src="/MaksMartinLogo.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      {/* Dark variant — light ink on black field, screened onto bg. */}
      <video
        className="absolute inset-0 h-full w-full object-contain hidden dark:block"
        style={{ mixBlendMode: "screen" }}
        src="/MaksMartinLogoBlack.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
    </div>
  )
}
