import { WORDMARKS, TAGLINE, EMBLEM, LOCKUP_OFFSET } from "@/lib/canvas"

/**
 * Lockup as it appears INSIDE a single block of the infinite canvas.
 *
 * Coordinates are in *design pixels* — the world is scaled by `u` at
 * the render-loop level, so we just place children with absolute
 * positioning relative to the block's centre.
 *
 * The actual emblem media (the spinning bull/mermaid video) is rendered
 * separately by `<EmblemOverlay>` as a fixed DOM node above the canvas.
 * Here we only reserve a sized & class-tagged anchor element so the
 * overlay can read its on-screen rect each frame.
 */
export function CanvasLockup() {
  return (
    <div
      className="lockup absolute"
      style={{
        // Anchor at block centre + optional offset.
        left: `calc(50% + ${LOCKUP_OFFSET.x}px)`,
        top: `calc(50% + ${LOCKUP_OFFSET.y}px)`,
        width: 0,
        height: 0,
      }}
    >
      {/* Anchor for the emblem overlay — sized, no media. */}
      <div
        className="lockup-emblem absolute pointer-events-none"
        style={{
          left: EMBLEM.dx,
          top: EMBLEM.dy,
          width: EMBLEM.w,
          height: EMBLEM.h,
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden
      />

      {WORDMARKS.map((w) => (
        <div
          key={w.id}
          className="absolute select-none whitespace-nowrap text-fg"
          style={{
            left: w.x,
            top: w.y,
            fontSize: w.fontSize,
            fontWeight: w.weight,
            lineHeight: w.lineHeight,
          }}
        >
          {w.text}
        </div>
      ))}

      <div
        className="absolute select-none text-fg"
        style={{
          left: TAGLINE.x,
          top: TAGLINE.y,
          width: TAGLINE.width,
          fontSize: TAGLINE.fontSize,
          fontWeight: TAGLINE.weight,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          textAlign: TAGLINE.align,
          whiteSpace: "pre-line",
        }}
      >
        {TAGLINE.text}
      </div>
    </div>
  )
}
