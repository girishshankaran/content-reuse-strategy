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
```

The build performs validation checks, but they are reported as warnings so the POC can still assemble partial output.

## Purpose

This POC shows that:

- canonical topics are authored once on `main`
- release branches contain packaging only
- a single topic can render differently by release
- a topic introduced in a later release is filtered out of earlier releases
