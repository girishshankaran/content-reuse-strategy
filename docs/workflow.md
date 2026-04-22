# Writer Workflow

## Canonical content

Writers add and update reusable topics only on `main`.

Examples:

- `topics/configure-ssh.md`
- `topics/configure-vlan-router.md`

Each canonical topic contains:

- stable `topic_id`
- lifecycle metadata
- retrieval metadata
- optional version blocks

## Release packaging

Release owners update packaging only on release asset branches.

Examples:

- `release/19.9-assets`
- `release/20.0-assets`

These branches contain only:

- `manifests/book.yml`
- `assets/toc.yml`
- `assets/release-metadata.yml`

## Build model

The assembly script runs from `main` and resolves:

- canonical topics from `main`
- release packaging from the selected release branch

This keeps the content source centralized while still allowing release-specific outputs.
