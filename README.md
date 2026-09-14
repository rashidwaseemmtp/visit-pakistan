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
| `npm run e2e` | Playwright; starts `npm run preview` itself, so run `npm run build` first |

Build for GitHub Pages with `VITE_BASE_PATH=/visit-pakistan/ npm run build`. The same
variable makes the Playwright suite exercise the sub-path.

## Content

`data/destinations.json` is the only source of destination content. It is validated by
the Zod schema in `src/content/schema.ts` at build time (`npm run validate:content`,
which `npm run build` runs first) and again when the app loads it, and the build fails
unless the file holds exactly the eight agreed destinations.

**Outstanding:** the client has supplied destination *names* only. Province, category,
best season, attractions and travel information are not present in the file and have not
been invented. Add them to `data/destinations.json` and they render with no code change —
the schema already treats them as optional and the components already display province
and category when present.

## Deployment

The GitHub Actions workflow (quality gate on pull requests, Pages deploy from `main` with
`VITE_BASE_PATH=/visit-pakistan/`) is **not yet in the repository** and has to be added by
a maintainer; this change set cannot write under `.github/`.
