---
title: Autonomous navigation for a cleaning robot
outcome: Built SLAM, pathfinding and obstacle avoidance from scratch, because off-the-shelf SLAM frameworks did not run on the robot's hardware.
order: 4
employer: Robsys Robotic Systems
period: Mar 2024 – Mar 2025
tags:
  - SLAM
  - NVIDIA Jetson
  - Sensor fusion
  - UART
figure:
  diagram: occupancy-grid
  caption: Schematic, not robot data. An occupancy grid of two rooms joined by a doorway. Filled cells are obstacles; the green line is a planned path from the robot to a goal.
---

## Problem

A cleaning robot had to map rooms, plan routes and avoid obstacles on its own. The off-the-shelf SLAM frameworks did not run on its hardware.

## Approach

- **Navigation from scratch.** Custom SLAM, pathfinding and obstacle avoidance.
- **Sensor fusion on NVIDIA Jetson.** Stereo cameras, gyroscopes and ultrasonic sensors in one pipeline, custom deep learning models for environmental perception, and low-level firmware for sensor synchronization and motor control.
- **Talking to the robot.** A UART protocol, co-designed with an embedded engineer, for two-way data exchange between the robot's motherboard and its subsystems.
- **Remote operation.** Real-time telemetry and camera streaming into a mobile app for monitoring, control and safety operations.

## Result

A navigation system that runs on the robot's own hardware, with live telemetry and camera streaming to a mobile app.

<!-- TODO(abdullah): add a number (coverage, map accuracy, runtime) if one can be shared. -->

## What I would do next

<!-- TODO(abdullah): this section is a draft written from the CV. Confirm or rewrite. -->

Benchmark the custom SLAM against a reference trajectory on recorded runs, to see where map drift comes from.
