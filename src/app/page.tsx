import { Sidebar } from "@/components/sidebar/Sidebar"
import { WorkGrid } from "@/components/work/WorkGrid"

/**
 * Home — catalogue of selected work.
 *
 * Desktop: fixed 340px sidebar on the left, scrollable grid on the right.
 * Below 1024px the sidebar collapses to the top of the page so the grid
 * gets the full width on narrower screens.
 *
 * The grid currently lists 17 projects but the system is designed to
 * scale: extend `lib/tiles.ts` with new entries and they're picked up
 * automatically.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <Sidebar />

      <main
        className="
          px-7 pb-24 pt-2
          lg:ml-[340px] lg:px-12 lg:pt-14
        "
      >
        <WorkGrid />

        <footer className="mt-24 flex items-center justify-between border-t border-fg/10 pt-6 text-[12px] text-fg/45">
          <span>© Maks Martin · {new Date().getFullYear()}</span>
          <span className="uppercase tracking-[0.2em]">DUGA</span>
        </footer>
      </main>
    </div>
  )
}
