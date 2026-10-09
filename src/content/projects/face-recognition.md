---
title: Face recognition with stereo liveness on Jetson Nano
outcome: 98% accuracy, 30% fewer false positives, and face embeddings stored in 4 KB on-device.
order: 5
employer: Doğru Holding (DGR Project)
period: May 2023 – Dec 2023
tags:
  - Jetson Nano
  - C++
  - TensorFlow
  - Stereo vision
figure:
  diagram: depth-profile
  caption: Schematic. Depth sampled at facial keypoints from a stereo pair. A real face has relief, with the nose nearest; a printed photo is nearly flat. The liveness model learns this difference.
---

## Problem

Face recognition had to run on a Jetson Nano, store each face compactly on the device, and reject spoofing attempts.

## Approach

- **Recognition on the edge.** The system runs on a Jetson Nano and stores face embeddings in 4 KB on-device.
- **Stereo liveness, built from scratch.** Per-keypoint facial depth profiles from a stereo camera, a labelled real vs. spoofed dataset I collected, and a lightweight TensorFlow model that rejects spoofing attempts.
- **Real time on constrained hardware.** Performance-critical components in C++, exposed to the Python pipeline as native extensions.

## Result

98% accuracy and 30% fewer false positives, with face embeddings stored in 4 KB on-device.

## What I would do next

<!-- TODO(abdullah): this section is a draft written from the CV. Confirm or rewrite. -->

Test liveness against more spoof types, such as screens and printed masks, and report the rejection rate for each.
