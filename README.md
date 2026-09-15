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


## September 2026 desktop layout

The header and Grid follow [Figma frame 589:104](https://www.figma.com/design/1jPsxEt95jMghCqSUMEVZV/Maks-Martin-St.-Brand-Studio?node-id=589-104). Gramatika Demo Bold is served from the existing local font files. Dark is the default theme; the theme switch and remembered visitor choice remain available.

At 1440px: page gutters and column gaps are 10px, the three media columns are 466.667px wide, the first row starts at y=193px and the second at y≈857px. Captions use 16px type, 18.75px line height, and a 9px media gap. The header's optical offsets are in `src/components/chrome/Chrome.module.css`.

AI BrandStudio and Tools are non-navigating buttons that display “Soon” on hover or keyboard focus without changing their width. Branding opens Grid; List, Grid, Gallery, Info, infinite scrolling, video playback, and existing motion remain available.

The emblem uses its original full video frame within an unclipped positioning stage. Its Figma anchor is 93×169px, while the video stage is 134.4×173.6px with an offset of (-26px, -6px). Measured across all 145 frames of both source videos, visible artwork stays within the desktop viewport. The reference pose's visible size is approximately 83×156px. Keep the stage overflow visible when editing the lockup.

Animation provenance: the original README links to [21st.dev / Ruixen UI Scroll Tilted Grid](https://21st.dev/community/components/ruixenui/scroll-tilted-grid/default); the [current author documentation](https://ruixen.com/docs/components/scroll-tilted-grid) describes the effect. `PerspectiveCard.tsx` also names `emelecollab.com/grid` as a visual reference. The source of the pre-rendered emblem video is not recorded.

### Shared scroll motion

The Ruixen-inspired choreography is the default at `/grid`; existing `/grid?motion=ruixen` links still work. `/grid?motion=classic` keeps the earlier effect available for comparison. Each responsive row is one shared plane with a 62° entry/exit tilt, up to +150px depth, and 6px blur. Perspective starts at 1000px and increases for tall rows on large displays to keep the plane in front of the camera. Between 12% and 65% of viewport height the row anchor is in focus and all transforms are zero. The first row at y=193px stays flat on the reference desktop viewport.

`ScrollTiltPreview.tsx` groups cards at the same 640px/1024px breakpoints as the original grid and transforms the entire row. Cards have no independent perspective, tilt, or lateral drift, preventing portrait cards from intersecting their landscape neighbors. The inner row grid preserves column widths, gaps, top alignment, and each media asset's proportions. Untransformed row anchors subscribe to the same animation frame as the document scroll; timing still uses column width. Intrinsic dimensions in `projects.ts` reserve space before videos load. All project views share the same staggered entrance. The row effect respects reduced motion and disables 3D below 768px. Playback, looping, hover behavior, typography, the emblem, and the default Grid remain available as before.


### Rendering and media optimizations

The preview caches row geometry in one shared ResizeObserver and updates only rows near the viewport, found by binary search. Distant rows return to an unfiltered, untransformed state, while all content remains in the document. Scrolling back restores the same motion curves before a row enters view. Focused rows use `filter: none` instead of `blur(0px)`. Tilt, depth, blur, opacity, easing, spacing, and the shared row perspective are unchanged.

The emblem processes new video frames with `requestVideoFrameCallback`, with a requestAnimationFrame fallback for older browsers. Only the current theme's video plays; theme switches preserve its playback position. Canvas dimensions, DPR, source videos (24 fps), and pixel alpha are unchanged. A lookup table replaces per-pixel luminance arithmetic; all 1,532 alpha results match the previous clamped-byte calculation exactly. Geometry is measured on resize instead of every frame. Emblem and project playback pause while the document is hidden; project tiles share one IntersectionObserver with the original 400px playback margin.

Humber, Lumio, Muse, and Vishnevetsky have lossless WebP alternatives with PNG fallback. Decoded RGBA pixels match their source PNGs exactly. Their combined transfer size drops from 13,567,173 to 8,664,712 bytes (36.1%); the original files and full dimensions are retained. Project videos are unchanged.


### Smooth scrolling and Production

Desktop wheel scrolling uses Lenis 1.3.26 with `lerp: 0.085` and `wheelMultiplier: 1.08`, the values found in the public implementation at [khanhnguyen.design](https://khanhnguyen.design/). Touch scrolling remains native. The Grid row renderer runs from Lenis's scroll notification immediately after it sets document position, avoiding an extra RAF of transform lag. Only one scroll integrator runs. Production's virtual reels own their input and frame loop; Folder uses discrete gestures and Roll continuous wheel input. Reduced motion, page visibility, route changes, and the visual editor's nested scroll area are handled explicitly.

Production opens `/production/folder` and offers List, Roll, Gallery, Folder. Its selection is Value, Raif Vision Conference, Forma Houseboat, and Манеры, in that order. `PRODUCTION_PROJECTS` references the original assets; all 18 Branding projects remain available. All four Production views loop infinitely. List and Gallery extend their feeds; Roll and Folder recycle a bounded window of cards in both directions.

Roll centers a 53.5vw video and lets the next one rise from below. Adjacent cards retain the 62° tilt, 150px depth, and 6px blur. Folder uses overlapping full video cards: the thin strips are their visible upper portions, not flattened frames. Resting cards use a restrained 42° tilt, a 40.5vw base width, gradual depth scaling, and a shared layout. Hover/focus shows the project name at the left-center. Clicking any visible file centers it first, then unfolds that single selection while both parts of the stack move and change perspective. Wheel input stays continuous and snaps to an integer project after 140ms of idle; a short gesture completes one card, a viewport-sized gesture approximately two. Further input is never locked out by an animation or a two-card budget. Arrow keys, Page Up/Down, Home, Escape, and touch gestures are supported. Both reels retain bounded DOM windows and original video assets; neither runs Lenis simultaneously. Roll keeps its existing inertia. Folder uses time-corrected damping and its own idle snap. See [the Folder audit](docs/folder-audit.md) for the reference comparison.

`ProjectEntrance` and `entranceStyle` provide the same 1s blur/lift/fade and 80ms stagger across Grid, List, Gallery, Info, Roll, and Folder. On first load they wait for the preloader instead of completing behind it. Finished entrance animations release their filters and transforms; returning to a route starts a fresh sequence.

Run `npm run test:motion` (Node 22.6+) to check continuous input, short/full gestures, reversals, overlap geometry, selection clearance, and infinite indexing. Source media, Gramatika text, emblem rotation bounds, and the dark default theme are retained.


Emblem readback optimization: completed alpha-processed frames are retained for the repeating 24fps loop. Cached frames are the exact ImageData already displayed; they require no new video-to-canvas readback or alpha calculation. Caches are per mounted emblem and theme, cleared on resize/theme change/unmount, and used only when the whole loop fits the 64MiB limit. The original canvas size, pixels, and source video remain unchanged.
