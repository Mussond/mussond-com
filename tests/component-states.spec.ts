import { test } from '@playwright/test';
import { injectAxe, getViolations } from 'axe-playwright';
import fs from 'node:fs';
import path from 'node:path';

// ─── Matrix dimensions ───────────────────────────────────────────────────────

const THEMES         = ['light', 'dark'] as const;
const CONTRAST_MODES = ['low', 'high']   as const;

type Theme    = (typeof THEMES)[number];
type Contrast = (typeof CONTRAST_MODES)[number];

// ─── Component scenarios ─────────────────────────────────────────────────────
//
// Each scenario describes one component on one fixture page and the states to
// cycle through. A scenario's `setup` runs once per (theme × contrast) — it
// puts the component into the desired state (rest, focus, selected) and
// returns a label for that state.
//
// Selectors are mapped to the actual DOM as it stands at start of Sprint 9.
// If the markup changes, this list is the single source of truth to update.

interface ComponentState {
  state: 'rest' | 'focus' | 'selected';
  label: string;            // human-readable, e.g. "all-button-selected"
  setup: (page: import('@playwright/test').Page) => Promise<void>;
}

interface ComponentScenario {
  component: string;        // e.g. "TagFilterList"
  route: string;            // fixture page
  states: ComponentState[];
}

// ─── State helpers ───────────────────────────────────────────────────────────

/** Reset focus + clear pressed/selected state so each scenario starts clean. */
async function resetPage(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    document.body.focus();
  });
}

/**
 * Set a radio's `checked` flag without firing the change handler. Used for
 * DisplayControls chips so we can paint the selected state without the
 * component re-applying theme/contrast and breaking the forced matrix state.
 */
async function setRadioChecked(
  page: import('@playwright/test').Page,
  selector: string,
) {
  await page.evaluate((sel) => {
    const all = document.querySelectorAll<HTMLInputElement>(sel.split(':checked-target')[0]);
    all.forEach(r => { r.checked = false; });
    const target = document.querySelector<HTMLInputElement>(sel.replace(':checked-target', ''));
    if (target) target.checked = true;
  }, selector);
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

const SCENARIOS: ComponentScenario[] = [

  // ── Skip link (rest hidden, focus visible) ─────────────────────────────
  {
    component: 'SkipLink',
    route: '/',
    states: [
      {
        state: 'focus',
        label: 'focus-visible',
        setup: async (page) => {
          await page.keyboard.press('Tab');
        },
      },
    ],
  },

  // ── Sidebar nav links (current vs non-current) ─────────────────────────
  {
    component: 'Sidebar nav',
    route: '/',
    states: [
      {
        state: 'rest',
        label: 'links-rest',
        setup: async () => { /* default DOM */ },
      },
      {
        state: 'focus',
        label: 'current-link-focus',
        setup: async (page) => {
          await page.evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>(
              '.sidebar__nav-link[aria-current="page"]'
            );
            link?.focus();
          });
        },
      },
      {
        state: 'focus',
        label: 'non-current-link-focus',
        setup: async (page) => {
          await page.evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>(
              '.sidebar__nav-link:not([aria-current="page"])'
            );
            link?.focus();
          });
        },
      },
    ],
  },

  // ── Footer nav links ───────────────────────────────────────────────────
  {
    component: 'Footer nav',
    route: '/',
    states: [
      {
        state: 'rest',
        label: 'links-rest',
        setup: async () => { /* default DOM */ },
      },
      {
        state: 'focus',
        label: 'link-focus',
        setup: async (page) => {
          await page.evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>('.footer__link');
            link?.focus();
          });
        },
      },
    ],
  },

  // ── Buttons ────────────────────────────────────────────────────────────
  // Site uses Button.astro for primary/secondary/utility variants. The
  // homepage hero CTA + nav surfaces cover all three in default rendering.
  {
    component: 'Button — primary',
    route: '/',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'focus-visible',
        setup: async (page) => {
          await page.evaluate(() => {
            const btn = document.querySelector<HTMLElement>('.btn--primary');
            btn?.focus();
          });
        },
      },
    ],
  },
  {
    component: 'Button — secondary',
    route: '/',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'focus-visible',
        setup: async (page) => {
          await page.evaluate(() => {
            const btn = document.querySelector<HTMLElement>('.btn--secondary');
            btn?.focus();
          });
        },
      },
    ],
  },
  {
    component: 'Button — utility',
    route: '/',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'focus-visible',
        setup: async (page) => {
          await page.evaluate(() => {
            const btn = document.querySelector<HTMLElement>('.btn--utility');
            btn?.focus();
          });
        },
      },
    ],
  },

  // ── Icon button (drawer trigger lives in sidebar) ──────────────────────
  {
    component: 'IconButton',
    route: '/',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'focus-visible',
        setup: async (page) => {
          await page.evaluate(() => {
            const btn = document.querySelector<HTMLElement>('.icon-button');
            btn?.focus();
          });
        },
      },
    ],
  },

  // ── Cards (homepage feeds render all three card components) ───────────
  {
    component: 'CaseStudyCard — featured',
    route: '/',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'card-link-focus',
        setup: async (page) => {
          await page.evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>(
              '.case-study-card--featured a'
            );
            link?.focus();
          });
        },
      },
    ],
  },
  {
    component: 'CaseStudyCard — secondary',
    route: '/',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'card-link-focus',
        setup: async (page) => {
          await page.evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>(
              '.case-study-card:not(.case-study-card--featured) a'
            );
            link?.focus();
          });
        },
      },
    ],
  },
  {
    component: 'GuideCard',
    route: '/',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'card-link-focus',
        setup: async (page) => {
          await page.evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>('.guide-card a');
            link?.focus();
          });
        },
      },
    ],
  },
  {
    component: 'LogCard',
    route: '/',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'card-link-focus',
        setup: async (page) => {
          await page.evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>('.log-card a');
            link?.focus();
          });
        },
      },
    ],
  },

  // ── TagFilterList (each pressed-state cycled) ──────────────────────────
  // .tag--filter buttons use aria-pressed; only one is pressed at a time.
  // States: each tag pressed in turn (including "All"), plus focus on a
  // non-pressed tag.
  {
    component: 'TagFilterList',
    route: '/guides',
    states: [
      // "All" pressed (default)
      {
        state: 'selected',
        label: 'all-pressed',
        setup: async (page) => {
          await page.evaluate(() => {
            document.querySelectorAll<HTMLButtonElement>('.tag--filter')
              .forEach(b => b.setAttribute('aria-pressed',
                b.dataset.tag === 'all' ? 'true' : 'false'));
          });
        },
      },
      // First non-"all" tag pressed
      {
        state: 'selected',
        label: 'tag-pressed',
        setup: async (page) => {
          await page.evaluate(() => {
            const buttons = document.querySelectorAll<HTMLButtonElement>('.tag--filter');
            const target = Array.from(buttons).find(b => b.dataset.tag !== 'all');
            buttons.forEach(b => b.setAttribute('aria-pressed',
              b === target ? 'true' : 'false'));
          });
        },
      },
      // Focus on a non-pressed tag
      {
        state: 'focus',
        label: 'tag-focus',
        setup: async (page) => {
          await page.evaluate(() => {
            const buttons = document.querySelectorAll<HTMLButtonElement>('.tag--filter');
            buttons.forEach(b => b.setAttribute('aria-pressed',
              b.dataset.tag === 'all' ? 'true' : 'false'));
            const target = Array.from(buttons).find(
              b => b.getAttribute('aria-pressed') === 'false'
            );
            target?.focus();
          });
        },
      },
    ],
  },

  // ── DisplayControls (footer) ────────────────────────────────────────────
  // One instance now, rendered in the footer on every page. Each contrast
  // chip selected in turn, then each theme chip, then each flourish chip.
  // Selection is applied via .checked = true (no change event) so the
  // matrix's forced theme/contrast state isn't overridden by the
  // component's own handlers.
  ...['low', 'high', 'system'].map((value): ComponentScenario => ({
    component: `DisplayControls — contrast-${value}`,
    route: '/',
    states: [
      {
        state: 'selected',
        label: `contrast-${value}-selected`,
        setup: async (page) => {
          await page.evaluate((v) => {
            const radios = document.querySelectorAll<HTMLInputElement>(
              '.display-controls--footer input[data-control="contrast"]'
            );
            radios.forEach(r => { r.checked = r.value === v; });
          }, value);
        },
      },
    ],
  })),
  ...['system', 'light', 'dark'].map((value): ComponentScenario => ({
    component: `DisplayControls — theme-${value}`,
    route: '/',
    states: [
      {
        state: 'selected',
        label: `theme-${value}-selected`,
        setup: async (page) => {
          await page.evaluate((v) => {
            const radios = document.querySelectorAll<HTMLInputElement>(
              '.display-controls--footer input[data-control="theme"]'
            );
            radios.forEach(r => { r.checked = r.value === v; });
          }, value);
        },
      },
    ],
  })),
  ...['full', 'reduced', 'raw'].map((value): ComponentScenario => ({
    component: `DisplayControls — flourish-${value}`,
    route: '/',
    states: [
      {
        state: 'selected',
        label: `flourish-${value}-selected`,
        setup: async (page) => {
          await page.evaluate((v) => {
            const radios = document.querySelectorAll<HTMLInputElement>(
              '.display-controls--footer input[data-control="flourish"]'
            );
            radios.forEach(r => { r.checked = r.value === v; });
          }, value);
        },
      },
    ],
  })),
  {
    component: 'DisplayControls — chip-focus',
    route: '/',
    states: [
      {
        state: 'focus',
        label: 'chip-focus-visible',
        setup: async (page) => {
          await page.evaluate(() => {
            const radio = document.querySelector<HTMLInputElement>(
              '.display-controls--footer input[data-control="contrast"]'
            );
            radio?.focus();
          });
        },
      },
    ],
  },

  // ── Back link (case study) ─────────────────────────────────────────────
  {
    component: 'BackLink',
    route: '/case-studies/aviva',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'focus-visible',
        setup: async (page) => {
          await page.evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>('.back-link');
            link?.focus();
          });
        },
      },
    ],
  },

  // ── Body links (prose) ─────────────────────────────────────────────────
  {
    component: 'Body link (case study prose)',
    route: '/case-studies/aviva',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'focus-visible',
        setup: async (page) => {
          await page.evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>(
              '.prose a:not([class])'
            );
            link?.focus();
          });
        },
      },
    ],
  },
  {
    component: 'Body link (about prose)',
    route: '/about',
    states: [
      {
        state: 'rest',
        label: 'rest',
        setup: async () => {},
      },
      {
        state: 'focus',
        label: 'focus-visible',
        setup: async (page) => {
          await page.evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>(
              '.prose a:not([class])'
            );
            link?.focus();
          });
        },
      },
    ],
  },
];

// ─── Result shape ────────────────────────────────────────────────────────────

interface NodeFailure {
  selector: string;
  html: string;
  fgColor?: string;
  bgColor?: string;
  contrastRatio?: number;
  expectedContrastRatio?: string;
  fontSize?: string;
  fontWeight?: string;
}

interface ViolationDetail {
  id: string;
  impact: string | null;
  description: string;
  helpUrl: string;
  nodeCount: number;
  nodes: NodeFailure[];
}

interface ScanResult {
  component: string;
  route: string;
  state: ComponentState['state'];
  stateLabel: string;
  theme: Theme;
  contrast: Contrast;
  violationCount: number;
  totalNodes: number;
  violations: ViolationDetail[];
  classification: 'clean' | 'unexpected';
  screenshotPath?: string;
}

const allResults: ScanResult[] = [];

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('Component states — interactive a11y matrix', () => {

  test.afterAll(() => {
    const outDir  = 'test-results/component-states';
    const outPath = path.join(outDir, 'component-states.json');

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2), 'utf-8');

    const clean      = allResults.filter(r => r.classification === 'clean');
    const unexpected = allResults.filter(r => r.classification === 'unexpected');

    console.log('\n============================================');
    console.log('Component states — run summary');
    console.log('============================================');
    console.log(`States tested:              ${allResults.length}`);
    console.log(`Clean (no violations):      ${clean.length}`);
    console.log(`Unexpected (Low / High):    ${unexpected.length}`);

    if (unexpected.length > 0) {
      console.log('\n--- Unexpected violations — Sprint 9.x triage candidates ---');
      for (const r of unexpected) {
        console.log(`\n  ${r.component} | ${r.stateLabel} | ${r.theme} / ${r.contrast}`);
        for (const v of r.violations) {
          console.log(`    [${v.impact ?? 'unknown'}] ${v.id} — ${v.description}`);
          for (const n of v.nodes) {
            const ratio = n.contrastRatio !== undefined
              ? ` (${n.contrastRatio.toFixed(2)}:1 vs ${n.expectedContrastRatio ?? '?'})`
              : '';
            console.log(`        ${n.selector}${ratio}`);
            if (n.fgColor && n.bgColor) {
              console.log(`          fg ${n.fgColor} / bg ${n.bgColor}`);
            }
          }
        }
      }
    } else {
      console.log('\nNo unexpected violations across interactive states.');
    }

    console.log(`\nFull results: ${outPath}`);
    console.log('Screenshots:  test-results/component-states/screenshots/');
    console.log('============================================\n');
  });

  // ─── Generate one test per (scenario × state × theme × contrast) ─────────

  for (const scenario of SCENARIOS) {
    for (const stateConfig of scenario.states) {
      for (const theme of THEMES) {
        for (const contrast of CONTRAST_MODES) {

          const testName = `${scenario.component} | ${stateConfig.label} | ${theme} / ${contrast}`;

          test(testName, async ({ page }) => {

            // 1. Suppress fadeIn animation (matches contrast-matrix pattern)
            await page.emulateMedia({ reducedMotion: 'reduce' });

            // 2. Navigate
            await page.goto(scenario.route);

            // 3. Force theme + contrast on <html>
            await page.evaluate(
              ({ t, c }) => {
                document.documentElement.className = t;
                document.documentElement.setAttribute('data-contrast', c);
              },
              { t: theme, c: contrast }
            );

            // 4. Settle (networkidle, fonts ready, double rAF)
            await page.waitForLoadState('networkidle');
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(() =>
              new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
            );

            // 5. Reset focus + run per-state setup
            await resetPage(page);
            await stateConfig.setup(page);

            // 6. Settle one more rAF after state mutation (e.g. dialog open,
            //    radio.checked → :has(input:checked) repaints)
            await page.evaluate(() =>
              new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
            );

            // 7. Screenshot per state + theme + contrast — slugged for
            //    sane filesystem layout
            const safeComponent = scenario.component
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            const screenshotDir = path.join(
              'test-results', 'component-states', 'screenshots', safeComponent
            );
            const screenshotPath = path.join(
              screenshotDir,
              `${stateConfig.label}__${theme}-${contrast}.png`
            );
            fs.mkdirSync(screenshotDir, { recursive: true });
            await page.screenshot({ path: screenshotPath, fullPage: false });

            // 8. Axe scan
            await injectAxe(page);
            const violations = await getViolations(page);

            const violationDetails: ViolationDetail[] = violations.map(v => ({
              id:          v.id,
              impact:      v.impact ?? null,
              description: v.description,
              helpUrl:     v.helpUrl,
              nodeCount:   v.nodes.length,
              nodes:       v.nodes.map(n => {
                const data = (n.any[0]?.data ?? {}) as Record<string, unknown>;
                return {
                  selector:              Array.isArray(n.target) ? n.target.join(' ') : String(n.target),
                  html:                  n.html.slice(0, 200),
                  fgColor:               data.fgColor               as string | undefined,
                  bgColor:               data.bgColor               as string | undefined,
                  contrastRatio:         data.contrastRatio         as number | undefined,
                  expectedContrastRatio: data.expectedContrastRatio as string | undefined,
                  fontSize:              data.fontSize              as string | undefined,
                  fontWeight:            data.fontWeight            as string | undefined,
                };
              }),
            }));

            const totalNodes = violationDetails.reduce((sum, v) => sum + v.nodeCount, 0);

            // 9. Classify — this sweep only covers low/high contrast (no
            //    flourish dimension), so any violation is unexpected.
            const classification: ScanResult['classification'] =
              violations.length === 0 ? 'clean' : 'unexpected';

            allResults.push({
              component:      scenario.component,
              route:          scenario.route,
              state:          stateConfig.state,
              stateLabel:     stateConfig.label,
              theme,
              contrast,
              violationCount: violations.length,
              totalNodes,
              violations:     violationDetails,
              classification,
              screenshotPath,
            });

            if (classification === 'unexpected') {
              console.warn(
                `  ⚠ Unexpected — ${scenario.component} | ${stateConfig.label} | ${theme} / ${contrast}: ` +
                violations.map(v => v.id).join(', ')
              );
            }
          });

        }
      }
    }
  }

});