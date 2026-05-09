"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Inline icon — we keep these tiny inline SVGs to avoid lucide-react being
 * pulled into the client bundle for two glyphs.
 */
function TelegramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
    </svg>
  )
}

function SunIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

/**
 * Telegram + theme switch row, rendered under the slogan in the sidebar.
 *
 * The Telegram link points at `https://t.me/maksmartin` — update in one
 * place if the handle changes.
 */
export function SocialLinks() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <div className="flex items-center gap-2.5">
      <a
        href="https://t.me/maksmartin"
        target="_blank"
        rel="noreferrer"
        aria-label="Telegram"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-fg/15 px-3 text-[13px] text-fg/85 transition-colors hover:bg-fg/5 hover:text-fg"
      >
        <TelegramIcon />
        <span>Telegram</span>
      </a>

      <button
        type="button"
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-fg/15 text-fg/85 transition-colors hover:bg-fg/5 hover:text-fg"
      >
        {mounted ? (isDark ? <SunIcon /> : <MoonIcon />) : <span className="block h-3 w-3 rounded-full border border-current" />}
      </button>
    </div>
  )
}
