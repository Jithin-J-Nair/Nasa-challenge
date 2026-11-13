process.env.AWS_EXECUTION_ENV ||= 'AWS_Lambda_nodejs22.x';
const [{ chromium }, { default: chromiumLambda }] = await Promise.all([
  import('playwright-core'),
  import('@sparticuz/chromium'),
]);

interface ArchiveTreeState {
  cards: number;
  timelineCards: number;
  sideCards: number;
  ambientCanvases: number;
  headingCharacters: number;
  storyChapters: number;
  storyRouteLinks: number;
}

const browser = await chromium.launch({
  executablePath: await chromiumLambda.executablePath(),
  headless: true,
  args: chromiumLambda.args,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const failures: string[] = [];
page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') failures.push(`console error: ${message.text()}`);
});

const archiveTreeState = (): Promise<ArchiveTreeState> => page.evaluate(() => ({
  cards: document.querySelectorAll('#grid .acard').length,
  timelineCards: document.querySelectorAll('#track .tlcard').length,
  sideCards: document.querySelectorAll('#sideList .sitem').length,
  ambientCanvases: document.querySelectorAll('#webgl-shell canvas').length,
  headingCharacters: document.querySelectorAll('.spatial-char').length,
  storyChapters: document.querySelectorAll('#storyRail [data-story-chapter]').length,
  storyRouteLinks: document.querySelectorAll('#storyRoute [data-story-route]').length,
}));

try {
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForSelector('#storyRail [data-story-chapter]', { timeout: 15_000 });
  await page.locator('#observatory').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelectorAll('#sideList [data-id]').length > 0, undefined, { timeout: 15_000 });
  const baseline = await archiveTreeState();

  for (let cycle = 1; cycle <= 3; cycle += 1) {
    await page.evaluate(`import('/src/main.ts').then((app) => {
      app.disposeArchiveApplication();
      app.bootArchive();
    })`);
    await page.waitForSelector('#grid .acard', { timeout: 15_000 });
    await page.waitForSelector('#storyRail [data-story-chapter]', { timeout: 15_000 });
    await page.waitForFunction(() => document.querySelectorAll('#sideList [data-id]').length > 0, undefined, { timeout: 15_000 });
    await page.waitForFunction(() => document.querySelectorAll('#webgl-shell canvas').length <= 1, undefined, { timeout: 15_000 });
    const state = await archiveTreeState();
    if (
      state.cards !== baseline.cards
      || state.timelineCards !== baseline.timelineCards
      || state.sideCards !== baseline.sideCards
      || state.ambientCanvases > 1
      || state.headingCharacters !== baseline.headingCharacters
      || state.storyChapters !== baseline.storyChapters
      || state.storyRouteLinks !== baseline.storyRouteLinks
    ) failures.push(`cycle ${cycle}: remount mismatch ${JSON.stringify({ baseline, state })}`);
  }
} finally {
  await page.close();
  await browser.close();
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Lifecycle stress passed: three dispose/remount cycles retained one archive tree and at most one ambient canvas.');

export {};
