# Richard Burd's Homepage

## Getting Started

First, run the development server:

```bash
pnpm run dev
```

Or do a build:

```bash
pnpm build && pnpm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## About This Project

This is the code repository for [Richard Burd’s Homepage](http://richardburd.dev), built with [Next.js](https://nextjs.org/) 16 (App Router), [React](https://react.dev/) 19, TypeScript and [Tailwind CSS](https://tailwindcss.com/) 4. Most of what you see on the site is custom-built rather than pulled off the shelf. Highlights:

### Multilingual, Right-To-Left (RTL) aware content

- English, Arabic and Hebrew via [next-intl](https://next-intl.dev/), with locale-prefixed routing (`/ar`, `/he`) that leaves English at the root URL
- RTL locales mirror the whole page horizontally, and each script gets its own typeface (Roboto, Noto Kufi Arabic, Rubik) — including inside SVG chart labels
- Translated strings can carry inline markup (links, bold, italics, in-page anchors) through a small rich-text tag system, so translators control wording without touching components
- Content that should never be translated (e.g. tech tool names) is kept in the data files instead of the message catalogs, so it always renders in Latin script

### Custom data visualizations

- **Donut chart that turns into a bar chart:** a [Nivo](https://nivo.rocks/) donut chart on wide screens and a custom animated bar chart below 800px, both driven by the same JSON data and sharing a slide-in detail panel
- **Label-fit geometry:** the donut’s outer labels are measured and the graphic is shifted horizontally so the leftover space on each side is equal, and slices are ordered so long labels sit near 12 and 6 o’clock where they take the least horizontal room
- **[Three-tier tech stack chart:](https://www.richardburd.dev/#technology-stack)** a hand-built, data-driven SVG chart in which tier-2 bars “pop out” of their tier-1 parent and tier-3 bars pop out of tier 2 as you scroll, with heights calculated from the data
- Hover, focus and touch interactions designed separately for mouse and touch devices, plus dark-mode-aware colors and `prefers-reduced-motion` support throughout

### Interactive 3D (WebGL)

- Models are made in [Blender](https://www.blender.org/), exported as `.glb`, hosted on AWS S3 and rendered with [React Three Fiber](https://r3f.docs.pmnd.rs/), [Drei](https://drei.docs.pmnd.rs/) and post-processing (depth of field)
- **Dual opposite-facing portals:** a gazebo with two portals, each opening onto a different “secret world.” It uses portal materials and stencil-buffer tricks to recreate in Three.js a Cycles Ray Portal effect that doesn’t survive `.glb` export
- A companion Blender Python script (`scripts/dual-portals-blender.py`) fixes the related self-visibility problem in Cycles, using Portal Depth parity as a one-bit “which portal did this ray come through” flag
- Custom turntable controls built with quaternions (horizontal drag spins, vertical drag tilts toward the camera, and the model can never roll onto its side), with touch handling that tells a drag apart from a page scroll
- One-shot intro animations from Blender played through an animation mixer, then handed off to idle auto-rotation
- Performance and resilience: rendering pauses when the canvas is off-screen, the canvas shrinks on short viewports so it stays above the fold, and a missing model shows an error message instead of crashing the page

### Layout, motion and theming

- A [two-column layout](https://www.richardburd.dev/schematic-visualization) with a pinned parallax image and a “leader line” spine whose ticks line up with the first line of each row of content, collapsing to a single column on mobile
- Art-directed imagery: separate desktop and mobile files per locale, plus light and dark variants
- A [Lottie](https://airbnb.io/lottie/) animated sun/moon theme toggle with hover loops; the theme switches halfway through the morph, and the animation data is cleaned up at load time to remove leftover artifacts
- Dark mode with no flash of the wrong theme on load (an inline script runs before first paint), following the system setting until the user picks a theme
