// Playwright screenshot harness for the UI polish pass (styling verification only).
// Loads the running dev server, seeds a realistic populated state, and captures
// Dashboard + DSA at desktop (1440) and mobile (390) widths.
//
// Usage: `npm run dev` in one shell, then `npm run screenshots` in another.
// The `prescreenshots` npm hook runs `playwright install chromium` first, so the
// browser binary is fetched on first use (it is machine-local, not committed).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = process.env.OUT_DIR ?? 'screenshots';
mkdirSync(OUT, { recursive: true });

const now = Date.now();
// Varied scores so bars exercise all three buckets: be≈85 (strong), sd 65 / mlf 55
// (push), de 20 / dsa low / mlsd 0 / beh 0 (gap).
const DEMO_STATE = {
  companyId: 'generalist',
  dsa: {
    targetPoints: 100,
    entries: [
      { id: 'd1', name: 'Two Sum', pattern: 'Hashing', difficulty: 'easy', result: 'clean', at: now },
      { id: 'd2', name: 'Course Schedule', pattern: 'Graph', difficulty: 'medium', result: 'hint', at: now },
      { id: 'd3', name: 'Word Ladder', pattern: 'BFS', difficulty: 'hard', result: 'failed', at: now },
      { id: 'd4', name: 'LRU Cache', pattern: 'Design', difficulty: 'medium', result: 'clean', at: now },
    ],
  },
  topics: [
    { id: 'be-caching', label: 'Caching strategies & invalidation', competency: 'be', best: 90, asked: [] },
    { id: 'be-db-indexing', label: 'Database indexing & query plans', competency: 'be', best: 80, asked: [] },
    { id: 'mlf-bias-variance', label: 'Bias–variance tradeoff', competency: 'mlf', best: 55, asked: [] },
    { id: 'de-modeling', label: 'Data modeling & warehousing', competency: 'de', best: 20, asked: [] },
    { id: 'sd-caching', label: 'Caching & CDN strategy', competency: 'sd', best: 65, asked: [] },
  ],
  evals: [],
};

const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

const browser = await chromium.launch();
try {
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.addInitScript((state) => {
      localStorage.setItem('runway.state.v1', JSON.stringify(state));
    }, DEMO_STATE);
    await page.goto(BASE, { waitUntil: 'networkidle' });

    await page.getByRole('img', { name: /readiness/i }).waitFor();
    await page.screenshot({ path: `${OUT}/dashboard-${vp.name}.png`, fullPage: true });

    await page.getByRole('button', { name: 'DSA' }).click();
    await page.getByRole('heading', { name: /DSA log/i }).waitFor();
    await page.screenshot({ path: `${OUT}/dsa-${vp.name}.png`, fullPage: true });

    await page.close();
  }
  console.log(`Screenshots written to ${OUT}/`);
} finally {
  await browser.close();
}
