---
title: Sprint 1.5 — MDX and page style audit
description: Audit of inline style= attributes and page-level <style> blocks across every .astro page and .mdx content file. Findings and extraction plan for commit 5.
sprint: 1.5
status: awaiting review
---

# Sprint 1.5 — Style audit

Scope: every `.astro` page file and every `.mdx` content file in `src/`. Audit covers both bare `style=` attributes and `<style>` blocks in page files that contain component-level concerns.

Default rule: extract to a named Astro component. Keep scoped only when the style is genuinely page-specific with no reuse potential and no coherent component shape.

---

## Files with no issues

These files are clean — no `style=` attributes, no page-level `<style>` blocks.

| File | Notes |
|---|---|
| `src/pages/case-studies/index.astro` | Clean |
| `src/pages/case-studies/[id].astro` | Clean |
| `src/pages/guides/[id].astro` | Clean |
| `src/pages/logs/index.astro` | Clean |
| `src/pages/logs/[id].astro` | Clean |
| `src/content/case-studies/aviva.mdx` | Clean — uses `<StatBlock>` correctly |
| `src/content/case-studies/aviva-approach-and-learnings.mdx` | Clean — prose only |
| `src/content/case-studies/checkoutcom.mdx` | Clean |
| `src/content/case-studies/coursera.mdx` | Clean — uses `<StatBlock>` correctly |

---

## Files with findings

### `src/pages/index.astro`

**`<style>` block — lines 103–170**

Six concerns in one block. The hero group is a clear component. The preview group overlaps with Sprint 2.

| Lines | Selector(s) | Issue | Proposed action |
|---|---|---|---|
| 104–109 | `.hero` | Hero section layout — flex column, gap, padding — page-level concern | Extract to `<Hero>` |
| 111 | `.hero__intro` | `max-width` constraint on intro paragraph | Part of `<Hero>` |
| 115–124 | `.hero__stance` | Instrument Serif italic display statement — typography and sizing | Part of `<Hero>` |
| 126–130 | `@media` `.hero__stance` | Mobile size override for stance | Part of `<Hero>` |
| 131–136 | `.hero__actions` | CTA button group — flex, wrap, gap | Part of `<Hero>` |
| 138–145 | `.btn--secondary` | Secondary button variant — **belongs in `<Button>`**, not here | Handled in commit 3 (`<Button>`) |
| 147–151 | `.preview` | Preview section layout — padding, border-top | Defer to Sprint 2 — see note below |
| 152–160 | `.preview__header` | Flex header row for section title + "View all" link | Defer to Sprint 2 |
| 161–168 | `.preview__link` | "View all" link style | Defer to Sprint 2 |

**Sprint 2 defer note:** `.preview`, `.preview__header`, and `.preview__link` are the precursor to Sprint 2's `<SectionHeader>` component. Extracting them now would mean building a component that Sprint 2 immediately replaces or extends. Recommendation: leave these three in `index.astro` for now and build `<SectionHeader>` properly in Sprint 2, absorbing them at that point.

**Proposed component: `<Hero>`**

Encapsulates the stance statement, intro paragraph, and CTA button pair. Content is locked per editorial decisions (`6_0_mussond-editorial-decisions.md` §P1), so no props needed for Sprint 1.5 — the component can hardcode the copy. If parametric hero content becomes a future requirement, props can be added later without changing the extraction.

---

### `src/pages/about.astro`

**`<style>` block — lines 57–111**

Two concerns: the intro wrapper and the ethos list.

| Lines | Selector(s) | Issue | Proposed action |
|---|---|---|---|
| 58–65 | `.about-intro` | Intro text block — margins, max-width, flex column | Extract to `<PageIntro>` — shared pattern with `about-this-site.astro` |
| 67–69 | `section h2` | Section heading bottom margin | Part of `<EthosList>` or move to `prose.css` |
| 71–85 | `.ethos__list`, `.ethos__item` | Ethos list layout — flex column, gap | Extract to `<EthosList>` |
| 87–99 | `.ethos__item :global(svg)`, `.ethos__item h3`, `.ethos__item p` | Icon colour, heading/body spacing inside ethos item | Part of `<EthosList>` |
| 101–110 | `.ethos__item ol`, `.ethos__item li` | Ordered list styling inside ethos item | Part of `<EthosList>` |

**Proposed components:**

- **`<PageIntro>`** — intro block with `margin-top`, `margin-bottom`, `max-width`, and optional `flex` column layout for multi-paragraph intros. Used in `about.astro` and `about-this-site.astro` (`.intro` there is identical in purpose).
- **`<EthosList>`** — the full ethos section: `<ul>` with icon + heading + body items. Accepts a list of `{ icon, heading, body }` items as props, or renders `<slot>` children if the icon import needs to stay in the page.

---

### `src/pages/about-this-site.astro`

**`<style>` block — lines 58–98**

Two concerns: the intro wrapper (matches `about.astro`) and prose section spacing.

| Lines | Selector(s) | Issue | Proposed action |
|---|---|---|---|
| 59–63 | `.intro` | Intro text block — same pattern as `.about-intro` | Extract to `<PageIntro>` (same component) |
| 65–98 | `section`, `section h2/h3/p/ul/ol/li` | Prose content spacing inside sections — margins, padding, line-height | Move to `prose.css` under `.page-content section` selector — these are generic prose layout rules, not a new component |

**Note on the prose styles:** these are spacing overrides for handwritten HTML sections (`h2`, `h3`, `p`, `ul`, `ol`, `li`). They're identical to what you'd want on any prose page. Moving them to `prose.css` with a `.page-content section` scope means all prose pages inherit them without a new component — and they stop cluttering `about-this-site.astro`.

---

### `src/pages/guides/index.astro`

**Two issues: one bare `style=` attribute and one `<style>` block.**

| Location | Issue | Proposed action |
|---|---|---|
| Line 26 — `style="margin-top: 2.5rem;"` on `<ul class="card-list">` | Bare inline style — only instance of a literal `style=` attribute across all page files | Replace with a CSS class (e.g. `.card-list--with-filter`) or use an adjacent-sibling rule in the tag-filter styles: `.tag-filter + .card-list { margin-top: 2.5rem; }` |
| Lines 43–47 — `.tag-filter`, `.tag--filter` | Tag filter button group styles — layout and border overrides | Extract to `<TagFilterList>` along with the filter `<script>` |
| Line 56 — `.card-list__item[hidden]` | Hidden state for filtered items — belongs with the filter widget or in `card.css` | Move to `card.css` (or into `<TagFilterList>` if the component owns its own hidden-item state) |

**Proposed component: `<TagFilterList>`**

Encapsulates the tag filter button group, the visually-hidden live region, the JS filter logic, and the `.tag-filter` / `.tag--filter` / `.card-list__item[hidden]` styles. Accepts `tags` (string array) and `listId` (the `id` of the card list it controls) as props. This also removes the guide-specific JS from the page file.

---

### `src/pages/404.astro`

**`<style>` block — lines 23–37**

| Lines | Selector(s) | Issue | Proposed action |
|---|---|---|---|
| 24–31 | `.nav-list` | Flex column link list | **Keep scoped** — 404-only fallback nav. No other page uses this pattern. Extracting it creates a component with one consumer and no coherent reuse case. |
| 33–36 | `.nav-list a` | Link weight and colour | **Keep scoped** — same reason. |

---

### `src/pages/case-studies/aviva/approach-and-learnings.astro`

**No `style=` or `<style>` block. One component-usage regression.**

| Line | Issue | Proposed action |
|---|---|---|
| 15 | Raw `<a href="/case-studies/aviva" class="back-link">← Aviva case study</a>` | Uses raw `<a>` with `back-link` class instead of `<BackLink>` component — the only page that does this | Replace with `<BackLink href="/case-studies/aviva" label="Aviva case study" />` — one-line fix |

---

## Extraction plan summary

Proposed new components for commit 5:

| Component | Source file(s) | What it encapsulates |
|---|---|---|
| `<Hero>` | `index.astro` | Stance, intro, CTA button pair. Content hardcoded (locked copy). |
| `<PageIntro>` | `about.astro`, `about-this-site.astro` | Intro text block — margins, max-width, column gap for multi-para. |
| `<EthosList>` | `about.astro` | Ethos `<ul>` with icon + heading + body items, list spacing. |
| `<TagFilterList>` | `guides/index.astro` | Tag filter buttons, live region, filter JS, hidden-item state. |

Not a new component — moved to existing CSS file:

| Change | Source | Destination |
|---|---|---|
| `.page-content section` prose spacing | `about-this-site.astro` | `src/styles/prose.css` |
| `.card-list--with-filter` spacing (or adjacent-sibling rule) | `guides/index.astro` inline `style=` | `src/styles/components/tag-filter.css` (created as part of `<TagFilterList>`) |
| `.card-list__item[hidden]` | `guides/index.astro` `<style>` | `src/styles/components/card.css` |

Deferred to Sprint 2:

| Concern | Reason |
|---|---|
| `.preview`, `.preview__header`, `.preview__link` in `index.astro` | Sprint 2 builds `<SectionHeader>` — absorb then, avoid building a half-baked extraction now |

Commit 3 handles:

| Concern | Reason |
|---|---|
| `.btn--secondary` in `index.astro` | Belongs in `<Button>` — commit 3 creates it and replaces all `.btn` usages |

---

## What this audit is not flagging

- Component styles in `src/styles/components/*.css` — already correctly separated
- `<style>` blocks inside `src/components/*.astro` — scoped component styles, Astro-idiomatic, no issue
- `<style>` in `src/layouts/Layout.astro` — layout-level, appropriate
