import { mkdir } from 'node:fs/promises';

process.env.AWS_EXECUTION_ENV ||= 'AWS_Lambda_nodejs22.x';
const [{ chromium }, { default: chromiumLambda }] = await Promise.all([
  import('playwright-core'),
  import('@sparticuz/chromium'),
]);

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const label = process.env.SCREENSHOT_LABEL || 'after-story';
const outputDirectory = 'artifacts/dossier-comparison';
const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '390x844', width: 390, height: 844 },
];
const dossiers = [
  { id: 'eagle', body: 'moon', filename: 'eagle' },
  { id: 'ingenuity', body: 'mars', filename: 'ingenuity' },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  executablePath: await chromiumLambda.executablePath(),
  headless: true,
  args: chromiumLambda.args,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const failures: string[] = [];
page.on('console', (message) => {
  if (message.type() === 'error') failures.push(`console error: ${message.text()}`);
});
page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));

try {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.locator('#observatory').scrollIntoViewIfNeeded();
    await page.waitForSelector('#sideList [data-id]', { timeout: 15_000 });
    await page.waitForTimeout(500);

    for (const dossier of dossiers) {
      const selectedBody = await page.locator(`.bodytoggle [data-b="${dossier.body}"]`).getAttribute('aria-selected');
      if (selectedBody !== 'true') {
        await page.locator(`.bodytoggle [data-b="${dossier.body}"]`).click();
        await page.waitForTimeout(450);
      }
      await page.locator(`#sideList [data-id="${dossier.id}"]`).click();
      await page.waitForSelector('#dossier.open');
      await page.waitForTimeout(350);

      // The after image lands on the deliberately separated Story layer. In the
      // baseline, use its former first-person-log region at the same review step.
      const story = page.locator('#dossier .dossier-story');
      if (await story.count()) await story.scrollIntoViewIfNeeded();
      else await page.locator('#dossier .voice').scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await page.screenshot({
        path: `${outputDirectory}/${dossier.filename}-${viewport.name}-${label}.png`,
        fullPage: false,
      });
      await page.locator('#dClose').click();
    }
  }
} finally {
  await page.close();
  await browser.close();
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Captured ${dossiers.length * viewports.length} dossier screenshots (${label}) from ${baseUrl}.`);
