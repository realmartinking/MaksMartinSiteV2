"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Page chrome — the small fixed UI layer above the canvas.
 *
 *   • `.nav-top`    — three centred links (tg / mail / info) at the top.
 *   • `.nav-bottom` — single text-button that toggles light/dark.
 *
 * Sized in design units (`--u` is defined in globals.css). Pointer
 * events are passed through on the wrapper so the canvas stays grabbable
 * everywhere except over the actual links.
 */
export function Chrome() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === "dark"

  // Real links from the legacy seed (`__frozen_v3`).
  const TG_URL   = "https://t.me/martinmuur"
  const MAIL_URL = "mailto:martinmursalimov@gmail.com"
  const INFO_URL = "https://www.behance.net/realmartinking"

  return (
    <div
      aria-hidden={false}
      className="fixed inset-0 z-40 pointer-events-none"
      style={{
        // Provide nav metric design units (matches legacy --nav-* tokens).
        ["--nav-top" as string]: "5",
        ["--nav-bottom" as string]: "8",
        ["--nav-font" as string]: "17",
      } as React.CSSProperties}
    >
      <nav
        className="absolute left-1/2 -translate-x-1/2 flex font-semibold text-fg"
        style={{
          top: "calc(var(--nav-top) * var(--u))",
          gap: "calc(36 * var(--u))",
          fontSize: "calc(var(--nav-font) * var(--u))",
        }}
      >
        <a
          href={TG_URL}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto transition-opacity hover:opacity-50"
        >
          tg
        </a>
        <a
          href={MAIL_URL}
          className="pointer-events-auto transition-opacity hover:opacity-50"
        >
          mail
        </a>
        <a
          href={INFO_URL}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto transition-opacity hover:opacity-50"
        >
          info
        </a>
      </nav>

      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: "calc(var(--nav-bottom) * var(--u))" }}
      >
        <button
          type="button"
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="pointer-events-auto bg-transparent border-0 p-0 cursor-pointer font-semibold text-fg transition-opacity hover:opacity-50"
          style={{ fontSize: "calc(var(--nav-font) * var(--u))" }}
        >
          {mounted ? (isDark ? "light" : "dark") : "—"}
        </button>
      </div>
    </div>
  )
}
