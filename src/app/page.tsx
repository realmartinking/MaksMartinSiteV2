import { Lockup } from "@/components/lockup/Lockup"

/**
 * Home page — Phase 2 milestone.
 *
 * For now this is a fully static lockup centered in the viewport.
 * In Phase 4 the surrounding area will be replaced by an infinite tiled
 * canvas of project work, with this lockup as one of nine repeating cells.
 */
export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-bg text-fg">
      <Lockup />
    </main>
  )
}
