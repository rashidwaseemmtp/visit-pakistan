# Architecture deviation: Vite + React Router SPA instead of Astro 5 islands

**Status:** open — proposed, and still undecided by the architecture owner (Rashid Waseem).
Raised by US-1 code review round 1 (CRITICAL) and restated in rounds 2, 3 and 4 (HIGH), and
again by US-2 code review rounds 1 to 4 (HIGH). No change to this repository can close
it: the two options below are a choice between toolchains, and the same choice has to settle
the repository contract quoted under *Why it was not ported*. This pull request should not
merge until that decision is recorded: US-2 and US-3 both build directly on the shape chosen
here.

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
| One real HTML file per route, content in the markup | Lost. The served HTML is a shell. | None. Content fidelity is still enforced: `data/destinations.json` is the only source, Zod-validated by `npm run validate:content` during `npm run build` and again on load, against a strict schema that fails the build on an unrecognised key rather than dropping it. |
| Direct entry and refresh under `/visit-pakistan/` | Preserved | The build emits `dist/404.html` as a copy of `dist/index.html`. GitHub Pages serves it for any unmatched address, so the app boots on the requested URL with no redirect shim and no URL rewriting. `e2e/sub-path.spec.ts` now proves this against a static server that reproduces Pages' behaviour — 404.html with a 404 status, bare sub-path redirected — rather than against `vite preview`, whose SPA fallback would pass either way. |
| Pages readable with JavaScript disabled or failed | **Lost.** The destinations cannot be read without JavaScript. | Partial only: `index.html` now carries a `<noscript>` block stating that the site needs JavaScript, so a failed or blocked bundle shows a stated message instead of a blank document (`e2e/no-javascript.spec.ts`). This raises the floor; it does not restore the property, and it does not restore the baseline's cheapest route to WCAG AA. **This remains the deviation's real cost and the reason it needs ratifying.** |
| A real 404 status for unknown paths | Unchanged | Still 404, because Pages serves 404.html. The status was never ours to control. |
| Cross-island state via nanostores (US-6) | Not needed | One React root, so the favourites store can be a plain module with React state over `localStorage`, keeping the storage key `visit-pakistan:favourites:v1` and the validate-on-read behaviour the baseline specifies. |
| Shipped JavaScript budget | Larger than islands | Still a small bundle for an eight-record site; worth measuring against the 75 kB gzipped budget once US-2 to US-7 land. |

## What US-2 added to the unratified shape

Search and filters landed as `src/components/DestinationFinder.tsx`: a client-state React
component filtering an array imported into the bundle. The baseline puts the same behaviour
in a hydrated island over destination data already present in the markup, so what a visitor
with JavaScript blocked now loses is not only the list but the search field and both
filters — still only the `<noscript>` message. The filtering rules themselves
(`src/content/filters.ts`) are framework-free and carry over unchanged to either option;
what would be rewritten under option 2 is the component's state ownership, its island
boundary and the settled live region that announces the result count — roughly 180 lines
plus its test file. Each story that lands here adds a similar amount to option 2's cost,
which is the reason the decision is worth making now rather than after US-3.

The announcement is the clearest example of what re-homing would mean. The count now lives
in two elements — a visible, `aria-hidden` paragraph that changes on every keystroke, and a
visually hidden `role="status"` region holding the value settled on a 450 ms trailing timer
— both owned by one component's state. Under the baseline the same behaviour spans an
island boundary between markup rendered at build time and a hydrated control, so the timer,
the hidden paragraph and the live region would have to be re-sited together rather than
ported line for line.

## Decision needed

1. **Ratify the SPA.** Amend the architecture baseline to record Vite + React Router, the
   404.html fallback in place of per-route HTML, the loss of the no-JavaScript property
   (with the `<noscript>` message as the accepted floor), and React state in place of
   nanostores. No further code change is needed here.
2. **Reinstate Astro.** The content schema, the eight-slug build assertion, the validator
   script, the filter rules, the layout, header, list and card components carry over largely
   unchanged; the work is the Astro project setup, the route files, the island boundaries,
   and replacing the Vite/Playwright wiring — and it must be accompanied by a matching
   change to the repository contract, or the next change will drift straight back.

Either way the same decision has to settle the repository contract quoted above, which
currently mandates the toolchain the baseline rejects. Until one option is chosen, every
later story is being built on an unratified skeleton.
