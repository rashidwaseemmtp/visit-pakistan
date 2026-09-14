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
| `npm run e2e` | Installs the Chromium binary if needed, then runs Playwright |

The five scripts named by US-1 are independent and each exits 0 on a checkout with
dependencies installed:

- `npm run e2e` installs its own browser (`playwright install chromium`), because `npm ci`
  installs `@playwright/test` but not the binaries it drives.
- `npm run e2e` also builds the site itself: `playwright.config.ts` runs
  `npm run build && npm run preview` as its web server, so no previous `npm run build` is
  needed and `dist/` always matches the `VITE_BASE_PATH` the suite points at.
- On a bare Linux machine or container the browser may still need OS libraries. CI runs
  `npx playwright install --with-deps chromium` for that; locally, run the same command
  once (it needs sudo) if Chromium fails to launch.

Build for GitHub Pages with `VITE_BASE_PATH=/visit-pakistan/ npm run build`, and exercise
the deployed shape with `VITE_BASE_PATH=/visit-pakistan/ npm run e2e`.

Unit tests sit next to the code under `src/`. Two suites under `scripts/` cover repository
configuration rather than a module: `eslint-no-raw-html.test.ts` proves the lint ban on
raw-HTML rendering, and `workflow-pins.test.ts` fails if a committed GitHub Actions
workflow references a third-party action by mutable tag instead of a commit SHA.

## Routing and the not-found page

The build writes `dist/404.html` as a byte-for-byte copy of `dist/index.html` (see the
`visit-pakistan:not-found-fallback` plugin in `vite.config.ts`). GitHub Pages answers any
unmatched address under the sub-path with that file, so the application boots on the
address the visitor actually asked for — no query-string redirect shim, and the URL is not
rewritten. An unknown path therefore renders this site's own *Page not found* page, and
the destination URLs US-3 adds will resolve on direct entry and on refresh. The response
status for those pages is 404 and GitHub Pages does not let us change it; that is a
platform property, not an application behaviour.

`e2e/sub-path.spec.ts` covers this in two layers, because they prove different things:

- Against `npm run preview` it asserts the emitted `404.html`, that every URL in the built
  HTML is root-relative and carries the base path, that the list resolves on direct entry,
  that the router renders the not-found page, that the base path resolves without a
  trailing slash, and that the page makes no off-origin request. `vite preview` has SPA
  history fallback, so these assertions exercise the application, not the host — and the
  base-path assertion is skipped when `VITE_BASE_PATH` is unset, because with the default
  base every root-relative URL starts with `/` and the check would be vacuous.
- Against a small static server that reproduces GitHub Pages' behaviour over the real
  `dist/` — unmatched addresses answered with `404.html` and a **404 status**, the bare
  sub-path redirected to its trailing-slash form — it asserts direct entry, that an unknown
  path really is answered by our own not-found page rather than by the dev server's
  fallback, that the address is not rewritten, and that `…/visit-pakistan` resolves. This
  is the layer that would fail if the `not-found-fallback` plugin were removed.

## Without JavaScript

The destinations are rendered in the browser, so the page has no content before the bundle
executes. `index.html` carries a `<noscript>` block stating that the site needs JavaScript,
so a visitor whose script is blocked or fails to load sees a stated message rather than a
blank document (`e2e/no-javascript.spec.ts` loads the built site with JavaScript disabled
and asserts it). This is a floor, not a fix: the content itself remains unavailable, which
is the cost of the architecture deviation recorded below.

## Content

`data/destinations.json` is the only source of destination content. It is validated by
the Zod schema in `src/content/schema.ts` at build time (`npm run validate:content`,
which `npm run build` runs first) and again when the app loads it, and the build fails
unless the file holds exactly the eight agreed destinations.

The schema is **strict**. A key it does not name — `best_season` for `bestSeason`,
`region` for `province`, `travel_information` for `travelInformation` — fails
`npm run build` with the offending key and the destination's index in the message, rather
than being dropped so quietly that the page looks as though the client supplied nothing
for that field. Optional fields stay optional: a record that genuinely omits one renders
without it, with no empty label and no placeholder.

Because the file is bundled at build time, a malformed or missing content file fails
`npm run build` rather than producing a runtime error page. The runtime error state still
exists and is unit-tested (`src/pages/HomePage.test.tsx`), but the build check is where a
bad content file is actually caught. The error state states the problem in generic terms;
the Zod issue paths go to the browser console, not onto the page.

### Outstanding, and what QA should do with it

The client has supplied destination *names* only. Province, category, best season,
attractions and travel information are not present in the file and have not been invented.

US-1's second acceptance criterion (name, province and category rendered
character-for-character) is therefore **satisfied in code and unverifiable in data**:
the schema treats those fields as optional, `DestinationCard` renders them when present
and omits them entirely when absent, and unit tests cover both. Add the values to
`data/destinations.json` and they render with no code change.

US-2's province and category filters read the same two fields, so they are blocked by the
same gap. With no values in the file neither filter is rendered at all — an empty select
would be a dead control — while the search, the result count, the empty state and the
clear control are fully live. The filter mechanics are unit-tested against fixture data in
`src/content/filters.test.ts` and `src/components/DestinationFinder.test.tsx`, and the two
filter tests in `e2e/destination-search.spec.ts` skip themselves with a stated reason until
the values arrive, at which point they start enforcing with no code change.

**QA handover:** do not close US-1 AC 2, or US-2's province and category criteria, as met —
there is no live instance of a province or a category on the page — and do not raise them
as defects, because the values are absent from the client's content file and REQ-019
forbids inventing them. Track them as blocked on client content. When the fuller file
arrives, the strict schema above turns a mis-named field into a build failure rather than a
silently blank card or a missing filter.

## Search and filters

The list is narrowed by a free-text search and two filters — province and category —
combined with AND: a destination is shown only if it satisfies every active criterion. The
rules live in `src/content/filters.ts`; `src/components/DestinationFinder.tsx` owns the
state, the controls and the empty state, and hands the survivors to `DestinationList`.

- Search covers the **destination name only** (`SEARCHABLE_FIELDS` in
  `src/content/filters.ts`). Whether the client expects search over attractions and travel
  information is an open question on the architecture baseline; widening it is an entry in
  that list plus a test.
- Matching is a literal, case-insensitive, whitespace-trimmed substring test and never a
  regular expression, so `.*`, `(` or `<b>` are searched for as text — and, like all
  content, rendered as text.
- Filter options are derived from the values present in `data/destinations.json` and are
  never hard-coded. A value held by a single destination is still offered. A field the file
  carries no values for renders no filter at all.
- The result count sits in a `role="status"` live region, so a change in the number of
  matches is announced; each control has a `<label>` associated by `htmlFor`.
- When nothing matches, the list is replaced by an empty state that names each active
  criterion and offers a clear control. Clearing empties the search field, returns both
  filters to their unfiltered option and moves focus to the search field — the clear
  control itself unmounts once there is nothing left to clear, so focus is placed
  deliberately rather than dropped on the document.
- Criteria are component state. They are **not** retained across navigation to a details
  page and back, and are not reflected in the URL. The story records this as an open
  question and nothing in the requirements decides it; this is the smaller of the two
  behaviours, and URL-reflected state is the change to make if the client wants a filtered
  view to be shareable (it is cheaper to add now than after US-3).

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
part of this pull request. Once it is committed, `npm run test` checks that every
third-party action in it is pinned to a full commit SHA.
