# Architecture

## Single-repo Option 2 model

This proof of concept uses one repository with a branch split:

- `main`
  - canonical topics
  - reusable snippets
  - assembly script
  - workflow documentation
- `release/19.9-assets`
  - release manifests
  - TOC
  - release metadata
- `release/20.0-assets`
  - release manifests
  - TOC
  - release metadata

## Flow

```text
             +----------------------+
             |        main          |
             |----------------------|
             | topics/              |
             | scripts/             |
             | docs/                |
             +----------+-----------+
                        |
                        | read canonical topics
                        v
               +--------------------+
               | build-from-branch  |
               +--------------------+
                  ^              ^
                  |              |
     read assets from branch   read assets from branch
                  |              |
                  |              |
   +--------------+---+      +---+----------------+
   | release/19.9-assets|      | release/20.0-assets|
   |--------------------|      |--------------------|
   | manifests/         |      | manifests/         |
   | assets/            |      | assets/            |
   +--------------------+      +--------------------+
```

## Assembly behavior

The build script runs on `main` and:

1. loads canonical topics from `topics/`
2. reads `manifests/book.yml`, `assets/toc.yml`, and `assets/release-metadata.yml` from the selected release branch
3. warns if release packaging references missing or mismatched `topic_id` values
4. warns if the release branch contains paths that look like canonical content
5. renders release-specific output into `dist/<release>/`

## Why this matches Option 2

- Topics are authored once.
- Release branches are packaging-only branches.
- Release-specific outputs are assembled dynamically from `main` plus the chosen release branch.
