# MaksMartin v2

Personal portfolio for Maks Martin — design director.

Stack: **Next.js 16 · React 19 · TypeScript 5 · Tailwind v4 · shadcn/ui infra · Framer Motion 11 · next-themes**.

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│ [list]                                                  │
│ [grid]                ╔════════════╗                    │
│ [gallery]             ║   EMBLEM   ║  200px, video,     │
│                       ║            ║  frame ≠ rotated   │
│                       ╚════════════╝                    │
│                          Maks                           │
│                          Martin                         │
│                  Timeless design,                       │
│                  like classical music,                  │
│                  love and money                         │
│              tg · mail · info · light/dark              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ░░░░░░░░░░░ active view (grid / list / gallery)        │
│  ░░░░░░░░░░░ wrapped in scroll-tilted-grid effect       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- **Top-center** — emblem (200 px tall, square). The video plays in place; the **frame itself does not rotate** (the spinning visual comes from the video content, not a CSS transform).
- **Below the emblem** — `Maks Martin` wordmark, three-line slogan, `tg / mail / info` social links, theme toggle.
- **Top-left, fixed** — `list / grid / gallery` view toggles. Choice persists in `localStorage`.
- **Project area** — 17 tiles by default, 3 columns max, mixed aspect ratios (16:9 / 3:4 / 1:1) and editorial `col-span` / `row-span` overrides every 5th and 7th tile so the grid feels chaotic, not uniform.

---

## Animations

All effects are Framer Motion, not GSAP.

| Effect                         | Where                                                         |
|--------------------------------|---------------------------------------------------------------|
| Fade-in + lift on scroll       | Every tile, list row, header element (`whileInView`)          |
| Hover scale 1.015 + soft shadow| Tiles                                                         |
| Stagger                        | List rows (`delay: i * 0.025`)                                |
| Crossfade between view modes   | `AnimatePresence` in `app/page.tsx`                           |
| Cursor-follow video preview    | List view — preview video tracks the mouse with spring lag    |
| Hero crossfade in gallery      | `AnimatePresence mode="wait"` on `<motion.video>`             |
| Arrow-key nav in gallery       | `← / →` cycles the hero                                       |
| **Scroll-tilted-grid**         | `<ScrollTilt>` wraps every view. `useScroll` → spring → `rotateX` flips from `+intensity` (top of viewport) to `-intensity` (bottom). Reimplements [21st.dev/r/ruixenui/scroll-tilted-grid](https://21st.dev/community/components/ruixenui/scroll-tilted-grid/default). |
| Active view-toggle underline   | `layoutId` shared across `list/grid/gallery` for FLIP swap    |

---

## Setup

```bash
# fresh clone
npm install
npm run dev          # http://localhost:3000
npm run build
npm run typecheck    # tsc --noEmit
```

If you copied this folder from the Cowork sandbox, you'll see two leftover artifacts that the sandbox FS wouldn't let me unlink:

- `node_modules.linux.delete-me/`  — Linux x64 install, unusable on macOS
- `package-lock.json.linux.bak`     — matching Linux lockfile
- `tsconfig.tsbuildinfo.bak`        — old build info

On macOS, **delete them first**, then install fresh:

```bash
rm -rf node_modules.linux.delete-me package-lock.json.linux.bak tsconfig.tsbuildinfo.bak \
       node_modules package-lock.json .next
npm install
```

---

## Required assets

Drop into `public/`:

```
public/
├── fonts/
│   ├── Gramatika-Regular.woff2
│   ├── Gramatika-RegularItalic.woff2
│   ├── Gramatika-Bold.woff2
│   └── Gramatika-BoldItalic.woff2
├── videos/
│   ├── emblem.mp4               ← top emblem (200 px square, white-bg killed via mix-blend-mode)
│   ├── 01.mp4 … 17.mp4          ← the 17 project videos, any aspect (cropped via object-cover)
└── posters/
    └── 01.jpg … 17.jpg          ← optional still posters for first paint
```

Project metadata lives in **`src/lib/projects.ts`** — edit names, types, years, slugs, and `videoSrc` paths there. Adding an 18th project? Just append to the `PROJECTS` array; everything (grid spans, list rows, gallery thumbs) updates automatically.

The slugs in `projects.ts` are placeholders inferred from the legacy site — replace with your real project names.

---

## Theming

- `next-themes` with the `class` strategy.
- Default theme is **dark**.
- Toggle via the `light` / `dark` text button under the slogan.
- Emblem video uses `mix-blend-mode: multiply` (light) and `screen` (dark) so the white background drops out automatically. For pixel-perfect cleanup, switch to the SVG filter `url(#kill-white-bg)` (already mounted in `layout.tsx`) by adding `style={{ filter: "url(#kill-white-bg)" }}` to the emblem `<video>` in `Emblem.tsx`.

---

## Scroll-tilted-grid — replacing the inline reimplementation

The 21st.dev MCP isn't available in Cowork, so the effect is reimplemented inline in `src/components/effects/ScrollTilt.tsx` (Framer Motion `useScroll` + `useSpring` + `useTransform` driving a 3D `rotateX`).

To swap in the official ruixenui component once you're back in Claude Code:

```bash
npx shadcn@latest add "https://21st.dev/r/ruixenui/scroll-tilted-grid"
```

Then replace the `<motion.div>` block in `ScrollTilt.tsx` with the imported component, keeping the same `intensity` / `fadeEdges` props.

---

## Deploying

### GitHub

```bash
git init
git add .
git commit -m "feat: rebuild — top emblem + list/grid/gallery + scroll-tilted-grid"
gh repo create realmartinking/MaksMartinSiteV2 --public --source=. --remote=origin --push
```

### Vercel

```bash
npx vercel --prod
# or push and connect at https://vercel.com/new
```

Domain switch from `maksmartin.vercel.app` (legacy) → new project happens in Vercel project settings once the v2 build is healthy.

---

## File map

```
src/
├── app/
│   ├── layout.tsx           html shell, fonts, ThemeProvider, SVG filters
│   ├── page.tsx             page entry — toggles + Header + active view
│   └── globals.css          Tailwind v4 tokens, keyframes, emblem blend modes
├── components/
│   ├── effects/ScrollTilt.tsx        ← scroll-tilted-grid effect (ruixenui port)
│   ├── header/
│   │   ├── Emblem.tsx                ← 200 px emblem, video plays, no frame rotation
│   │   ├── Header.tsx                ← emblem + wordmark + slogan + links + theme
│   │   └── ViewToggles.tsx           ← top-left list/grid/gallery, FLIP underline
│   ├── projects/
│   │   ├── ProjectTile.tsx           ← single tile, IO play/pause, hover scale
│   │   ├── ProjectGrid.tsx           ← 3-col chaotic grid, wrapped in ScrollTilt
│   │   ├── ProjectList.tsx           ← rows with cursor-follow preview video
│   │   └── ProjectGallery.tsx        ← single hero + thumb strip + arrow keys
│   └── theme/
│       ├── ThemeProvider.tsx
│       └── ThemeToggle.tsx
├── hooks/
│   ├── useInView.ts                  ← IntersectionObserver helper (tile play/pause)
│   └── useViewMode.ts                ← list/grid/gallery + localStorage
└── lib/
    ├── projects.ts                   ← 17 projects, slogan, social links
    └── utils.ts                      ← cn()
```

---

## What's intentionally NOT here

- The legacy infinite-tiled canvas (`src/lib/canvas.ts`, `components/canvas/*`). The redesign moves away from infinite drag in favor of a conventional scroll feed with 3D tilt — keep the old folder around if you ever want to swap back.
- A preloader. Adding one is the natural next step: emblem in center + a `%` counter wired to `Promise.allSettled(videos.map(v => v.preload))`, fade out 700 ms.
- A separate mobile route. The current grid is responsive (1 col on phones, 2 on tablets, 3 on desktop). A dedicated `/m` or `useMediaQuery` swap is straightforward to layer on top.

---

## Contacts (production seed)

- Telegram — <https://t.me/martinmuur>
- Email    — <mailto:martinmursalimov@gmail.com>
- Behance  — <https://www.behance.net/realmartinking>
