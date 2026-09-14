# GitHub Pages deployment and the merge gate

The workflow below is **not in the repository**: the change set that produced this file is
not permitted to write under `.github/`. A maintainer has to commit it as
`.github/workflows/ci.yml` as part of this pull request — US-1's acceptance criteria name
the five scripts as the merge condition, US-1's fourth criterion is only verifiable once
the site is published, and every later story's gate depends on it.

## Before committing

Replace each `uses:` tag with the full commit SHA of that tag, keeping the tag as a
trailing comment. Tags are mutable; SHAs are not, and the architecture names a compromised
action as the single realistic route to injecting code into the published site:

```sh
gh api repos/actions/checkout/git/ref/tags/v4 --jq .object.sha
```

This is no longer a step that can be quietly skipped: `scripts/workflow-pins.test.ts` reads
every file under `.github/workflows/` and fails `npm run test` if any third-party `uses:`
names anything other than a 40-character commit SHA. The check is inert while no workflow
exists and starts enforcing the moment one is committed.

## `.github/workflows/ci.yml`

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      VITE_BASE_PATH: /visit-pakistan/
    steps:
      - uses: actions/checkout@v4 # pin to the full commit SHA
      - uses: actions/setup-node@v4 # pin to the full commit SHA
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
      - uses: actions/upload-artifact@v4 # pin to the full commit SHA
        if: failure()
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 14
      - uses: actions/upload-pages-artifact@v3 # pin to the full commit SHA
        with:
          path: dist

  codeql:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4 # pin to the full commit SHA
      - uses: github/codeql-action/init@v3 # pin to the full commit SHA
        with:
          languages: javascript-typescript
      - uses: github/codeql-action/analyze@v3 # pin to the full commit SHA

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: [build, codeql]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4 # pin to the full commit SHA
```

Notes:

- `VITE_BASE_PATH` is set on the whole `build` job, so the build, the Playwright preview
  server and the sub-path assertions in `e2e/sub-path.spec.ts` all use
  `/visit-pakistan/` — the shape that is actually published. It is also what gives the
  "every URL carries the base path" assertion its teeth: that test skips itself when the
  variable is unset, because with the default base it would be vacuous.
- The `npx playwright install --with-deps chromium` step is kept for the operating-system
  libraries. `npm run e2e` installs the browser binary itself, so the step is only about
  the shared libraries Chromium links against on a bare runner.
- `npm run e2e` builds again inside its own web server (see `playwright.config.ts`), which
  is a few seconds of duplicated work. The explicit `npm run build` step is kept because
  the Pages artifact is uploaded from `dist/` and because the story requires the script to
  be exercised on its own.
- The `codeql` job is the static-analysis control the architecture's control list names.
  It runs independently of `build` and both are required before `deploy`, so a finding
  blocks publication rather than being reported after the fact. `security-events: write`
  is scoped to that job only.
- There is no stored deploy token: `deploy-pages` uses the OIDC identity granted by
  `id-token: write` inside the `github-pages` environment.

## Repository settings a maintainer still has to apply

- Settings → Pages → Source: **GitHub Actions**.
- Settings → Environments → `github-pages`: restrict deployments to the `main` branch.
- Branch protection on `main`: require a pull request review, require the `build` and
  `codeql` checks, and disallow force pushes.
- Enable Dependabot for `npm` and `github-actions`; Dependabot pull requests go through the
  same gate and are reviewed rather than auto-merged.

Once the workflow is in place, the deployed site is
https://rashidwaseemmtp.github.io/visit-pakistan/ and US-1's fourth acceptance criterion
can be verified against it. Until then that criterion is unmet, not deferred.
