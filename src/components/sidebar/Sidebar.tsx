import { RotatingEmblem } from "./RotatingEmblem"
import { SocialLinks } from "./SocialLinks"

/**
 * Sidebar — the fixed left rail that replaces the legacy top navigation.
 *
 * Contents (top to bottom):
 *   1. Rotating emblem (large, slow CSS spin)
 *   2. "Maks Martin" wordmark
 *   3. Tagline
 *   4. Social links + theme toggle
 *
 * Layout:
 *   • Desktop (≥1024px): position fixed, ~340px wide, full viewport height,
 *     stays in place while the work grid scrolls on the right.
 *   • Tablet/mobile  (<1024px): renders inline at the top of the page,
 *     stacked vertically. The work grid sits below.
 *
 * Entrance animation cascades via inline `animation-delay`: each block
 * fades in slightly later than the previous one, giving the page a
 * deliberate assembly rather than a single pop.
 */
export function Sidebar() {
  return (
    <aside
      className="
        z-30 flex flex-col gap-7 px-7 py-9
        lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-[340px] lg:overflow-hidden lg:border-r lg:border-fg/10 lg:px-9 lg:py-10
        bg-bg
      "
    >
      <div className="sidebar-stagger" style={{ animationDelay: "40ms" }}>
        <RotatingEmblem size={220} />
      </div>

      <div className="sidebar-stagger flex flex-col gap-2" style={{ animationDelay: "180ms" }}>
        <h1 className="text-[28px] font-bold leading-none tracking-tight text-fg">
          Maks Martin
        </h1>
        <p className="text-[12px] uppercase tracking-[0.22em] text-fg/55">
          Design Director
        </p>
      </div>

      <p
        className="sidebar-stagger max-w-[260px] text-[14px] leading-snug text-fg/75"
        style={{ animationDelay: "300ms" }}
      >
        Timeless design,<br />
        like classical music,<br />
        love and money.
      </p>

      <div className="sidebar-stagger" style={{ animationDelay: "420ms" }}>
        <SocialLinks />
      </div>

      <div
        className="sidebar-stagger mt-auto hidden lg:block"
        style={{ animationDelay: "560ms" }}
      >
        <p className="text-[11px] uppercase tracking-[0.22em] text-fg/40">
          Catalogue · {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}
