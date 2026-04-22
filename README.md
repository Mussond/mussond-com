# mussond.com

Personal portfolio and writing site for Dave Musson — design systems and accessibility specialist.

**Live site:** [mussond.com](https://mussond.com)

## Stack

- [Astro 6](https://astro.build) — static site generator
- [Tailwind CSS v4](https://tailwindcss.com) — utility styles
- Modes: Light | Dark | System
- Contrast: Low | High | Decorative | System
- Content collections — case studies, writing, logs
- Deployed via GitHub Pages

Requires Node 22+.

## Local development

```sh
npm install
npm run dev        # dev server at localhost:4321
npm run build      # production build to ./dist/
npm run preview    # preview the build locally
```

## Accessibility

This site targets WCAG 2.2 AA conformance. Known issues and the accessibility statement are at [mussond.com/about-this-site](https://mussond.com/about-this-site).

Automated checks run on each sprint branch before merge. URLs are listed in .axe/urls.txt; a 1000ms load-delay avoids false positives where axe runs before CSS has painted. With the dev server running, run npm run axe:

`npm run axe`

## Contrast matrix

Tests 54 states: 9 pages × 2 themes (light, dark) × 3 contrast modes (low, high, decorative).

With the dev server running (`npm run dev`), in a second terminal:

​```sh
npm run test:contrast        # full matrix run with console summary
npm run test:contrast:ui     # same run in the Playwright UI (easier to inspect failures)
​```

Screenshots are written to `tests/screenshots/[page]/[theme]-[contrast].png` on each run. Full results are written to `test-results/contrast-matrix.json`. Neither is committed to the repo.

**Reading the output:**

- `clean` — no axe violations in that state
- `expected` — violations in Decorative mode; this mode intentionally drops below WCAG AA, so these are by design
- `unexpected` — violations in Low or High contrast mode; these are real bugs and should be logged as follow-up items

Decorative mode failures are never bugs. Low or High mode failures always are.


## Licence

Content © Dave Musson. Code: MIT.
