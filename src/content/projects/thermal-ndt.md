---
title: Finding hidden cracks with thermal imaging
outcome: Heated PLA parts with halogen lamps, tracked how every pixel cooled, and used Fourier analysis to find cracks under the surface and estimate how deep they are.
order: 6
employer: Gensys Automation & Machine Vision
period: Dec 2021 – Dec 2022
tags:
  - Thermography
  - Fourier analysis
  - Halcon
  - C#
interactive: thermal
figure:
  diagram: thermal-plate
  caption: "Synthetic scene, not test data. A plate with four cracks at known depths. In the thermal frame, the uneven lamp heating is as bright as the cracks; in the Fourier phase image it disappears and all four cracks stand out. The right chart shows why depth can be estimated: deeper cracks show their contrast later."
---

<!-- Sources: CV (TUBITAK-funded thermal NDT project, analytical heat diffusion model, halogen lamp + thermal camera setup, desktop app estimating subsurface defect depth in PLA parts) and Abdullah's own description (Halcon and C#, Fourier transform of cooling curves, crack detection). -->
<!-- TODO(abdullah): confirm the method wording below matches what you built. -->

## Problem

A crack under the surface of a part is invisible to a normal camera, and cutting the part open destroys it. This research project set out to find defects inside PLA parts without damaging them, and to say how deep each one is.

## Approach

I led the project.

- **Test setup.** Halogen lamps heat the surface of the part for a moment; a thermal camera records how it cools.
- **Heat diffusion model.** I modelled the heat flow analytically. Heat moves from the surface into the part; where a crack blocks it, the surface above stays warmer for longer. The deeper the crack, the later this shows up.
- **Fourier analysis of the cooling curves.** Every pixel's cooling curve goes through a Fourier transform. The phase of the result does not depend on how strongly that pixel was heated, so uneven lamp heating drops out and the cracks stand out.
- **Desktop application in Halcon and C#.** It computes the cooling curves and phase images, marks the cracks, and estimates the depth of each one.

## Result

A desktop application that finds cracks under the surface of PLA parts and estimates their depth, built on a test setup and heat diffusion model I developed for the project.

<!-- TODO(abdullah): add a number if you have one (smallest or deepest crack found, depth estimate error). -->

## What I would do next

<!-- TODO(abdullah): this section is a draft. Confirm or rewrite. -->

Compare the depth estimates with cut-open samples, so the method's depth error can be stated as a number.
