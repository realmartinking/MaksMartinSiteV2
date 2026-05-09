import { Emblem } from "./Emblem"
import { Tagline } from "./Tagline"

/**
 * The central brand lockup: emblem flanked by "Maks" / "Martin" wordmarks,
 * tagline below.
 *
 * Sizing is driven by `--u` (1 design-px ↔ current viewport) so all
 * design-unit values (400, 105, 52, …) scale with viewport width.
 *
 * Phase 2 keeps the layout simple — flex row with the emblem in the middle,
 * wordmarks on either side. Phase 4 will reintroduce the absolute coordinate
 * system so the debug editor can move blocks around.
 */
export function Lockup() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center gap-[calc(8*var(--u))]">
        <span
          className="font-bold leading-none whitespace-nowrap text-fg"
          style={{ fontSize: "calc(105 * var(--u))" }}
        >
          Maks
        </span>
        <Emblem />
        <span
          className="font-bold leading-none whitespace-nowrap text-fg"
          style={{ fontSize: "calc(105 * var(--u))" }}
        >
          Martin
        </span>
      </div>
      <Tagline className="text-center" />
    </div>
  )
}
