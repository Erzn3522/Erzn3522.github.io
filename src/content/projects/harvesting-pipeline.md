---
title: Perception-to-picking pipeline for harvesting robots
outcome: Took a non-operational multi-arm apple and orange harvester to field-ready operation, and was the responsible computer vision engineer for its field deployments in five countries.
order: 2
employer: Pek Automotive
period: Apr 2025 – present
tags:
  - Object detection
  - Depth estimation
  - Picking logic
  - Linux fleet deployment
figure:
  diagram: pick-order
  caption: Schematic, not robot data. A fruit cluster as the camera sees it; larger circles are nearer. The numbers are the picking order, frontmost first, with a rescan after each pick.
---

<!-- Confidential employer work: describe method and outcome at CV level only. No real imagery. -->

## Problem

Autonomous harvesting robots with several arms pick apples and oranges. When I took the system over, it was not operational. Fruit grows in clusters, so a pick can damage the fruit next to it, and the same fruit can be targeted twice.

## Approach

I owned the pipeline end to end: camera calibration, object detection, depth estimation and picking logic.

- **Picking logic for clusters.** Dual-arm coordination, frontmost-first picking with rescans, and re-identification of each fruit by diameter and position, so no fruit is picked twice and its neighbours are left intact.
- **Production deployment on the Intel NUC fleet.** Automated Ubuntu image builds (autoinstall and post-install provisioning), systemd service management, remote deployment and log collection, and Linux camera driver debugging.
- **Development without hardware.** A robot simulation mode and field-log replay tools.

Calibration and depth/detection have their own pages: [camera-to-arm calibration](/projects/camera-to-arm-calibration) and [depth and detection for clustered fruit](/projects/detection-pipeline).

## Result

The system went from non-operational to field-ready. I was the responsible computer vision engineer during its field deployments in five countries.

## What I would do next

<!-- TODO(abdullah): this section is a draft written from the CV. Confirm or rewrite. -->

Turn the field-log replay tools into a regression suite, so every change to detection or picking logic is scored against recorded field runs before it reaches a robot.
