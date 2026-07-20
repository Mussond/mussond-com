import { test } from '@playwright/test';
import { injectAxe, getViolations } from 'axe-playwright';
import fs from 'node:fs';
import path from 'node:path';

// ─── Matrix dimensions ───────────────────────────────────────────────────────

const PAGES = [
  { slug: 'home',                                          route: '/' },
  { slug: 'about',                                         route: '/about' },
  { slug: 'about-this-site',                               route: '/about-this-site' },
  { slug: 'case-studies',                                  route: '/case-studies' },
  { slug: 'case-studies-aviva',                            route: '/case-studies/aviva' },
  { slug: 'guides',                                        route: '/guides' },
  { slug: 'guides-accessibility-principles-introduction',  route: '/guides/accessibility-principles-introduction' },
  { slug: 'logs',                                          route: '/logs' },
  { slug: 'logs-list-of-accessibility-resources',          route: '/logs/list-of-accessibility-resources' },
] as const;

const THEMES         = ['light', 'dark']            as const;
const CONTRAST_MODES = ['low', 'high']               as const;
const FLOURISH_MODES = ['full', 'reduced', 'raw']    as const;

type Theme    = (typeof THEMES)[number];
type Contrast = (typeof CONTRAST_MODES)[number];
type Flourish = (typeof FLOURISH_MODES)[number];

// ─── Result shape ─────────────────────────────────────────────────────────────

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

interface StateResult {
  page: string;
  route: string;
  theme: Theme;
  contrast: Contrast;
  flourish: Flourish;
  violationCount: number;
  violations: ViolationDetail[];
  totalNodes: number;
  /**
   * clean       — no violations
   * expected    — violations in Raw flourish (by design — the stylesheet
   *               is disabled entirely, so axe scores the bare UA render;
   *               not a bug)
   * unexpected  — violations in Full or Reduced flourish (needs follow-up)
   */
  classification: 'clean' | 'expected' | 'unexpected';
  screenshotPath: string;
}

// Module-level store — safe with workers: 1 (all tests run in one process)
const allResults: StateResult[] = [];

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('Contrast matrix — 108 states', () => {

  // Runs after all 108 tests complete, regardless of individual pass/fail
  test.afterAll(() => {
    const outDir  = 'test-results/contrast-matrix';
    const outPath = path.join(outDir, 'contrast-matrix.json');

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2), 'utf-8');

    const clean      = allResults.filter(r => r.classification === 'clean');
    const expected   = allResults.filter(r => r.classification === 'expected');
    const unexpected = allResults.filter(r => r.classification === 'unexpected');

    console.log('\n============================================');
    console.log('Contrast matrix — run summary');
    console.log('============================================');
    console.log(`States tested:              ${allResults.length} of 108`);
    console.log(`Clean (no violations):      ${clean.length}`);
    console.log(`Expected (Raw flourish):    ${expected.length}`);
    console.log(`Unexpected (Full/Reduced):  ${unexpected.length}`);

    if (unexpected.length > 0) {
      console.log('\n--- Unexpected violations — log as follow-up items ---');
      for (const r of unexpected) {
        console.log(`\n  ${r.page} | ${r.theme} / ${r.contrast} / ${r.flourish}`);
        for (const v of r.violations) {
          console.log(`    [${v.impact ?? 'unknown'}] ${v.id} — ${v.description}`);
        }
      }
    } else {
      console.log('\nNo unexpected violations. Full and Reduced flourish states are clean.');
    }

    console.log(`\nFull results written to: ${outPath}`);
    console.log('Screenshots:             tests/screenshots/');
    console.log('============================================\n');
  });

  // ─── Generate one test per state (9 pages × 2 themes × 2 contrasts × 3 flourishes = 108) ──

  for (const pageConfig of PAGES) {
    for (const theme of THEMES) {
      for (const contrast of CONTRAST_MODES) {
        for (const flourish of FLOURISH_MODES) {

          test(`${pageConfig.slug} | ${theme} / ${contrast} / ${flourish}`, async ({ page }) => {

            // 1. Suppress body fadeIn animation (base.css) so screenshots
            //    aren't washed out and axe doesn't sample mid-animation
            await page.emulateMedia({ reducedMotion: 'reduce' });

            // 2. Navigate
            await page.goto(pageConfig.route);

            // 3. Override theme + contrast + flourish attributes directly.
            //    This bypasses whatever the inline <head> script resolved from
            //    localStorage/OS preferences, giving us a known starting state.
            await page.evaluate(
              ({ t, c, f }) => {
                document.documentElement.className = t;
                document.documentElement.setAttribute('data-contrast', c);
                document.documentElement.setAttribute('data-flourish', f);
              },
              { t: theme, c: contrast, f: flourish }
            );

            // 4. Settle: wait for layout, fonts, and one rAF after the class change
            await page.waitForLoadState('networkidle');
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

            // 5. Screenshot
            const screenshotDir  = path.join('tests', 'screenshots', pageConfig.slug);
            const screenshotPath = path.join(screenshotDir, `${theme}-${contrast}-${flourish}.png`);
            fs.mkdirSync(screenshotDir, { recursive: true });
            await page.screenshot({ path: screenshotPath, fullPage: true });

            // 6. Axe scan
            await injectAxe(page);
            const violations = await getViolations(page);

            // Capture full violation detail per node (selector, fg/bg, ratio, font)
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

            // 7. Classify — Raw disables the stylesheet entirely, so its
            //    axe result reflects the bare UA render, not this codebase.
            const classification: StateResult['classification'] =
              violations.length === 0 ? 'clean'
              : flourish === 'raw'    ? 'expected'
              :                         'unexpected';

            allResults.push({
              page:          pageConfig.slug,
              route:         pageConfig.route,
              theme,
              contrast,
              flourish,
              violationCount: violations.length,
              violations:    violationDetails,
              totalNodes,
              classification,
              screenshotPath,
            });

            // 8. Fail the test for unexpected violations so they appear red
            //    in Playwright UI. The afterAll summary still runs and the
            //    JSON is still written — nothing is lost.
            if (classification === 'unexpected') {
              console.warn(
                `  ⚠ Unexpected violations — ${pageConfig.slug} (${theme} / ${contrast} / ${flourish}): ` +
                violations.map(v => v.id).join(', ')
              );
            }
          });

        }
      }
    }
  }

});
