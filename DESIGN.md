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
