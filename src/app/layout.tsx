import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { ThemeProvider } from "@/components/theme/ThemeProvider"

/**
 * Gramatika — primary brand typeface.
 * Bundled locally to avoid runtime CDN dependency on Vercel.
 */
const gramatika = localFont({
  src: [
    { path: "../../public/fonts/GramatikaRegular.woff",      weight: "400", style: "normal" },
    { path: "../../public/fonts/GramatikaSlanted.woff",      weight: "400", style: "italic" },
    { path: "../../public/fonts/GramatikaBold.woff",         weight: "700", style: "normal" },
    { path: "../../public/fonts/GramatikaBoldSlanted.woff",  weight: "700", style: "italic" },
  ],
  variable: "--font-gramatika",
  display: "swap",
})

const SITE_URL = "https://maksmartin.vercel.app"
const TITLE = "Maks Martin"
const DESCRIPTION = "Timeless design, like classical music, love and money."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: TITLE,
  authors: [{ name: "Maks Martin" }],
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/favicon/site.webmanifest",
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#000000" },
  ],
}

/**
 * SVG color-matrix filters used by the Emblem to drop the source video's
 * solid background and keep only the colored artwork.
 * Matrices are copied verbatim from the legacy index.html.
 */
function GlobalSvgFilters() {
  return (
    <svg
      aria-hidden
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <filter id="kill-white-bg" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.333 0.333 0.333 0 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="kill-black-bg" colorInterpolationFilters="sRGB">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.67 2.67 2.67 0 0"
            result="mask"
          />
          <feComponentTransfer in="mask" result="thresh">
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="thresh" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={gramatika.variable}>
      {/* `overflow-hidden` keeps the page from scrolling — the canvas
          handles all panning itself. */}
      <body className="h-screen overflow-hidden antialiased bg-bg text-fg">
        <ThemeProvider>
          <GlobalSvgFilters />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
