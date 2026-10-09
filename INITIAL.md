# INITIAL.md — Abdullah Erzin portfolio (computer vision & robotics)

Read this whole file before writing any code. It is the brief. Where this file and your defaults disagree, this file wins.

## 0. How to work

1. **Load the `frontend-design` skill first** (Skill tool, name `frontend-design`). If it is not installed, follow section 4 and section 9 of this file as the design rules instead. Do not skip the design pass because the stack is simple.
2. Follow the skill's process: **plan → review the plan against this brief → build → critique**.
   - Write the plan to `DESIGN.md` (tokens, type, layout, principles; ASCII wireframes for hero, home, project page).
   - Review it: anything that reads like a default for "developer portfolio" gets revised. Add a short "What I changed and why" at the end of `DESIGN.md`.
   - Then build. Do not wait for approval between plan and build.
3. Critique with screenshots. Playwright/Chromium is the tool: run the dev server, capture 1440px, 768px and 390px widths, fix what looks wrong, repeat at least twice. Respect `prefers-reduced-motion` in the screenshots too.
4. Work in small commits. Run locally first (`npm run dev`); deployment comes in section 8 and happens only after I say the local version is good.

## 1. Who and what

- **Client:** Abdullah Erzin, computer vision engineer (robotics, stereo vision, detection). Source of truth for all facts: `Abdullah_Erzin_CV.pdf` (in the repo root or attached).
- **Purpose:** get hired. Audience: hiring managers and senior engineers in computer vision, robotics, and applied AI in Slovenia and wider Europe. They spend 30–60 seconds, then maybe open one project.
- **Job of the site:** in five seconds say what he does; in thirty seconds show the work is real (numbers, figures, method); give a one-click way to contact him or download the CV.
- **Replaces:** `erzn3522.github.io` (a CV pasted into a page: no figures, no projects, broken `assets\` paths, `[Your Name]` left in the mailto, typos). Same URL stays.

## 2. Theme: "Calibration"

The visual language comes from what he actually works with: stereo camera calibration boards, disparity and depth maps, and detection bounding boxes on orchard images. It is not a generic dark "AI" look and not a 3D showpiece.

### Palette (named tokens; define as CSS custom properties)

| Token | Light | Use |
|---|---|---|
| `--board` | `#E8ECE9` | page ground, a cool grey-green like a matte calibration board |
| `--ink` | `#17262F` | text, deep blue-slate (not neutral black) |
| `--leaf` | `#2D6A4F` | links, focus ring, agricultural reference color |
| `--detect` | `#D7332A` | bounding boxes and the single highlight on the page; used only for detection marks |
| `--mute` | `#6B7B78` | secondary text (check contrast ≥ 4.5:1 on `--board`) |
| `--rule` | `#C3CCC8` | hairlines only where they separate real content |

Dark (via `prefers-color-scheme`, plus a manual toggle that remembers the choice in `localStorage` wrapped in try/catch): `--board #0F181D`, `--ink #E3EAE6`, `--leaf #6FBF98`, `--detect #FF6B5E`, `--mute #93A4A0`, `--rule #26363D`.

The depth colormap (blue → green → yellow → red) appears **only** inside the hero scene. Nowhere else.

### Type

- **Headlines:** Archivo (variable, use the width axis: wide and heavy for the name and section headings, e.g. `wdth 112, wght 700`; tight but not collapsed tracking).
- **Body:** Source Serif 4, 18–19px, line-height ~1.6, measure 62–70ch. Serif body gets the extra leading.
- Two families, clearly different. Self-host via `@fontsource-variable/archivo` and `@fontsource-variable/source-serif-4` (no runtime Google Fonts request).
- Type scale: modular, ratio ~1.25, defined as tokens. Numbers in text use tabular figures where they line up.

### Layout

- Left-aligned everywhere. Asymmetric 12-column grid; content column on the right of a narrow left margin that holds dates and short side notes. Generous whitespace; one idea per screen.
- Home is a single scroll: hero → selected work → experience → short about → contact. Each project also has its own page.
- Experience is a real sequence, so it is a vertical timeline with dates in the left column. That is the only place structure like a timeline is used.

### The one memorable thing: the hero stereo scene

Spend the boldness here and keep the rest quiet.

- A `<canvas>` generated **procedurally in code** (no photos, no company data): a stylized orchard row with ~16–24 apples at different depths. Each apple is drawn in the left and right virtual camera with disparity `d = f·B / Z`, so nearer apples visibly shift more.
- Pointer X (or touch drag, or arrow keys on a focusable control) moves a vertical divider: left of it shows the RGB view, right of it shows the disparity/depth colormap of the same scene.
- Apples get `--detect` bounding boxes with a depth label in meters (e.g. `1.42 m`), appearing on hover/focus. This is user-triggered motion; nothing else on the page animates by itself.
- Add a visible caption: "Synthetic scene. Drag to compare the camera view with the depth map." Honest about what it is.
- `prefers-reduced-motion`: render one static frame with the divider at 50% and the boxes shown; no animation loop. Pause the loop when the tab is hidden. Cap DPR at 2. Must hold 60 fps on a mid laptop; if not, reduce apple count.
- Without JavaScript or on canvas failure: a static SVG fallback of the same composition.

Headline and subline next to/over the scene (plain words, no slogan):

- Headline: `Computer vision for robots that work outdoors.`
- Subline: `I build stereo vision and detection systems for agricultural and mobile robots. Currently at Pek Automotive in Slovenia.`
- Two actions: `View projects`, `Download CV`. Sentence case, no arrows.

## 3. Information architecture

```
/                 home (hero, selected work, experience, about, contact)
/projects/<slug>  project pages (Markdown/MDX via Astro content collections)
/cv.pdf           the CV (from /public)
/404              helpful 404: says what is missing, links to home and projects
```

Selected work (order matters; strongest first):

1. `stereo-calibration` — Stereo camera calibration for agricultural robots
2. `detection-pipeline` — Improving YOLO apple detection with depth data
3. `camera-to-arm-transform` — Aligning camera 3D coordinates with robotic arm positions
4. `autonomous-navigation` — Autonomous navigation for a cleaning robot (custom SLAM)
5. `face-recognition` — High-security face recognition on Jetson Nano

Optional later (phase 2, not now): a browser-side demo with ONNX Runtime Web running a small detector on a bundled sample image. Leave a clearly marked slot in the project template; do not build it yet.

### Project page template

Title → one-sentence outcome with the real number → figure/video slot → Problem → Approach → Result → What I would do next. Plain headings in sentence case, no numbered steps, no eyebrow labels. Figures have captions that say what the reader is looking at. If no figure exists yet, render a visible placeholder block with a `TODO: figure` note in the source, not a fake image.

### Project list on the home page

Rows, not a card grid: large title, the outcome line, a small figure on the right. Hover/focus on a row draws a `--detect` bounding-box outline around the figure (a response to the user's action). Rows are real links with visible focus.

## 4. Design rules (from the skill, restated so they survive)

Do not use any of these, even though they are common:

- cream background with terracotta accent; near-black background with a single acid-green accent
- uniform rounded cards with the same soft shadow; gradient washes as decoration
- tracked-out ALL-CAPS labels or eyebrows above headings; monospace font for small labels; `A · B · C` meta strings; `WORD — fragment` labels; `→` on every link or button
- accenting a single word in a headline with italic/bold/color
- numbered markers (`01 / 02 / 03`) on anything that is not a true sequence
- fade-and-slide-up on every section; hover transitions on every element; three.js, particles, or parallax
- stock-photo or emoji decoration

Do:

- Use one orchestrated moment (the hero) and keep everything else still.
- Let structure carry information: dividers separate different kinds of content; nothing is a decorative line.
- Quality floor without announcing it: responsive to 360px, visible keyboard focus (`--leaf` ring, 3px offset), skip link, semantic landmarks, alt text, sufficient contrast in both themes, no horizontal scroll, reduced motion respected.

## 5. Content (use only what the CV supports)

Rules: every claim must trace to `Abdullah_Erzin_CV.pdf`. Keep his numbers exactly (60%, ±5mm, 98%, 30%, 4kb, 30ms). **Do not write "industry-leading"** even though the CV does; it cannot be verified. No invented metrics, employers, dates or tools. If you need a fact that is not in the CV, add `TODO(abdullah): ...` in the source and render nothing for it.

Facts to use:

- **Pek Automotive**, Ljubljana, Slovenia — Computer Vision Engineer, Apr 2025 to present. Stereo camera calibration for agricultural robots (calibration time −60%, ±5mm deviation). Secondary ML pipeline: gradient boosting on depth data to correct YOLO false positives in bundled apples and to detect partially visible apples. Transformation algorithms aligning camera 3D coordinates to robotic arm positions. Depth analysis integrated with YOLO via custom linear regression; adaptive camera control for depth mapping under varying sunlight.
- **Robsys Robotic Systems**, Istanbul — Software Engineer. Autonomous navigation from scratch for a cleaning robot: custom SLAM mapping, pathfinding, obstacle avoidance; Jetson, multi-sensor fusion (stereo cameras, gyroscope, ultrasonic); custom UART protocol with the robot motherboard; live data and camera streaming to a mobile app; mapping implemented with NumPy arrays.
- **Bomensoft** (remote, London), AI Developer, Jan–Feb 2024. Short stint; one line on the timeline, no project page.
- **DGR Project**, Istanbul — Computer Vision Engineer, May–Dec 2023. Face recognition: 98% accuracy, 30% fewer false positives, 4kb per person, on Jetson Nano; C++ optimization; live streaming pipeline targeting under 30ms.
- **ZGN Autonomous & Robotics**, Dec 2022–May 2023. Pathfinding optimized (−30% processing time); algorithm that maps areas from construction blueprints.
- **Gensys Automation & Machine Vision**, Kocaeli, Dec 2021–Dec 2022. C#, Halcon, MSSQL desktop apps; two TUBITAK projects, including non-destructive testing with thermal camera and halogen lamps.
- **Mavis Machine Vision**, intern, Jul 2020–Mar 2021.
- **Education:** Marmara University, Mechatronics Engineering, graduated Mar 2021.
- **Skills (keep short, grouped by what they are used for, not a tag cloud):** Python, C++, C#, JavaScript, SQL; OpenCV, PyTorch, TensorFlow, NumPy, scikit-learn; Halcon; Jetson; Git.
- **Links:** GitHub `https://github.com/Erzn3522`, LinkedIn `https://www.linkedin.com/in/abdullah-erzin/`, Medium `https://abdullaherzin.medium.com/`, Bento `https://bento.me/abdullah-erzin`.
- **Interests (one short sentence in About):** motorcycles, scuba diving.
- **Contact email:** `abdullaherzin80+resume@gmail.com`. mailto with subject only; no template body, no placeholders.

### Confidentiality

Pek Automotive work is employer work. **Never** use real Pek images, datasets, model weights, screenshots, internal names of systems, or customer details. Project figures for Pek work are synthetic or generic diagrams (same approach as the hero). Describe method and outcome at the level the CV already does. Put a short note in the README: "Confirm with employer before adding real field imagery."

### Copy rules

Plain, specific, active voice, sentence case. Name things by what they do. Each sentence does one job. No "passionate", "cutting-edge", "innovative", "journey". About section: 3–4 sentences, first person.

## 6. Stack

- **Astro** (latest stable), TypeScript, **plain CSS with custom properties** (no Tailwind; avoids specificity clashes between section and component selectors; keep selectors flat and scoped).
- Content collections for projects (`src/content/projects/*.md`, frontmatter: title, outcome, order, tags, figure).
- Canvas hero as a small vanilla TS module hydrated with `client:visible` or an inline script; no React unless clearly needed.
- Images through Astro `<Image>`; SVG for diagrams. OG image and favicon generated from the calibration-board motif (a small checkerboard with one `--detect` box).
- Fonts self-hosted. No analytics, no cookie banner, no third-party scripts.
- Targets: Lighthouse ≥ 95 on performance, accessibility, best practices, SEO (mobile). Total JS on home < 60 KB gzipped.

## 7. Local run

```bash
npm create astro@latest . -- --template minimal --typescript strict --no-git --install
npm i @fontsource-variable/archivo @fontsource-variable/source-serif-4
npm run dev        # http://localhost:4321
npm run build && npm run preview
```

Add scripts for `check` (`astro check`) and a Playwright screenshot script `npm run shots` that writes 1440/768/390 px captures of `/` and one project page to `./shots/`.

## 8. Deploy (only after I approve the local version)

- Repo `Erzn3522/erzn3522.github.io` (user site, so `base: '/'`), `site: 'https://erzn3522.github.io'` in `astro.config.mjs`.
- GitHub Actions workflow with the official `withastro/action` + `actions/deploy-pages`; repo setting Pages → Source: GitHub Actions.
- Back up the old site on a branch (`legacy-site`) before replacing it. Use forward slashes in all asset paths.
- Add `robots.txt`, sitemap, canonical URLs, Open Graph/Twitter tags, `lang="en"`.

## 9. Self-critique checklist (run before saying "done")

- Does the first screen say what he does without scrolling, on a 390px phone?
- Is the hero the only memorable thing? Did anything else sneak in decoration or motion?
- Does any text sound like a template? Rewrite it.
- Does every number on the page match the CV character for character?
- Remove one accessory: cut the least necessary element and re-look.
- Keyboard-only pass through the whole home page and one project page. Both themes. Reduced motion on.

## 10. Open questions (do not guess; leave `TODO(abdullah)` and list them in the README)

1. **Location:** the CV header says Istanbul, TR; he works in Ljubljana. Which one goes on the site? (Default: Ljubljana, Slovenia.)
2. **Robsys end date:** CV says "Mar 2024 – Present" while Pek is also "Apr 2025 – Present"; the old site said "Mar 2024 – Mar 2025". Which is right?
3. The CV lists Robsys twice (work + project). Merge into one project page; confirm.
4. The CV spells the employer "Pek Automative"; the site uses "Pek Automotive". Confirm the official spelling.
5. Which projects can have real (non-confidential) figures, and which will be synthetic?
6. Keep Medium and Bento links, or only GitHub + LinkedIn?
7. Custom domain later? (Not needed for launch.)

## 11. Definition of done (local milestone)

- `npm run dev` serves home + 5 project pages + 404 with no console errors.
- `DESIGN.md` exists with the plan and "What I changed and why".
- Screenshots at three widths reviewed and iterated.
- README has run/deploy steps and the open-questions list.
- No file contains lorem ipsum, fake logos, stock images, or unverifiable claims.