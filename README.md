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

Automated checks run via `npx @axe-core/cli` on each sprint branch before merge.

## Licence

Content © Dave Musson. Code: MIT.
