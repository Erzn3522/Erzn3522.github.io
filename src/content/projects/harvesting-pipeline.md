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
  - Field deployment
figure:
  diagram: pick-order
  caption: Schematic, not robot data. A fruit cluster as the camera sees it; larger circles are nearer. The numbers show a picking order that starts with the nearest fruit.
---

<!-- Confidential employer work: kept deliberately general (approved by Abdullah). No real imagery. -->

## Problem

Autonomous harvesting robots with several arms pick apples and oranges. When I took the system over, it was not operational. Fruit grows in clusters, so the hard part is picking one fruit without disturbing the ones around it.

## Approach

I owned the pipeline end to end, from the camera to the picking decision: camera calibration, object detection, depth estimation and picking logic. The picking logic decides which fruit to pick next and coordinates the arms so they can work through a cluster safely.

I also owned getting the software onto the robots and keeping it running in the field: automated installation, remote updates and log collection across the fleet, and tools to develop and test the pipeline without a robot.

Calibration and depth/detection have their own pages: [camera-to-arm calibration](/projects/camera-to-arm-calibration) and [depth and detection for clustered fruit](/projects/detection-pipeline).

## Result

The system went from non-operational to field-ready. I was the responsible computer vision engineer during its field deployments in five countries.
