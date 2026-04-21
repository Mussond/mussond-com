# mussond.com

Personal portfolio and writing site for Dave Musson — design systems and accessibility specialist.

**Live site:** [mussond.com](https://mussond.com)

## Stack

- [Astro 6](https://astro.build) — static site generator
- [Tailwind CSS v4](https://tailwindcss.com) — utility styles
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

Automated checks run on each sprint branch before merge. URLs are listed in .axe/urls.txt; a 1000ms load-delay avoids false positives where axe runs before CSS has painted. With the dev server running, run npm run axe and redirect the output, e.g.:

`npm run axe > .axe/sprint-3.7-2026-04-21.log 2>&1`

## Licence

Content © Dave Musson. Code: MIT.
