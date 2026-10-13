# DESIGN.md — "Approach"

Redesign of erzn3522.github.io (branch `redesign`). The previous plan, "Calibration", is in git history
(`git show f5e7bf0:DESIGN.md`). Facts still come only from `Abdullah Erzin – CV.pdf`; the confidentiality
rules for Pek Automotive work (synthetic scenes and schematics only) are unchanged.

## Phase 0: Brief

- **Subject:** Abdullah Erzin, computer vision engineer. Stereo depth, camera-to-arm calibration, detection
  and segmentation, field deployment of harvesting robots; earlier face liveness, SLAM, thermal NDT; self-study
  of backprop and attention.
- **Audience:** hiring managers and senior CV / robotics / applied ML engineers in Slovenia and Europe.
  30 to 60 seconds, then one project.
- **Job:** say what he does in five seconds, prove it is real in thirty (numbers, method, live figures),
  one action to email or download the CV.
- **Assets:** CV, eight project write-ups, four interactive figures (stereo hero, thermal, backprop,
  attention), eight schematic SVGs. No photos (confidential employer work). All kept.
- **Constraints:** static GitHub Pages, no third-party scripts at runtime, fonts self-hosted, Lighthouse
  95+ was the old bar and stays the bar.

## Phase 1: Concept

| | A. Approach (material: depth) | B. Stereo pair (material: disparity) | C. Tolerance (process: calibration) |
|---|---|---|---|
| Idea | The visitor is a picking arm closing in on a target: scrolling takes every page from 7.5 m to within reach, a depth readout reports the distance, and the accent follows the depth colormap from far blue to near red | Everything is shown twice, as the left and right eye see it, offset by its depth; the page fuses into one image as you look | The site starts out of calibration (distorted grid, large error) and converges until everything sits inside the 10 mm threshold |
| Anchor | He builds depth estimation for robots that pick fruit; 0.9 to 7.5 m is the hero scene's real range | Stereo liveness and stereo depth | 5 mm max error against a 10 mm threshold |
| Layout rule | Each page is a depth axis: top is far, the contact block is in reach | Two offset layers per element | Grid that straightens |
| Motion verb | lock on (a box contracts onto its target) | fuse | snap into register |
| Signature | Depth rail + colormap accent driven by scroll; detection box locks onto the email at the end | Name as two copies converging with the pointer | Barrel distortion removed by scroll (GL) |
| O / F / Fe / P | 4 / 5 / 5 / 2 | 3 / 4 / 4 / 3 (reads as an RGB split glitch) | 4 / 4 / 3 / 2 (old site was already "Calibration") |

**Pick A.** It fits the work best (depth + picking), it extends the hero scene everyone already liked
instead of competing with it, and it is cheap to build well without WebGL. From C: the 404 is a frame with
no valid depth.

### Concept card

```
Idea:        Reading the site is a picking arm approaching its target: far at the top, within reach at contact.
Metaphor:    a depth sensor on a harvesting arm (readout in metres, depth colormap, detection boxes).
Signature:   the depth driver: a rail on the right edge and the site accent follow one variable Z (scroll
             progress on an inverse-depth scale, 7.5 m → 0.40 m); at the contact block the readout says
             "In reach" and a detection box locks onto the email. Recipe: patterns.md driver module.
Emotion:     calm precision, then a click of arrival.
Motion verb: lock on. Boxes contract from loose to tight around what you point at; reveals settle in place.
Screenshot:  the hero: wide display headline over the stereo orchard, depth rail glowing blue at 7.50 m.
```

Idle input: **sensor noise.** At rest the readout's last digit jitters with σ = 2 mm (the calibration's own
standard deviation) a few times a second and the rail marker breathes by a pixel. A real depth sensor never
reads the same twice. Off under reduced motion.

## Phase 2: Art direction

### Palette ("no-depth black")

A depth frame paints invalid pixels black; the site is that frame. One committed dark theme (the theme toggle
is removed: the colormap accent only holds contrast on a dark ground).

| Role | Hex | Use |
|---|---|---|
| ground (`--c-bg`) | `#0B0D0F` | page |
| ink (`--c-fg`) | `#E9ECE6` | text (16.9:1) |
| muted (`--c-muted`) | `#959D9F` | secondary text (7.4:1) |
| line (`--c-line`) | `rgb(233 236 230 / 0.14)` | hairlines between real items |
| depth (`--c-depth`) | driver: `#5B8CFF → #36B5D8 → #4CC97F → #E3D34A → #F59A45 → #FF5A4E` | rail, boxes, focus ring, link underlines. Every stop ≥ 5:1 on ground |
| curtain | `#000000` | page transition |

Legacy token names (`--board --ink --leaf --detect --on-detect --mute --rule`) are kept as aliases so the
interactive figures and the schematic SVGs inherit the new palette.

### Type

One family, **Archivo Variable** (already self-hosted, axes `wdth` 62–125 and `wght` 100–900). Width is the
hierarchy: wide is near and loud, condensed is far and quiet.

- Display: `wdth 125`, `wght 800`, tracking −0.035em at mega, leading 0.92.
- Headings: `wdth 112`, `wght 700`, tracking −0.015em.
- Text: `wdth 100`, `wght 400`, 17 → 18 px, leading 1.55, measure 62ch.
- Readouts and meta: `wdth 75`, `wght 500`, tabular figures, 12–14 px. Only real data (dates, depths, places).
- Source Serif is dropped (saves a 51 KB font file).

Scale: `--t-mega clamp(3rem, 0.9rem + 8.6vw, 9.5rem)`, `--t-xl clamp(2.25rem, 1.2rem + 4.2vw, 5.25rem)`,
`--t-l clamp(1.6rem, 1.2rem + 1.8vw, 2.75rem)`, `--t-m clamp(1.2rem, 1.05rem + 0.6vw, 1.55rem)`,
`--t-body clamp(1.0625rem, 1rem + 0.2vw, 1.125rem)`, `--t-s 0.875rem`, `--t-xs 0.75rem`.

### Grid and rhythm

12 columns, gutter `clamp(1rem, 0.6rem + 1.6vw, 2.25rem)`, max 1440, side pad `clamp(16px, 4vw, 56px)`.
Three hanging lines: col 1 (meta), col 4 (text), col 9 (figures). Section spacing moods: tight (hero to
work), airy (work to experience), full viewport (contact). The rail lives in the right pad and never
touches content.

### Shape and motion

- Radius 0 everywhere; boxes are detection boxes.
- Ease family: GSAP `expo.out` (entrances), `expo.inOut` (curtain), `power3.out` (hover). Lock-on: 0.35 s.
- Treatments per role (three, no more):
  1. **Primary links (project rows, CTAs, pager):** a detection box locks on (inset −14px → −6px, opacity 0 → 1)
     and the label slides 0.4rem toward it.
  2. **Nav:** a square marker slides under the hovered item; the current section keeps it.
  3. **Inline links:** underline at rest in `--c-depth`, rising into a band on hover.
  Utility links (footer socials) change color only.
- Page transition: a sensor sweep. A black panel sweeps left to right with a 2 px leading edge in
  `--c-depth`, then leaves to the right.
- Loader: first visit per session only, 1.1 s floor. The counter reads depth from 20.0 m down to 7.50 m (the
  hero's far plane), then sweeps off.

### Composition plan

```
HERO (1440)                                                         rail ▕
┌─────────────────────────────────────────────────────────────────────┐ ▕
│ Abdullah Erzin                         Work Experience About Contact │ ■ 7.50 m
│                                                                      │ ▕
│ COMPUTER VISION FOR ROBOTS                (t-mega, wdth 125, 800)     │ ▕
│ THAT WORK OUTDOORS.                       sentence case, not caps    │ ▕
│                                                                      │ ▕
│ I build stereo vision and  │ ┌──────────────────────────────────────┐│ ▕
│ detection systems … (col 1–3)│ stereo scene, cols 4–12, 4:3         ││ ▕
│ [Email me] [Download CV]   │ └──────────────────────────────────────┘│ ▕
│ Logatec, Slovenia          │ caption + legend                        │ ▕
└─────────────────────────────────────────────────────────────────────┘

WORK (index list, family 2)
 Selected work                                               8 projects
 ───────────────────────────────────────────────────────────────────────
 Pek Automotive  │ Camera-to-arm calibration for a      │  ┌┄┄┄┄┄┄┐ ← lock-on box
 2025 to present │ harvesting robot (t-l wdth 112)      │  │ SVG  │   chip: "5 mm"
                 │ outcome (muted)                      │  └┄┄┄┄┄┄┘
 ───────────────────────────────────────────────────────────────────────

EXPERIENCE (data family: years as numerals)
 2025        Computer Vision Engineer, Pek Automotive      Logatec, Slovenia
 (t-xl wdth 75, tabular)  summary · project links
 2024        …

ABOUT (statement family)
 I work between the camera and the robot …  (t-l across cols 4–12)
 Skills: definition list, two columns

CONTACT (finale, full viewport)
 In reach.                                    readout: In reach
 ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐
 │ abdullaherzin80+resume@gmail.com │  ← box locks on as the section arrives
 └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘
 Download CV   GitHub   LinkedIn   Medium

PROJECT PAGE
 ← All projects                                        Pek Automotive, Apr 2025 to present
 Camera-to-arm calibration for a harvesting robot   (t-xl, cols 1–10)
 outcome (t-m, cols 4–10)          tags (cols 1–3)
 figure (cols 4–12) / interactive
 prose cols 4–10
 NEXT PROJECT: giant title as the finale, lock-on on hover

404
 Depth invalid.  (t-mega)  No surface at this address. Links home and to every project. Rail pinned at "no depth".
```

Phone (390): headline at 13vw over three lines, scene full width under the text, rail replaced by a 3 px
depth bar along the top edge, work rows single column with the schematic inline, years in a row above each role.

### Genericness test

1. First draft: name as the hero image. Every portfolio does that, and a recruiter learns nothing from a name.
   → The hero states the work; the name sits in the corner.
2. First draft: dark + one neon accent. That is the "AI engineer" default. → The accent is never one color:
   it is a reading of a depth sensor and changes with the page, and its endpoints are the hero scene's colormap.
3. First draft: mono for all labels. → No mono at all; data readouts use Archivo condensed, so width carries
   meaning (far is narrow).
4. First draft: a cursor follower with "View". → None. The detection box that locks on is the pointer response
   and it is the subject's own visual language.
5. First draft: fade-up on every section. → Only headings use line reveals; rows lock on, nothing else floats in.

## Build log (decisions that changed during the build)

- **Nav treatment:** an underline that draws in `--c-depth` (not a sliding marker); the name in the corner
  uses the same draw. Three treatments site-wide: lock-on (rows, email, next project), draw (nav, name),
  rising band (inline links). Buttons nudge their label and flood with the depth colour.
- **Idle:** the readout jitter alone was too small to read as alive. The hero scene now shows its detection
  boxes by default and they jitter by about a pixel six times a second, like live detections from frame to
  frame. Paused off screen, while the visitor drives the divider, and under reduced motion. Project pages
  and the 404 are reading pages and stay still at rest apart from the readout noise: a decision.
- **LCP:** hero and project titles are never hidden before JS. They only play their line reveal when the
  loader covers them; otherwise they paint at once. Mobile LCP went from 5.2 s to 0.4 s (throttled).
- **Loader:** first visit per session, desktop only. Phones get content first.
- **`--leaf` follows `--c-depth`,** so the schematic figures and the self-study interactives take their
  highlight from the same driver as the rail.
- Meta descriptions longer than 160 characters got a `description` field in the project frontmatter.

## Phase 3+: notes

- Stack: existing Astro 7 project, plus GSAP (ScrollTrigger, SplitText), Lenis and the ClientRouter. No WebGL:
  the concept is a measurement, the hero canvas already carries the imagery.
- The interactive figures now init through `onPage()` and return cleanups, because the ClientRouter swaps
  pages without reloading scripts.
- Reduced motion: native scroll, no loader theatrics, no reveals, no idle noise; the driver still maps scroll
  to the accent and the rail (state, not motion).
