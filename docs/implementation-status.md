# Implementation Status

This document maps the current proof of concept against the Option 2 design described in the versioning strategy document.

## Implemented

- Canonical topics live only on `main`
- Release-specific packaging lives on `release/*-assets` branches
- No canonical topic duplication across release branches
- Lifecycle metadata exists on canonical topics
  - `topic_id`
  - `introduced_in`
  - `updated_in`
  - `deprecated_in`
  - `status`
  - `replaced_by`
  - `applies_to`
- Retrieval metadata exists on canonical topics
  - `is_canonical`
  - `dedupe_key`
  - `allow_in_ai_results`
- Version-aware rendering using section-level version blocks
- Build model that assembles:
  - canonical topics from `main`
  - manifests, TOC, and release metadata from a selected release branch
- Release-specific filtering using lifecycle metadata
- Stable release references using `topic_id` instead of filenames
- Warning-only validation for:
  - missing `topic_id` references
  - TOC and manifest drift
  - canonical-looking paths in release branches
- Repo documentation for:
  - writer workflow
  - architecture
  - branch roles

## Partially implemented

- Build pipeline concept
  - implemented as a local Node.js script
  - not implemented as CI/CD automation
- Branching strategy
  - represented in the repo and branch layout
  - not automated through branch bootstrap tooling

## Not yet implemented

- CI/CD build and publish pipeline
- Deployment to release-specific URLs such as `/19.9/` and `/20.0/`
- Optional `/latest/` publishing flow
- Metadata schema validation and linting
- Full inline annotation model beyond current version block support
- AI retrieval and indexing pipeline
- Version selector UI
- `replaced_by` / supersession logic
- Dynamic changelog or release-note generation
- Branch protection or policy enforcement automation

## Summary

The current POC implements the core Option 2 architecture:

- one canonical content branch
- release asset branches
- lifecycle-aware filtering
- version-aware rendering
- build from `main` plus a selected release branch

The remaining gaps are mostly production concerns:

- automation
- validation rigor
- publishing
- retrieval
- UI integration
