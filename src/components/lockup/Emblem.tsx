"use client"

/**
 * Emblem — Phase 2 implementation.
 *
 * The two source videos ship with solid backgrounds (white in the light
 * variant, black in the dark variant). To drop those backgrounds without
 * relying on SVG filters (which Chrome handles unevenly when applied
 * directly to a <video>), we use CSS `mix-blend-mode`:
 *
 *   • light video on white page  →  mix-blend-mode: multiply
 *     White × anything = anything → white background disappears,
 *     dark emblem strokes survive.
 *
 *   • dark video on black page   →  mix-blend-mode: screen
 *     0 + anything = anything → black background disappears,
 *     light emblem strokes survive.
 *
 * Phase 3 will replace this with a canvas-backed implementation that
 * copies the video frame through the SVG `kill-white-bg` / `kill-black-bg`
 * filters (already mounted in `app/layout.tsx`) for pixel-accurate
 * compositing and theme crossfades.
 *
 * Sized via CSS custom properties:
 *   `--emblem-w` / `--emblem-h` × `--u`
 */
export function Emblem() {
  return (
    <div
      aria-hidden
      className="relative pointer-events-none select-none"
      style={{
        width: "calc(var(--emblem-w) * var(--u))",
        height: "calc(var(--emblem-h) * var(--u))",
      }}
    >
      {/* Light-theme video — visible in light mode */}
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
      {/* Dark-theme video — visible in dark mode */}
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
