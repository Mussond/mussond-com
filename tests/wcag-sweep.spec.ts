import { test } from '@playwright/test';
import { injectAxe, getViolations } from 'axe-playwright';
import fs from 'node:fs';
import path from 'node:path';

// ─── Routes under test ────────────────────────────────────────────────────────

const PAGES = [
  { slug: 'home',                                          route: '/' },
  { slug: 'about',                                         route: '/about/' },
  { slug: 'case-studies',                                  route: '/case-studies/' },
  { slug: 'case-studies-checkoutcom',                      route: '/case-studies/checkoutcom/' },
  { slug: 'case-studies-coursera',                         route: '/case-studies/coursera/' },
  { slug: 'case-studies-aviva',                            route: '/case-studies/aviva/' },
  { slug: 'guides',                                        route: '/guides/' },
  { slug: 'guides-accessibility-principles-introduction',  route: '/guides/accessibility-principles-introduction/' },
  { slug: 'logs',                                          route: '/logs/' },
  { slug: '404',                                           route: '/404' },
] as const;

const THEMES = ['light', 'dark'] as const;
type Theme   = (typeof THEMES)[number];

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

interface PageResult {
  page: string;
  route: string;
  theme: Theme;
  violationCount: number;
  totalNodes: number;
  violations: ViolationDetail[];
}

const allResults: PageResult[] = [];

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('WCAG 2.0/2.1/2.2 AA sweep — all routes × light/dark', () => {

  test.afterAll(() => {
    const outDir  = 'test-results';
    fs.mkdirSync(outDir, { recursive: true });

    // One JSON per theme — matches the axe-cli filename convention so existing
    // tooling and conversation history stays consistent
    for (const theme of THEMES) {
      const themeResults = allResults.filter(r => r.theme === theme);
      const outPath      = path.join(outDir, `axe-playwright-${theme}.json`);
      fs.writeFileSync(outPath, JSON.stringify(themeResults, null, 2), 'utf-8');
    }

    // Console summary
    const totalViolations = allResults.reduce((sum, r) => sum + r.totalNodes, 0);
    const cleanPages      = allResults.filter(r => r.violationCount === 0);
    const dirtyPages      = allResults.filter(r => r.violationCount > 0);

    console.log('\n============================================');
    console.log('WCAG sweep — run summary');
    console.log('============================================');
    console.log(`States tested:              ${allResults.length} (${PAGES.length} pages × ${THEMES.length} themes)`);
    console.log(`Clean states:               ${cleanPages.length}`);
    console.log(`States with violations:     ${dirtyPages.length}`);
    console.log(`Total node-level failures:  ${totalViolations}`);

    if (dirtyPages.length > 0) {
      console.log('\n--- Per-state breakdown ---');
      for (const r of dirtyPages) {
        const ruleSummary = r.violations
          .map(v => `${v.id}(${v.nodeCount})`)
          .join(', ');
        console.log(`  ${r.page} | ${r.theme}: ${r.totalNodes} nodes — ${ruleSummary}`);
      }
    } else {
      console.log('\nAll states clean. No WCAG violations detected.');
    }

    console.log(`\nResults written to:`);
    for (const theme of THEMES) {
      console.log(`  test-results/axe-playwright-${theme}.json`);
    }
    console.log('============================================\n');
  });

  // ─── One test per (page × theme) — 10 × 2 = 20 states ────────────────────

  for (const pageConfig of PAGES) {
    for (const theme of THEMES) {

      test(`${pageConfig.slug} | ${theme}`, async ({ page }) => {

        // 1. Navigate
        await page.goto(pageConfig.route);

        // 2. Force the theme class — bypasses no-flash script timing issues
        //    that broke the axe-cli baseline. Contrast stays at site default
        //    (low) since this is a flat AA sweep, not the contrast-mode matrix
        await page.evaluate(
          (t) => {
            document.documentElement.className = t;
          },
          theme
        );

        // 3. Settle: wait for fonts, layout, and one rAF after the class change
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

        // 4. Inject axe and run with the WCAG tag set
        await injectAxe(page);
        const violations = await getViolations(page, undefined, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          },
        });

        // 5. Capture full violation detail (not just summary) so we can debug
        //    failing pairs without re-running
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

        allResults.push({
          page:           pageConfig.slug,
          route:          pageConfig.route,
          theme,
          violationCount: violations.length,
          totalNodes,
          violations:     violationDetails,
        });

        if (totalNodes > 0) {
          const ruleSummary = violationDetails.map(v => `${v.id}(${v.nodeCount})`).join(', ');
          console.warn(`  ⚠ ${pageConfig.slug} (${theme}): ${totalNodes} nodes — ${ruleSummary}`);
        }
      });

    }
  }

});