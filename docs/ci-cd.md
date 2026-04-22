# CI/CD and Pages

## Goal

Publish the Option 2 proof of concept automatically using:

- GitHub Actions
- GitHub Pages

## Pipeline behavior

The workflow runs on:

- pushes to `main`
- pushes to `release/*-assets`
- manual dispatch

## Build steps

1. Check out `main`
2. Fetch all branches
3. Discover `release/*-assets` branches
4. For each release branch:
   - read canonical topics from `main`
   - read release packaging from the target branch
   - generate:
     - Markdown output in `dist/<release>/`
     - HTML output in `site/<release>/`
5. Generate `site/index.html`
6. Publish `site/` to GitHub Pages

## Why this works for the POC

- The assembled output is static
- Release branches already contain all required packaging files
- `main` already contains the canonical source topics and assembly logic

## Limits

This is still a POC:

- the HTML renderer is intentionally simple
- search is not implemented
- no version selector UI beyond simple links
- no enterprise publishing workflow integration
