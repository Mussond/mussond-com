# Sprint 1 commit 1 — baseline audit

Snapshot of `main` at the start of `redesign/sprint-1-foundation`. Documents the current token surface, contrast-mode override layer, and what the gradient washes do in each of the six colour × contrast combos — so Sprint 1's later commits (especially commit 6, gradient cleanup) can be judged against a known baseline.

British English throughout. Screenshots live in `docs/redesign-audit/screenshots/`.

## Stack snapshot

| Thing | Current state |
|---|---|
| Astro | 6.1.6 |
| Tailwind | v4.2.2 (via `@tailwindcss/vite`) |
| Node in dev env | 25.8.2 (package engine: `>=22.12.0`) |
| Radix Colors | 3.0.0 |
| Icons | `lucide-astro` |
| Body font | Public Sans, self-hosted (shipped in phase 6 sprint 7, VT1) |
| Theme hook | `className = 'light' \| 'dark'` on `<html>` — not `[data-theme]` |
| Contrast hook | `[data-contrast="low" \| "high" \| "decorative"]` on `<html>` |
| No-flash script | `src/layouts/Layout.astro` lines 20–31 |

## `@theme` status

**There is no `@theme` block in the codebase.**

Tailwind v4 is imported at `src/styles/global.css:1` (`@import "tailwindcss";`) but the `@theme` directive is never used. All design tokens live as raw CSS custom properties under `:root` in `src/styles/tokens.css`.

**Implication for Sprint 1 commit 3:** the commit introduces `@theme` for the first time, rather than extending an existing block. Type tokens (`--font-serif`, `--font-sans`, `--font-mono` plus scale tokens) land inside the new `@theme` so Tailwind v4 can generate utilities against them.

## Radix imports

From `src/styles/tokens.css:1-8`:

```css
@import "@radix-ui/colors/sand.css";
@import "@radix-ui/colors/sand-dark.css";
@import "@radix-ui/colors/amber.css";
@import "@radix-ui/colors/amber-dark.css";
@import "@radix-ui/colors/amber-alpha.css";
@import "@radix-ui/colors/amber-dark-alpha.css";
@import "@radix-ui/colors/indigo.css";
@import "@radix-ui/colors/indigo-dark.css";
```

- **Sand** — warm neutrals. Pulls in all text, backgrounds, borders. Matches the phase 5 architecture spec.
- **Amber + amber-alpha** — brand. Phase 5 architecture called for a custom `--brand-*` scale anchored on `#F7CE00`; phase 6 shipped with Radix Amber instead. Hex is `#FFC53D` at step 9, slightly oranger than Dave's `#F7CE00`. Consistency with collateral would need revisiting in a later phase; out of scope for Sprint 1.
- **Indigo + indigo-dark** — **imported but never referenced anywhere else in the source** (grep confirms). Leftover from an earlier iteration. Not removed in Sprint 1 to keep this commit scope-clean; worth a follow-up.

## Semantic token overlay

Defined in `src/styles/tokens.css`. Two layers — Radix primitives → semantic tokens. Components only reference semantic tokens.

### Base / low contrast (`:root, [data-contrast="low"]` lines 46–73)

| Semantic token | Maps to | Role |
|---|---|---|
| `--color-text-primary` | `--sand-12` | Body text, headings |
| `--color-text-secondary` | `--sand-11` | Metadata, captions |
| `--color-bg-base` | `--sand-1` | Page background |
| `--color-bg-card` | `--sand-1` | Card, subtle-raised surfaces |
| `--color-bg-decorative` | `--amber-2` | Hero gradient tint, warm accent fields |
| `--color-border-subtle` | `--sand-6` | Section separators |
| `--color-border-default` | `--sand-7` | Card and input borders |
| `--color-action-bg` | `--amber-9` | Primary button fill |
| `--color-action-bg-hover` | `--amber-10` | Button hover |
| `--color-accent-selected` | `--amber-11` | — |
| `--color-action-border` | `--sand-12` | Button outline |
| `--color-action-text` | `--sand-12` | Button label |
| `--color-text-on-brand` | `--sand-12` | Text on brand action surfaces |
| `--color-focus-ring` | `--sand-12` | Focus outline (phase 6 VF2) |

Also defined here: `--gradient-brand`, see below.

### High contrast (`[data-contrast="high"]` lines 79–85)

```
--color-text-secondary:  var(--sand-12);   /* 11 → 12: merges secondary into primary */
--color-border-subtle:   var(--sand-8);    /* 6 → 8 */
--color-border-default:  var(--sand-12);   /* 7 → 12 */
--gradient-brand:        none;             /* wash suppressed entirely */
```

Body text and focus ring already at step 12 — can't go higher. Secondary text merges with primary. Borders step up hard. Gradient wash is removed.

### Decorative (`[data-contrast="decorative"]` lines 91–103)

```
--color-text-primary:    var(--sand-11);   /* 12 → 11: softer body */
--color-text-secondary:  var(--sand-10);   /* 11 → 10 */
--color-border-default:  var(--sand-6);    /* 7 → 6 */
--color-border-subtle:   var(--sand-4);    /* 6 → 4 */
--color-bg-decorative:   var(--amber-3);   /* 2 → 3: warmer tint */
--gradient-brand:        <softer stops, see below>
```

Decorative is an opt-in mode; some token pairs fail WCAG AA by design.

### Dark theme (`.dark` selector, lines 106–111)

```
--color-action-text:     var(--amber-1);
--color-text-on-brand:   var(--amber-1);
--color-action-border:   var(--sand-11);
--color-accent-selected: var(--amber-9);
```

Amber-9 is bright in both themes, so action text flips to amber-1 (nearly black) for legibility. Radix Sand dark scale flips the rest via its own dark import.

## Gradient washes — per-mode decoding (informs commit 6)

The wash is a single CSS gradient token, `--gradient-brand`, applied as `body { background-image: var(--gradient-brand); background-attachment: fixed; }` at `src/styles/base.css:21-22`. One site of use. Fixed, so it sits behind all content and doesn't scroll.

| Mode | `--gradient-brand` value | Notes |
|---|---|---|
| **light-low / dark-low** | `linear-gradient(146.49deg, amber-a4 4.17%, amber-a3 14.06%, transparent 28.36%)` | Amber alpha stops auto-flip per theme. Warm tint in top-left corner, fades to transparent over ~28% of the page diagonal. |
| **light-high / dark-high** | `none` | Explicitly suppressed. No wash. |
| **light-decorative / dark-decorative** | `linear-gradient(146.49deg, amber-a3 4.17%, amber-a2 14.06%, transparent 28.36%)` | Same geometry as low, but **softer** alpha stops. Currently *less* visible than low, not more. |

### Finding for commit 6

- **The gradient is already load-bearing in decorative mode as the sole warm-tint differentiator once high is excluded.** Removing it would leave decorative's only visual signal as the `--color-bg-decorative` token bump (`amber-3` vs `amber-2`), which is subtle.
- **The decorative gradient is currently softer than low's gradient.** So the current matrix has decorative as the *quietest* warm mode, low as the *middle*, high as bare. That's counter-intuitive — "decorative" implies *more* expressive, not less.
- **Recommended approach for commit 6:**
  1. Remove `--gradient-brand` from low (both themes) — aligns with the redesign plan's "gradient margin washes read 2021-template" diagnosis.
  2. Keep the gradient in decorative, and consider *strengthening* it (e.g. bump stops to `amber-a5 → amber-a3` or widen the fade) so decorative visibly carries more warmth than low. This preserves decorative's identity as a distinct mode and avoids the "replacement motif needed" risk flagged in `redesign-plan.md` §Risks.
  3. High stays as-is (`none`).
- **Not in scope for commit 6:** any richer replacement motif (pattern, shape, texture). If the stop-strengthening in point 2 isn't enough on review, escalate to a planning decision before merging the branch.

Screenshots in `docs/redesign-audit/screenshots/` capture the current baseline; compare against after commit 6 lands to judge whether decorative still reads distinctly.

## Radius tokens

`src/styles/tokens.css:33-34`:

```
--radius-card: 16px;
--radius-pill: 999px;
```

Two scales already. Sprint 1 commit 4's "consolidate radius tokens to 2 scales" is partly a rename/cleanup job, not a reshape.

### Consumers (grep summary)

| File | Token used | Role |
|---|---|---|
| `button.css:11` | `--radius-pill` | Primary/secondary buttons |
| `nav.css:119` | `--radius-pill` | Mobile menu toggle |
| `theme-drawer.css:57` | `--radius-pill` | Close button in drawer |
| `card.css:23, :49, :90` | `--radius-card` | Card + image slots |
| `tag.css:11` | **`--radius-xl`** | **Undefined token** — falls back to initial (0). Bug. |

### Finding for commit 4

- **`.tag` references `--radius-xl` which is not defined anywhere.** Tags currently render with square corners (initial value). Almost certainly unintended; planning copy describes tags as pills.
- Commit 4 should remap `.tag` to `--radius-pill` and delete the dangling reference. That's the only substantive change; the rest is already on the target scales.

## Phase 6 a11y touchpoints to preserve (informs commit 5)

Sprint 1 commit 5 rewrites the layout shell. These must survive:

| Touchpoint | Location | Current state |
|---|---|---|
| Skip link | `src/components/SkipLink.astro` → `#main-content` | Target `<main id="main-content">` on every page. Must stay as the first focusable element after `<body>`. |
| Mobile menu `aria-controls` | `Nav.astro:40` | `aria-controls="nav-list"`. List has matching `id`. |
| Mobile menu `aria-expanded` toggle | `Nav.astro:60` | Toggles in click handler. |
| Mobile menu `aria-label` toggle | `Nav.astro:54-56` | "Open menu" / "Close menu" swap. |
| ESC-to-close with focus return | `Nav.astro:64-72` | Handler removes `.is-open`, resets `aria-expanded`, returns focus to toggle. |
| Focus ring token | `base.css:98-102` | `outline: 3px solid var(--color-text-primary)` on `a:focus-visible`. |
| Reduced-motion guards | `base.css:26-30`, `utilities.css:39-61` | Body fade-in, link transitions, card scale-on-hover all gated behind `@media (prefers-reduced-motion: no-preference)`. |
| Forced-colours handling | `base.css:113-128` | Strips body gradient, overrides focus outline to `CanvasText`. |
| `<main id="main-content">` | `src/pages/index.astro:27` and every other page | Skip-link target anchor. Must appear on the new shell. |

Commit 5 also introduces a sidebar; the keyboard order needs to be verified as: skip link → sidebar nav → main content.

## Things noted but not in Sprint 1 scope

- Indigo Radix import unused — candidate for removal in a later cleanup commit.
- `.dark` class vs `[data-theme="dark"]` — the phase 5 spec documented `[data-theme]`, implementation shipped with class. Not worth churning now; would need a coordinated sweep of every `.dark` selector.
- Custom `--brand-*` scale anchored on `#F7CE00` (phase 5 spec) never materialised — Radix Amber is in its place. Worth a separate pass before any brand-facing collateral work.
- `--color-bg-card` currently equals `--color-bg-base` (both `sand-1`) — cards are distinguished by border, not surface tone. Noted for Sprint 2's card redesign.
- `--color-accent-selected` is defined but only used in the dark override for the tag filter's pressed state — may become redundant once Sprint 2 reworks cards.

## Build baseline

`npm run build` result recorded at end of this commit — see git log for pass/fail.
