---
title: Depth and detection for clustered fruit
outcome: Replaced peak-based depth with a front-surface search, made exposure follow changing sunlight, and retrained YOLO segmentation on occluded clusters from 700 GB of field recordings.
order: 3
employer: Pek Automotive
period: Apr 2025 – present
tags:
  - Intel RealSense D435
  - YOLO instance segmentation
  - Depth sensing
  - Exposure control
figure:
  diagram: depth-histogram
  caption: Schematic, not measured data. Depth values inside one fruit's mask. The fruit's body and the leaves behind it pull the histogram peak away from the camera; the front-surface search takes the first strong bin instead.
---

<!-- Confidential employer work: describe method and outcome at CV level only. No real imagery. -->
<!-- Phase 2 slot (not built): a browser-side ONNX Runtime Web demo running a small detector on a bundled sample image could live on this page. -->

## Problem

The robot measures fruit depth with an Intel RealSense D435. Taking the peak of the depth values inside a fruit's mask overestimated depth systematically, because of the fruit's round shape and the foliage around it. Outdoors, changing sunlight overexposed the infrared and depth frames. And the detector struggled with fruit partly hidden in a cluster.

## Approach

- **Depth.** A histogram front-surface search replaces the peak, and fruit pixel masking keeps foliage out of the estimate. I also corrected the perspective-projection bias in fruit diameter estimation.
- **Exposure.** A saturation-based controller adapts faster than the default auto-exposure when sunlight changes.
- **Detection.** A semi-automated annotation workflow over 700 GB of field recordings, then YOLO instance segmentation models retrained on occluded fruit clusters.

## Result

Less systematic overestimation of fruit depth, fewer overexposed infrared and depth frames, and better detection of partially visible fruit.

<!-- TODO(abdullah): add a number for any of these if one can be shared. -->

## What I would do next

<!-- TODO(abdullah): this section is a draft written from the CV. Confirm or rewrite. -->

Measure each change on a held-out set of field recordings with known distances, so the improvements can be stated as numbers.
