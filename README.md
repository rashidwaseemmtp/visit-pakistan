# visit-pakistan

A static site that lets visitors discover destinations in Pakistan. No backend, no
database, no API keys: the built site is plain HTML, CSS and JavaScript published to
GitHub Pages under the `/visit-pakistan/` sub-path.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run lint` | ESLint (TypeScript, react-hooks, jsx-a11y) |
| `npm run typecheck` | `tsc --noEmit` over the app, tests, e2e specs and scripts |
| `npm run test` | Vitest, single run |
| `npm run build` | Validates `data/destinations.json`, then builds into `dist/` |
| `npm run preview` | Serves `dist/` on port 4173 |
| `npm run e2e` | Playwright; its web server builds the site itself |

The five scripts are independent: `npm run e2e` no longer needs a previous `npm run build`,
because `playwright.config.ts` runs `npm run build && npm run preview` as its web server.
That also guarantees the `dist/` under test was built with the same `VITE_BASE_PATH` the
suite points at.

Build for GitHub Pages with `VITE_BASE_PATH=/visit-pakistan/ npm run build`, and exercise
the deployed shape with `VITE_BASE_PATH=/visit-pakistan/ npm run e2e`.

## Routing and the not-found page

The build writes `dist/404.html` as a byte-for-byte copy of `dist/index.html` (see the
`visit-pakistan:not-found-fallback` plugin in `vite.config.ts`). GitHub Pages answers any
unmatched address under the sub-path with that file, so the application boots on the
address the visitor actually asked for — no query-string redirect shim, and the URL is not
rewritten. An unknown path therefore renders this site's own *Page not found* page, and
the destination URLs US-3 adds will resolve on direct entry and on refresh. The response
status for those pages is 404 and GitHub Pages does not let us change it; that is a
platform property, not an application behaviour.

`e2e/sub-path.spec.ts` asserts the emitted `404.html`, that every URL in the built HTML
carries the base path, that the list resolves on direct entry, that an unknown path shows
the not-found page, that the base path resolves without a trailing slash, and that the page
makes no off-origin request.

## Content

`data/destinations.json` is the only source of destination content. It is validated by
the Zod schema in `src/content/schema.ts` at build time (`npm run validate:content`,
which `npm run build` runs first) and again when the app loads it, and the build fails
unless the file holds exactly the eight agreed destinations.

Because the file is bundled at build time, a malformed or missing content file fails
`npm run build` rather than producing a runtime error page. The runtime error state still
exists and is unit-tested (`src/pages/HomePage.test.tsx`), but the build check is where a
bad content file is actually caught. The error state states the problem in generic terms;
the Zod issue paths go to the browser console, not onto the page.

**Outstanding:** the client has supplied destination *names* only. Province, category,
best season, attractions and travel information are not present in the file and have not
been invented. Add them to `data/destinations.json` and they render with no code change —
the schema already treats them as optional and the components already display province
and category when present.

## Architecture

The approved architecture baseline is Astro 5 with React islands; this repository is a
Vite + React Router single-page application. That deviation, what it costs and the
decision it needs from the architecture owner are recorded in
[`docs/architecture-deviation-spa.md`](docs/architecture-deviation-spa.md). It is not
settled, and it shapes every later story.

## Deployment

The GitHub Actions workflow (quality gate on pull requests, Pages deploy from `main` with
`VITE_BASE_PATH=/visit-pakistan/`) is **not yet in the repository**: this change set cannot
write under `.github/`. The complete workflow, the action-pinning instruction and the
repository settings a maintainer must apply are in
[`docs/github-pages-deploy.md`](docs/github-pages-deploy.md) and need to be committed as
part of this pull request.
