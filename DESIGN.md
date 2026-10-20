# DESIGN.md — "Point Cloud" (prototype, branch `redesign-pointcloud`)

A third direction, made from scratch: nothing from "Calibration", "Approach" or "Replay" is reused except
the facts (CV, project pages) and the interactive explainers that live inside project pages.

## Idea
Robots see the world as points; his job is to make those points right. The whole home page is one live
WebGL point cloud (42k points, raw WebGL2, no library) that rebuilds itself, scene by scene, as you scroll:
orchard → picking (live distance labels on each apple) → camera, arm and tolerance rings → fruit cluster and
depth histogram → occupancy map and path → a face with relief next to a flat photo → a thermal plate with four
cracks → attention arcs → his name.

- **Depth is the colour.** Every point is coloured by its real distance to the camera (turbo colormap) on
  every frame, so turning the camera recolours the scene. Hold anywhere, press Space, or use the
  "Camera view" toggle to see the scene's own colours instead (the thermal plate turns to an iron palette).
- **Measured, not drawn.** Labels on apples show the live camera-to-fruit distance in metres.
- **Honest.** Every scene is synthetic and seeded; the caption says so. No employer data or imagery.

## System
- Colour: pure black (empty sensor space), off-white `#f1f0ea` text, muted `#a3a29b`, one UI accent `#ff6a3d`
  (the near end of the colormap). All other colour comes from the data.
- Type: Bricolage Grotesque Variable only. Display at `wdth 75 / wght 750`, tight leading; text at default
  optical size. No mono, no all-caps labels, no arrows on buttons.
- Layout: copy pins in the lower half of the screen while its scene holds, then hands over to the next one.
  One real number per chapter, set huge with `mix-blend-mode: difference` over the cloud.
- Motion: one orchestrated system (dissolve-and-reform morph per chapter, camera eases between framings,
  pointer parallax, a slow idle drift and a per-point sensor jitter). Reduced motion: no drift, no parallax,
  scenes swap instead of morph.
- No WebGL: the page is plain readable text on black.

## Intro: Q7, the survey robot (overlay on the home page, branch `feature/intro-calibration`)
- **Idea:** before the portfolio, a small wheeled robot made of the same points rolls in with a clipboard and
  asks four questions, like a street surveyor. Replies come from a pool (dry engineer, self-deprecating,
  dramatic AI), one picked at random per answer. At the end it reads your "profile", waves, and dissolves
  into the orchard, which is the first scene of the home page.
- **Signature:** the robot is rigged. Twelve rigid parts (head, eyes, LED mouth, antenna, wheels, arms,
  clipboard, pen) move by per-part matrices in the same shader as the home cloud. Wheels spin with the
  distance travelled; the antenna is a spring; it looks at the pointer, reads the clipboard, ticks the box.
- **Subtitles** sit bottom centre on a black scrim; answers are pill buttons that fill on hover.
- **Sound:** all synthesised (Web Audio): typewriter key per character, robot voice blip per syllable,
  carriage bell at the end of a line, pen scratch, wheel motor. Off until the first click; toggle bottom left.
- **Hand-over:** shown on every visit (a `#hash` link skips it, and so does the corner button). The home loop waits; the intro ends on the home page's first frame (same orchard seed, same
  point count from `deviceCloudOpts()`, same camera formula and pointer), then the home loop starts from that
  pointer with no easing and the overlay is removed in the same frame. The hero copy fades in after.
- **Reduced motion:** no roll-in, no gestures, text appears whole, no dissolve. **No WebGL:** subtitles only.
