---
title: Docker and CI/CD for a private side project
outcome: Building an unreleased side project with reproducible Docker environments and an automated CI/CD workflow for validating, building and delivering changes. Product details remain private until launch.
order: 8
employer: Independent side project
period: In development
tags:
  - Docker
  - CI/CD
  - GitHub Actions
  - Linux
  - Git
figure:
  diagram: pipeline-stages
  caption: Generic stages of the workflow, shown without any details of the product.
---

<!-- Confidential and unreleased. Do not describe what the product does, its users, data, architecture, tools beyond the tags Abdullah listed, or launch plans. No repository, demo or screenshots. -->
<!-- The CI/CD tool could not be verified from a repository; the body stays tool-agnostic and "GitHub Actions" appears only in the tags Abdullah provided. -->

I am developing an independent side project whose product details are not yet public. The application itself stays confidential, but the project gives me hands-on responsibility for the infrastructure and delivery workflow around a real, evolving codebase.

## Reproducible environments

I use Docker to keep development and runtime environments consistent and repeatable. Dependencies and execution requirements are defined alongside the code, which reduces environment-specific problems and makes builds easy to reproduce.

## Automated delivery workflow

A CI/CD pipeline validates changes and automates the build and delivery process. It lets me practise treating testing, packaging and deployment as part of the software itself rather than as manual steps after development.

## What this project involves

- Containerising an application with Docker
- Reproducible development and runtime environments
- Building and maintaining a CI/CD workflow
- Automated validation and build steps
- Managing configuration and secrets without committing sensitive values

## Current status

The project is under active development and has not been publicly released. More information may follow after launch.
