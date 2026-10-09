---
title: Camera-to-arm calibration for a harvesting robot
outcome: A three-stage calibration replaced a manual procedure and reaches 5 mm max positional error (2 mm std) against a 10 mm production threshold.
order: 1
employer: Pek Automotive
period: Apr 2025 – present
tags:
  - Camera calibration
  - 3D coordinate transforms
  - Polynomial regression
  - UART
figure:
  diagram: calibration-target
  caption: Drawn to scale. The dashed circle is the 10 mm production threshold. The green disc is the 5 mm maximum positional error the calibration reaches; the inner circle is the 2 mm standard deviation.
---

<!-- Confidential employer work: describe method and outcome at CV level only. No real imagery. -->

## Problem

The harvesting robot has several arms and finds fruit with a camera. The camera reports a fruit's position in its own 3D coordinates; each arm needs that position in its own frame, within a 10 mm production threshold. Until then, the mapping was calibrated by a manual procedure.

## Approach

I designed the calibration as three stages, each correcting a different source of error:

- Per-arm 2D polynomial regression maps camera coordinates to that arm's positions.
- A linear misalignment correction removes the offset that remains between camera and arm.
- Camera tilt compensation corrects for the camera tilting while the arm extends.

Around the fit, the routine rejects outliers, validates the result with R², and retries automatically. It reports its status over UART, so operators can verify a calibration without connecting a PC.

## Result

5 mm maximum positional error with a 2 mm standard deviation, against the 10 mm production threshold. The manual procedure is gone.
