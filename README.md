# erzn3522.github.io

Portfolio of Abdullah Erzin, computer vision engineer. Astro, TypeScript, plain CSS. No analytics, no third-party scripts, fonts self-hosted.

- Brief: [`INITIAL.md`](INITIAL.md)
- Design plan and decisions: [`DESIGN.md`](DESIGN.md)
- Source of truth for every fact: `Abdullah Erzin – CV.pdf`, published as [`/cv.pdf`](public/cv.pdf)

## Run locally

Requires Node 22.12 or newer.

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # astro check (types, templates)
npm run build      # static site in ./dist
npm run preview    # serve ./dist
```

Astro 7 runs the dev server in the background. `npx astro dev status` shows it, `npx astro dev stop` stops it.

### Screenshots

With the dev or preview server running:

```bash
npx playwright install chromium   # once
npm run shots                     # or: npm run shots -- --base http://localhost:4322
```

Writes `/` and one project page at 1440, 768 and 390 px to `./shots/`, in light, dark and reduced-motion variants, plus a hover capture of the hero. The script exits non-zero if the browser logs a console error.

### OG image and touch icon

`npm run og` regenerates `public/og.png` and `public/apple-touch-icon.png` from the calibration-board motif.

## Where things are

| Path | What |
|---|---|
| `src/lib/scene.ts` | Seeded stereo orchard scene: geometry, disparity, colormap, canvas and SVG drawing |
| `src/scripts/hero.ts` | Interactive canvas (divider, boxes, keyboard, reduced motion) |
| `src/components/HeroScene.astro` | Hero figure: SVG fallback, canvas, caption, legend |
| `src/content/projects/*.md` | Project pages (frontmatter: title, outcome, order, employer, period, tags, figure) |
| `src/components/figures/` | Schematic SVG figures, one per project |
| `src/data/experience.ts` | Timeline, education, skills |
| `src/lib/site.ts` | Name, email, links |

To add a project: add a Markdown file to `src/content/projects/`. Without `figure.diagram` the page shows a visible "Figure to come" placeholder.

## Confidentiality

Pek Automotive work is employer work. The site uses only synthetic scenes and schematic diagrams for it, and describes method and outcome at the level of the CV. **Confirm with employer before adding real field imagery.**

## Deploy (only after the local version is approved)

1. Back up the current site: in `Erzn3522/erzn3522.github.io`, push the existing `main` to a branch called `legacy-site`.
2. Replace `main` with this project and push. `astro.config.mjs` already sets `site: 'https://erzn3522.github.io'` and `base: '/'`.
3. Repo settings → Pages → Source: **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds with `withastro/action` and publishes with `actions/deploy-pages`.
4. Check `https://erzn3522.github.io/`, `/cv.pdf`, a project page, and a missing URL (the 404 page).

`robots.txt`, the sitemap, canonical URLs, Open Graph/Twitter tags and `lang="en"` are in place.

## Where the CV and the brief disagree

The PDF in this repo is newer than the summary in `INITIAL.md`. The site follows the CV, as the brief asks:

- Location is **Logatec, Slovenia** (CV header), not Ljubljana or Istanbul.
- Robsys is **Mar 2024 – Mar 2025**, and appears once.
- The CV spells **Pek Automotive**.
- "−60% calibration time", "±5mm", "gradient boosting" and "custom linear regression" are not in the CV and are not on the site. The calibration number is "5 mm max positional error (2 mm std) against a 10 mm production threshold".
- Numbers are written as the CV writes them: `4 KB`, `30 ms`.
- Projects: the brief's "stereo calibration" and "camera-to-arm transform" are one piece of work in the CV and became one page. The freed slot is the end-to-end perception-to-picking pipeline.
- Skills follow the CV's groups (no scikit-learn; adds Docker, RealSense, Linux and others).

## Open questions for Abdullah

Search the source for `TODO(abdullah)` to find each one in place.

1. **Medium link.** It is not in the CV. Keep it, or show only GitHub and LinkedIn? (Currently shown; Bento was removed on request.) `src/lib/site.ts`
2. **"What I would do next" sections.** All five are drafts written from the CV. Confirm or rewrite each one.
3. **Numbers you can share.** Depth/detection and navigation pages have no metric in the CV. Add one if you can.
4. **Real figures.** Which projects can have real, non-confidential figures? All five are schematics for now.
5. **AR face filter side project** (CV, Projects section). Not on the site. Add as a sixth project?
6. **Contact email subject.** The mailto subject is "Hello from erzn3522.github.io". Change it if you prefer.
7. **Custom domain later?** Not needed for launch.

Answered by the CV: location (1), Robsys end date (2), Robsys listed once (3), "Pek Automotive" spelling (4).
