import { mkdir } from 'node:fs/promises';

// Chromium's local Lambda bundle also carries the NSS libraries required by the
// sandbox. Set this before dynamically importing the bundle so it exposes them.
process.env.AWS_EXECUTION_ENV ||= 'AWS_Lambda_nodejs22.x';
const [{ chromium }, { default: chromiumLambda }] = await Promise.all([
  import('playwright-core'),
  import('@sparticuz/chromium'),
]);

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const outputDirectory = 'artifacts/visual-regression';
const viewports = [
  { name: 'desktop-1280x720', width: 1280, height: 720 },
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'mobile-390x844', width: 390, height: 844 },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  executablePath: await chromiumLambda.executablePath(),
  headless: true,
  args: chromiumLambda.args,
});

const failures = [];
let activeViewport = 'startup';
const page = await browser.newPage({ viewport: { width: viewports[0].width, height: viewports[0].height }, deviceScaleFactor: 1 });
page.on('console', (message) => {
  if (message.type() === 'error') failures.push(`${activeViewport}: console error: ${message.text()}`);
});
page.on('pageerror', (error) => failures.push(`${activeViewport}: page error: ${error.message}`));
page.on('requestfailed', (request) => failures.push(`${activeViewport}: request failed: ${request.url()} (${request.failure()?.errorText || 'unknown error'})`));

try {
  for (const viewport of viewports) {
    activeViewport = viewport.name;
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForSelector('#boot.done', { timeout: 12_000 });
    await page.waitForTimeout(2_600);
    await page.screenshot({ path: `${outputDirectory}/${viewport.name}.png`, fullPage: false });

    // Enter the WebGL section so locally hosted map textures and the render loop
    // are exercised at every viewport as well.
    await page.locator('#observatory').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${outputDirectory}/${viewport.name}-observatory.png`, fullPage: false });
    const textureCredit = await page.locator('#hudTexture').textContent();
    if (!textureCredit?.includes('NASA')) failures.push(`${viewport.name}: Observatory texture credit did not render`);
    const defaultSurfaceRecords = await page.locator('#sideList').textContent();
    if (defaultSurfaceRecords?.includes('\nLuna 2\n') || defaultSurfaceRecords?.includes('\nLunokhod 1\n') || defaultSurfaceRecords?.includes('\nLunokhod 2\n')) {
      failures.push(`${viewport.name}: Observatory exposed other-agency records in the NASA-first default view`);
    }

    // Verify the NASA-first default and the explicit contextual-records switch.
    const defaultAgency = await page.locator('#agencyChips .chip.sel').textContent();
    if (defaultAgency?.trim() !== 'NASA records') failures.push(`${viewport.name}: expected NASA records as the default agency filter`);
    await page.locator('#agencyChips [data-v="other"]').click();
    await page.waitForTimeout(100);
    const contextualResults = await page.locator('#results').textContent();
    if (!contextualResults?.includes('other-agency context records')) failures.push(`${viewport.name}: Other agencies toggle did not render contextual records`);

    // A context record has a NASA Sources link but withholds unsupported detail.
    await page.locator('.acard[data-id="beagle2"]').click();
    await page.waitForSelector('#dossier.open');
    if (!(await page.locator('#dossier .dossier-source a').count())) failures.push(`${viewport.name}: dossier is missing its NASA Sources link`);
    if (!(await page.locator('#dossier .unverified-record').count())) failures.push(`${viewport.name}: context record did not receive an unverified gate`);
    await page.locator('#dClose').click();
  }
} finally {
  await page.close();
  await browser.close();
}

// Static fallback is part of the public story, not merely an error message.
const staticBrowser = await chromium.launch({
  executablePath: await chromiumLambda.executablePath(),
  headless: true,
  args: chromiumLambda.args,
});
try {
  const staticContext = await staticBrowser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30_000 });
  const staticItemCount = await staticPage.locator('.noscript-summary li').count();
  if (staticItemCount !== 42) failures.push(`no-JS fallback: expected 42 artefacts, found ${staticItemCount}`);
  await staticContext.close();
} finally {
  await staticBrowser.close();
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Visual checks passed at ${viewports.map((viewport) => `${viewport.width}x${viewport.height}`).join(', ')} with zero console errors; no-JS fallback lists all 42 artefacts.`);
