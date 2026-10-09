# DESIGN.md — "Calibration"

Plan for erzn3522.github.io. The brief is `INITIAL.md`; facts come from `Abdullah Erzin – CV.pdf` (shipped as `/cv.pdf`).

## Subject, audience, job

- **Subject:** a computer vision engineer whose work sits between a camera and a robot arm: calibration, stereo depth, detection, field deployment.
- **Audience:** hiring managers and senior CV/robotics engineers in Slovenia and Europe. 30–60 seconds, then maybe one project.
- **Job:** say what he does in five seconds, prove it is real in thirty (numbers, method, figures), one click to email or download the CV.

## Tokens

### Color

| Token | Light | Dark | Role |
|---|---|---|---|
| `--board` | `#E8ECE9` | `#0F181D` | page ground (matte calibration board) |
| `--ink` | `#17262F` | `#E3EAE6` | text |
| `--leaf` | `#2D6A4F` | `#6FBF98` | links, focus ring |
| `--detect` | `#D7332A` | `#FF6B5E` | bounding boxes only |
| `--on-detect` | `#FFFFFF` | `#0F181D` | text on a detection label chip |
| `--mute` | `#5A6864` | `#93A4A0` | secondary text |
| `--rule` | `#C3CCC8` | `#26363D` | hairlines between real items |

The depth colormap (blue → green → yellow → red, mapped on inverse depth so near is red) lives only inside the hero scene and its legend.

### Type

- **Archivo Variable** for headings, name, dates, UI. Name and headings: `font-stretch: 112%`, `wght 700`, tracking `-0.01em`. Dates and side notes: `font-stretch: 100%`, `wght 500`, `font-variant-numeric: tabular-nums`.
- **Source Serif 4 Variable** for body: 18px → 19px at desktop, line-height 1.6, measure 66ch.
- Modular scale, ratio 1.25 on an 18px base:
  `--step--1 .9rem · --step-0 1.125rem · --step-1 1.406rem · --step-2 1.758rem · --step-3 2.197rem · --step-4 2.747rem · --step-5 3.433rem`
  (the middle dots here are documentation, not page chrome).

### Layout

- Max width 1360px, 12 columns, 24px gutter, side padding `clamp(16px, 4vw, 48px)`.
- **Margin column = cols 1–3**: dates, employer, side notes. **Content = cols 4–12**, body text capped at 66ch.
- Everything left-aligned. Below 860px the margin column stacks above its content.
- Square corners everywhere (a calibration board has no rounded squares). No shadows.

### Principles

1. **One moving thing.** The hero stereo scene is the only element that moves, and only when the visitor moves it.
2. **Structure is data.** Hairlines separate items in a list, the timeline line exists because experience is a sequence, the pick-order numbers in one figure exist because picking is a sequence. Nothing is drawn for decoration.
3. **Show the method honestly.** Figures are labelled schematics drawn in code, never photos, never invented data. Where a figure shows numbers, they are the CV's numbers.
4. **Margin notes, not labels.** Context (employer, years, tools) sits in the left margin in quiet Archivo, never as an eyebrow above a heading.

## Wireframes

### Hero (1440)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ABDULLAH ERZIN (wide 700)          Work  Experience  About  Contact  [Dark]│
├──────────────────────────────────────────────────────────────────────────┤
│                              │ ┌──────────────────┬───────────────────┐ │
│ Computer vision for          │ │ Camera view      │         Depth map │ │
│ robots that work             │ │  ○ ◌  apples     │  ███ colormap     │ │
│ outdoors.     (step-5 wide)  │ │ ┌─┐1.42 m        │  ┌─┐2.31 m        │ │
│                              │ │ └─┘   ◌○         │  └─┘              │ │
│ I build stereo vision and    │ │              ┃ divider follows X    │ │
│ detection systems ... Pek    │ └──────────────────┴───────────────────┘ │
│ Automotive in Slovenia.      │  Synthetic scene. Drag to compare ...    │
│                              │  near ▕red■■yellow■■green■■blue▏ far     │
│ [View projects] [Download CV]│  0.8 m   1 m      2 m     4 m    7.5 m   │
└──────────────────────────────────────────────────────────────────────────┘
   cols 1–5                          cols 6–12, 4:3 canvas
```

### Hero (390)

```
┌────────────────────────┐
│ ABDULLAH ERZIN  [Dark] │
│ Work Experience About… │
│                        │
│ Computer vision for    │
│ robots that work       │
│ outdoors.              │
│ I build stereo vision… │
│ [View projects]        │
│ [Download CV]          │
│ ┌────────────────────┐ │
│ │ scene (4:3)        │ │
│ └────────────────────┘ │
│ caption + legend       │
└────────────────────────┘
```

### Home below the hero

```
Selected work (wide heading, content column)
───────────────────────────────────────────────────────────────────────────
Pek Automotive     │ Camera-to-arm calibration for a      │ ┌──────────┐
2025 – present     │ harvesting robot                     │ │ figure   │ ← hover/focus:
                   │ 5 mm max positional error (2 mm std) │ │ (SVG)    │   --detect box
                   │ against a 10 mm production threshold.│ └──────────┘
───────────────────────────────────────────────────────────────────────────
… four more rows

Experience
Apr 2025 –         ▪ Computer Vision Engineer, Pek Automotive
present            │ Logatec, Slovenia. One-line summary. Projects: …
Mar 2024 –         ▪ Software Engineer, Robsys Robotic Systems
Mar 2025           │ …
(dates in margin, tabular; one 1px line with square ticks = the sequence)

About              (3–4 sentences, first person, serif)
                   Skills as a definition list: Languages / Computer vision / …

Contact            abdullaherzin80+resume@gmail.com  (large, Archivo)
                   Download CV · GitHub · LinkedIn · Medium · Bento  (a plain list)
```

### Project page

```
┌───────────────────┬──────────────────────────────────────────────────┐
│ All projects      │ Camera-to-arm calibration for a                  │
│                   │ harvesting robot            (step-4 wide 700)    │
│ Pek Automotive    │ One-sentence outcome with the real number.       │
│ Apr 2025 – present│ ┌──────────────────────────────────────────────┐ │
│                   │ │ figure (schematic SVG)                       │ │
│ Camera calibration│ └──────────────────────────────────────────────┘ │
│ 3D transforms     │ Caption: what the reader is looking at.          │
│ UART              │                                                  │
│                   │ Problem / Approach / Result / What I would do    │
│                   │ next  (h2 Archivo, serif body, 66ch)             │
│                   │ [phase-2 demo slot: comment only]                │
├───────────────────┴──────────────────────────────────────────────────┤
│ Previous: …                                              Next: …     │
└──────────────────────────────────────────────────────────────────────┘
```

## The hero scene, technically

- Pure, seeded scene generator in `src/lib/scene.ts`, shared by the server-rendered SVG fallback and the client canvas, so both show the same orchard.
- Pinhole camera, `f = 900` (in a 1000-unit-wide image), baseline `B = 0.06 m`, camera 0.9 m above the ground. Apples (r = 4 cm) sit on a near branch (≈1 m) and on a tree row (≈2–3 m). Disparity `d = f·B/Z` places each apple's right-camera outline; at 1 m that is 54 units, at 3 m 18.
- Both views (camera, depth) are rendered once into offscreen canvases on resize. A frame only blits two clipped images, the divider and the boxes, so it costs almost nothing. There is no idle loop: a short easing loop runs while the divider catches up with the pointer and stops when it arrives or the tab is hidden.
- Input: mouse/pen hover X, touch drag (`touch-action: pan-y` keeps vertical scroll), and a real `<input type="range">` for keyboard. Boxes with depth labels show while the pointer is over the scene or the slider has focus.
- `prefers-reduced-motion`: no easing; static frame, divider 50%, boxes on. No JS or no 2D context: the SVG stays.
- DPR capped at 2.

## Plan review against the brief

I checked each decision against "what would I produce for any developer portfolio?"

1. **First draft:** project list as rows with a thumbnail of a stock-looking screenshot. That is the default and also breaks the confidentiality rule. → Each project gets a schematic drawn in SVG that explains the method (tolerance target, depth histogram, pick order, occupancy grid, depth profile).
2. **First draft:** section headings in the left margin column, small. That turns them into labels. → Headings sit in the content column at full size; the margin is only for information (dates, employer, tools).
3. **First draft:** a "skills" tag cloud of chips. → Definition list in the CV's own groups.
4. **First draft:** hero headline big and centred over a full-bleed canvas. → Left-aligned text block beside the scene on desktop; text before scene on mobile so the first screen says what he does.
5. **First draft:** hover lift + transition on project rows. → No transition. The only hover response is the `--detect` bounding box drawn around the figure, instant, because a detection is instant.
6. **First draft:** contact as a form. → No backend, no third-party. A large mailto address and a plain list of links.

## What I changed and why

- **Facts follow the current CV, not the brief's summary.** The PDF is newer than `INITIAL.md`. It does not contain "−60% calibration time", "±5mm", "gradient boosting", "linear regression" or "NumPy-array mapping". It does contain "5 mm max positional error (2 mm std) against a 10 mm production threshold", a three-stage camera-to-arm calibration, histogram front-surface depth, YOLO retraining on 700 GB of field recordings, and field deployments in five countries. The brief names the CV as the source of truth, so the site uses the CV. Numbers are written as the CV writes them: `4 KB`, `30 ms`, `98%`, `30%`.
- **Project list reshaped to what the CV supports.** The brief's "stereo calibration" and "camera-to-arm transform" are one piece of work in the CV, so they became one page (`camera-to-arm-calibration`). The freed slot went to the end-to-end perception-to-picking pipeline (`harvesting-pipeline`), the CV's lead bullet. `detection-pipeline` now covers depth accuracy, exposure control and YOLO retraining.
- **Location:** the CV header says Logatec, Slovenia, which answers open question 1.
- **`--mute` darkened** from `#6B7B78` to `#5A6864`: the brief's value is 3.7:1 on `--board`; the new one is 4.9:1. Dark `--mute` passes as given (6.8:1).
- **Added `--on-detect`.** White text on the dark-theme `#FF6B5E` chip is 2.8:1; dark text is 6.4:1.
- **Colormap on inverse depth** (disparity-proportional), so the near apples, the interesting part, get most of the color range, and the legend shows real meter ticks.

## Critique log (screenshot passes)

1. **Pass 1.** The near branch filled a third of the scene and hid the tree row; few apples on the depth side; legend ticks at 5 m and 7.5 m collided. → Near branches made smaller and lifted, trees re-spaced, every tree guaranteed fruit, apple count 20 → 16, legend ticks reduced to 1, 1.5, 2, 3, 7.5 m.
2. **Pass 2.** Canopy sat too high and the bottom half was empty ground; depth labels overlapped in the near cluster. → Canopy and fruit lowered so the "no depth" sky band reads at the top; labels are placed nearest-first and a label that would cover another is skipped (its box stays). Same rule in the SVG fallback.
3. **Pass 3.** Figure text dropped to ~9px at 390px; figures were oversized at 1440px; "2023 – 2023" on a one-year role; screen readers heard the employer before the project title. → 22px figure text under 600px with labels moved inward; figures capped at 48rem; single-year periods collapse; title first in the DOM, visual order kept with grid.
4. **Performance.** Lighthouse mobile on home was 91. → Source Serif switched from the `opsz` files (122 KB) to `wght` (51 KB), italic file dropped, CSS inlined, the two Latin font files preloaded. Home now 98 / 100 / 100 / 100; project pages 100 across.
5. **Removed one accessory.** The footer line "No analytics, no cookies." announced the quality floor instead of just having it.

## Addition: thermal NDT project (requested by Abdullah)

A sixth project page with a second interactive figure, built like the hero: a synthetic PLA plate after a flash, thermal frame left of the divider, Fourier phase image right of it, a time slider, and two charts (cooling curves, contrast over each crack). This departs from the brief's "one memorable thing" on request; on the home page it stays a quiet row with a static schematic.

- The thermal frame uses an iron palette (black → purple → orange → white), a different colormap from the hero's depth map, so the brief's rule that the depth colormap appears only in the hero still holds.
- The model is physical but simplified: 1D flash heating (surface cools as 1/√t), reflection from a crack at depth L appearing from t ≈ L²/α, lateral washout, multiplicative uneven lamp heating that the phase removes. The Fourier transform is linear in the crack weights, so the phase image is computed in one pass per pixel.
- Phase is shown as magnitude on a log scale above the noise floor, because the sign of the phase shift can flip with depth at a fixed frequency.
