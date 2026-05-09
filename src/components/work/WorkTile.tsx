"use client"

import { useEffect, useRef } from "react"
import { type Tile, tileAspectRatio, tileColSpan, tileSrc } from "@/lib/tiles"
import { useInView } from "@/hooks/useInView"

interface Props {
  tile: Tile
  /**
   * 1-based index used for the small "(NN)" caption above the tile.
   * Padded to two digits to match the catalogue aesthetic.
   */
  index: number
}

/**
 * Single project tile in the scattered grid.
 *
 * Behaviour:
 *   • Videos play only while their tile is on screen
 *     (IntersectionObserver gate), saving CPU when far away.
 *   • Hover scales the media gently and fades in the title caption.
 *   • Scroll entrance: fade-up CSS transition once `.in-view` is added.
 *     Pure CSS so it survives Chrome's RAF throttling on background tabs.
 *
 * Sizing:
 *   • CSS aspect-ratio drives the tile box height.
 *   • `colSpan` is set inline because Tailwind's arbitrary `col-span-[…]`
 *     would require runtime-generated classes; inline grid-column keeps
 *     the styles static.
 */
export function WorkTile({ tile, index }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 })
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Pause/play video based on viewport visibility.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (inView) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [inView])

  const aspect = tileAspectRatio(tile.shape)
  const cols = tileColSpan(tile.shape)
  const stagger = Math.min(index * 40, 280) // ms

  return (
    <div
      ref={ref}
      className={`tile-enter group relative${inView ? " in-view" : ""}`}
      style={{
        gridColumn: `span ${cols} / span ${cols}`,
        marginTop: tile.offsetY ? `${tile.offsetY}px` : undefined,
        transitionDelay: `${stagger}ms`,
      }}
    >
      <div className="mb-2 flex items-baseline justify-between text-[11px] uppercase tracking-[0.22em] text-fg/45">
        <span>({String(index).padStart(2, "0")})</span>
        <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {tile.name}
        </span>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-[2px] bg-tile-bg"
        style={{ aspectRatio: aspect }}
      >
        {tile.type === "video" ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            src={tileSrc(tile)}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            aria-label={tile.name}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tileSrc(tile)}
            alt={tile.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between text-[12px] text-fg/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="truncate">{tile.name}</span>
        {tile.topics?.[0] && <span className="text-fg/45">{tile.topics[0]}</span>}
      </div>
    </div>
  )
}
