# content-reuse-strategy

Single-repo proof of concept for **Option 2: Canonical Topics + Release-Specific Manifests**.

## Branch model

- `main`
  - canonical topics
  - reusable snippets
  - assembly script
- `release/19.9-assets`
  - manifests
  - TOC
  - release metadata
- `release/20.0-assets`
  - manifests
  - TOC
  - release metadata

## Main branch contents

```text
topics/
snippets/
scripts/
docs/
```

## Local assembly workflow

From `main`, build a release by reading canonical topics from the current branch and release assets from a target branch:

```bash
node scripts/build-from-branch.js release/20.0-assets
```

Generated output is written to:

```text
dist/<release>/
site/<release>/
```

The build performs validation checks, but they are reported as warnings so the POC can still assemble partial output.

To build all release branches into a Pages-ready site:

```bash
node scripts/build-site.js
```

That command:

- discovers `release/*-assets` branches
- assembles all releases
- generates static HTML under `site/`
- generates a release landing page at `site/index.html`

## GitHub Pages

This repo includes a GitHub Actions workflow that:

- fetches all release asset branches
- runs `node scripts/build-site.js`
- publishes `site/` to GitHub Pages

This is a POC-grade pipeline intended to demonstrate that Option 2 can be automated with:

- GitHub Actions
- branch-aware assembly from `main`
- GitHub Pages as the static publishing target

## Purpose

This POC shows that:

- canonical topics are authored once on `main`
- release branches contain packaging only
- a single topic can render differently by release
- a topic introduced in a later release is filtered out of earlier releases
