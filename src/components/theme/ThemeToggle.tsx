"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Minimal accessible theme toggle.
 * Shows a tiny circle indicator that flips between light/dark.
 * Designed to live in the page corner; styling is intentionally restrained.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — only render after client mount.
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="fixed bottom-5 right-5 z-50 grid h-9 w-9 place-items-center rounded-full border border-fg/15 bg-bg/80 text-fg backdrop-blur transition-colors hover:bg-fg/5"
    >
      <span
        aria-hidden
        className={`block h-3 w-3 rounded-full transition-colors ${
          isDark ? "bg-fg" : "bg-transparent border border-fg"
        }`}
      />
    </button>
  )
}
