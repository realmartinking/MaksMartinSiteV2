/**
 * Large rotating emblem for the sidebar.
 *
 * Uses a CSS keyframe (`emblem-spin`, defined in globals.css) for the
 * continuous 28-second rotation. The two underlying videos play in place;
 * only the wrapper rotates, so the metallic bull/mermaid figure spins as
 * a whole. CSS animations are immune to the requestAnimationFrame
 * throttling that Chrome applies to background tabs, which Framer Motion
 * is sometimes subject to.
 *
 * Background removal uses `mix-blend-mode` (Phase 2 approach). Phase 3
 * will upgrade this to a canvas-backed kill-white-bg / kill-black-bg
 * pipeline.
 */
export function RotatingEmblem({ size = 220 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="relative pointer-events-none select-none"
      style={{ width: size, height: size }}
    >
      <div className="emblem-spin absolute inset-0">
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
    </div>
  )
}
