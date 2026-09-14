# Architecture deviation: Vite + React Router SPA instead of Astro 5 islands

**Status:** proposed — needs a decision from the architecture owner (Rashid Waseem) before
US-2 and US-3 start.
**Raised by:** US-1 code review, round 1 (CRITICAL, architecture conformance).

## The approved baseline

Architecture v1, *Visit Pakistan — Prerendered Static Site (Astro + React Islands on GitHub
Pages)*, specifies Astro 5 in static mode emitting one real HTML file per route, React only
as hydrated islands, `data/destinations.json` validated with Zod and inlined into the
markup at build time, and nanostores for state that has to cross island boundaries. It
considered a Vite React SPA and rejected it, on the grounds that an SPA on GitHub Pages
needs hash URLs or a 404.html redirect hack to survive a refresh of a destination URL.

## What this repository is

Vite 6 + React 19 + React Router 7 (`BrowserRouter basename={import.meta.env.BASE_URL}`),
built into `dist/` and served by `vite preview`. `index.html` ships an empty `#root`;
the destination content is imported into the JavaScript bundle and rendered on the client.

## Why it was not ported to Astro in this round

The repository contract this work is held to fixes the toolchain in four places that an
Astro port would all replace: `vite.config.ts` reading `base` from `VITE_BASE_PATH`, the
router being `BrowserRouter` with `basename={import.meta.env.BASE_URL}`, `npm run build`
being a Vite production build into `dist/`, and `playwright.config.ts` starting the app
through `npm run preview`. That contract and the architecture baseline disagree with each
other. Reconciling them is the architecture owner's decision, not the implementer's, so
this change takes the second branch the reviewer offered: keep the SPA, record the
deviation, and pay the SPA's known costs now rather than discovering them in US-3.

## What the deviation costs, and what has been done about it

| Property the baseline relied on | Status here | Mitigation in this change |
| --- | --- | --- |
| One real HTML file per route, content in the markup | Lost. The served HTML is a shell. | None. Content fidelity is still enforced: `data/destinations.json` is the only source, Zod-validated by `npm run validate:content` during `npm run build` and again on load. |
| Direct entry and refresh under `/visit-pakistan/` | Preserved | The build emits `dist/404.html` as a copy of `dist/index.html`. GitHub Pages serves it for any unmatched address, so the app boots on the requested URL with no redirect shim and no URL rewriting. Covered by `e2e/sub-path.spec.ts`. |
| Pages readable with JavaScript disabled or failed | Lost. Nothing renders without JavaScript. | None available inside this toolchain. WCAG AA is met against the rendered DOM (axe-core and keyboard passes in the Playwright suite), but it does depend on JavaScript executing. **This is the deviation's real cost and the reason it needs ratifying.** |
| A real 404 status for unknown paths | Unchanged | Still 404, because Pages serves 404.html. The status was never ours to control. |
| Cross-island state via nanostores (US-6) | Not needed | One React root, so the favourites store can be a plain module with React state over `localStorage`, keeping the storage key `visit-pakistan:favourites:v1` and the validate-on-read behaviour the baseline specifies. |
| Shipped JavaScript budget | Larger than islands | Still a small bundle for an eight-record site; worth measuring against the 75 kB gzipped budget once US-2 to US-7 land. |

## Decision needed

1. **Ratify the SPA.** Update the architecture baseline to record Vite + React Router, the
   404.html fallback in place of per-route HTML, the loss of the no-JavaScript property,
   and React state in place of nanostores. No further code change is needed.
2. **Reinstate Astro.** The content schema, the eight-slug build assertion, the validator
   script, the layout, header, list and card components carry over largely unchanged; the
   work is the Astro project setup, the route files, the island boundaries, and replacing
   the Vite/Playwright wiring — and it must be accompanied by a matching change to the
   repository contract, or the next change will drift straight back.

Until one of those is chosen, every later story is being built on an unratified skeleton.
