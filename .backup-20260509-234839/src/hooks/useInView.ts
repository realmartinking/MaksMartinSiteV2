"use client"

import { useEffect, useRef, useState } from "react"

interface Options {
  /** IntersectionObserver root margin. Defaults to "0px". */
  rootMargin?: string
  /** Trigger threshold (0-1). Defaults to 0.1. */
  threshold?: number
  /** If true, only fire once and then disconnect. */
  once?: boolean
}

/**
 * Lightweight in-view observer hook.
 *
 * Returns a ref to attach to a DOM element and a boolean indicating whether
 * that element is currently intersecting with the viewport. We use this to
 * gate expensive work like `<video>` playback and lazy decoding.
 */
export function useInView<T extends HTMLElement = HTMLElement>({
  rootMargin = "0px",
  threshold = 0.1,
  once = false,
}: Options = {}) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === "undefined") return

    const obs = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0]?.isIntersecting ?? false
        setInView(isIntersecting)
        if (isIntersecting && once) obs.disconnect()
      },
      { rootMargin, threshold }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [rootMargin, threshold, once])

  return { ref, inView }
}
