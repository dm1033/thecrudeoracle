# Contributing

## Bots open pull requests

Automated jobs, including GitHub Actions that refresh EIA, CFTC, FRED and GDELT files, must open a pull request. They must not push straight to `main`.

The data workflows already do this. They push a `bot/*` branch and open or update a pull request. A person reviews the figures and merges.

Do not add `[skip ci]` to those commits. The site builds the data files into the pages, and CI should run on the pull request.

## What CI checks

`.github/workflows/ci.yml` runs on pull requests and on pushes to `main`:

- `npm run lint` (TypeScript)
- `npm run test:run`
- `node scripts/check-visitor-placeholders.mjs`
- `npm run build`

The placeholder check fails if a visitor-facing data file contains `placeholder` or `API placeholder`. The files in that check are the price board, the market snapshot, the public-data monitor, the sponsor inventory and the advertising config. Sample watchlist and company files are withheld by the pages that read them and are not in that list.

## Recommended GitHub settings

These are repository settings. This repository cannot turn them on by itself.

Under Actions → General, turn on “Allow GitHub Actions to create and approve pull requests”. The data jobs use the built-in `GITHUB_TOKEN`, and GitHub blocks that token from opening a pull request until this is on. The workflows in this repo open a pull request. They do not approve one.

On `main`, turn on branch protection (or rulesets) so a pull request still cannot merge itself:

1. Require a pull request before merging.
2. Require at least one approval. The person who opened the pull request does not count, so a data job cannot satisfy it.
3. Require the CI status check named `check` (workflow “CI”) to pass.
4. Do not allow force pushes.
5. Do not allow bypasses, including for administrators, if the aim is to stop a token that can push to `main`.

With that pair of settings, the scheduled data jobs open pull requests on `bot/*` and wait. The morning note does not wait on those pull requests: `/daily` reads the EIA API on the site, and the Vercel cron only refreshes that cache. The supply-news page does wait: its figures are in the committed monitor file, so they change when that pull request is merged.
