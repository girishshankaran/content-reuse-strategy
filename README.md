# content-reuse-strategy

Release asset branch for `19.9`.

## Branch role

This branch is packaging-only. It is intended to be read together with `main`.

Contents on this branch:

- `manifests/book.yml`
- `assets/toc.yml`
- `assets/release-metadata.yml`

Canonical topics do not live here. They remain on `main`.

## How this branch is used

Build from `main` and resolve release packaging from `release/19.9-assets`.

This branch should not contain:

- `topics/`
- `snippets/`
- `scripts/`
- `docs/`
