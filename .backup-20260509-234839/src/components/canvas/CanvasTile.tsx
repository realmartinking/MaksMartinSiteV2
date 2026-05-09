"use client"

import { useEffect, useRef, useState } from "react"
import { type CanvasTile as CT } from "@/lib/canvas"
import { tileSrc } from "@/lib/tiles"

/**
 * Single tile placed inside a canvas block.
 *
 * The tile is positioned in design coordinates and shows either an
 * `<img>` or a `<video>`. Videos use IntersectionObserver to play only
 * while on screen — important because every block is duplicated 9× and
 * we'd otherwise have ~150 videos decoding at once.
 */
export function CanvasTile({ tile, x, y, w, h }: CT) {
  const ref = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === "undefined") return
    const obs = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? false),
      { rootMargin: "20% 20% 20% 20%", threshold: 0 }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (visible) v.play().catch(() => {})
    else v.pause()
  }, [visible])

  return (
    <div
      ref={ref}
      className="absolute overflow-hidden bg-tile-bg select-none"
      style={{ left: x, top: y, width: w, height: h }}
    >
      {tile.type === "video" ? (
        <video
          ref={videoRef}
          className="block h-full w-full object-cover pointer-events-none"
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
          className="block h-full w-full object-cover pointer-events-none"
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  )
}
