import { mkdir } from "node:fs/promises";

// Chromium's local Lambda bundle also carries the NSS libraries required by the
// sandbox. Set this before dynamically importing the bundle so it exposes them.
process.env.AWS_EXECUTION_ENV ||= "AWS_Lambda_nodejs22.x";
const [{ chromium }, { default: chromiumLambda }] = await Promise.all([
  import("playwright-core"),
  import("@sparticuz/chromium"),
]);

const baseUrl = process.env.PREVIEW_URL || "http://127.0.0.1:5173";
const outputDirectory = "artifacts/visual-regression";
const viewports = [
  { name: "desktop-1280x720", width: 1280, height: 720 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  executablePath: await chromiumLambda.executablePath(),
  headless: true,
  args: chromiumLambda.args,
});

const failures = [];
let activeViewport = "startup";
const page = await browser.newPage({
  viewport: { width: viewports[0].width, height: viewports[0].height },
  deviceScaleFactor: 1,
});
page.on("console", (message) => {
  if (message.type() === "error")
    failures.push(`${activeViewport}: console error: ${message.text()}`);
});
page.on("pageerror", (error) =>
  failures.push(`${activeViewport}: page error: ${error.message}`),
);
page.on("requestfailed", (request) =>
  failures.push(
    `${activeViewport}: request failed: ${request.url()} (${request.failure()?.errorText || "unknown error"})`,
  ),
);

try {
  for (const viewport of viewports) {
    activeViewport = viewport.name;
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
    // Acquisition never blocks first paint. It is marked done and hidden before
    // it can paint; repeat visits and reduced motion use the same instant path.
    await page.waitForSelector("#boot.done", {
      state: "attached",
      timeout: 12_000,
    });
    await page.waitForTimeout(250);
    const menuItems = page.locator("#staggeredMenuPanel .sm-panel-item");
    if ((await menuItems.count()) !== 5)
      failures.push(`${viewport.name}: expected five archive menu chapters`);
    const menuState = await page.locator('#smToggle').getAttribute('aria-expanded');
    if (menuState !== 'false')
      failures.push(`${viewport.name}: staggered menu did not initialise closed`);
    const heroBackground = await page.locator('#hero').evaluate((hero) => getComputedStyle(hero).backgroundImage);
    if (heroBackground !== 'none')
      failures.push(`${viewport.name}: hero retained a legacy CSS background instead of Horizon Bloom`);

    // The replacement header is a real disclosure, not a cosmetic drawer.
    // Exercise pointer opening, visible panel state, and Escape restoration at
    // every layout size before the chapter-by-chapter regression begins.
    const menuToggleBox = await page.locator('#smToggle').boundingBox();
    if (!menuToggleBox) {
      failures.push(`${viewport.name}: staggered menu toggle has no clickable box`);
    } else {
      // Drive the actual pointer sequence directly. The menu intentionally
      // reacts on pointerdown so its semantic state closes before the outgoing
      // panel can capture a deferred click during motion.
      await page.mouse.click(
        menuToggleBox.x + menuToggleBox.width / 2,
        menuToggleBox.y + menuToggleBox.height / 2,
      );
    }
    await page.waitForFunction(
      () => document.querySelector('#smToggle')?.getAttribute('aria-expanded') === 'true',
      undefined,
      { timeout: 4_000 },
    );
    await page.waitForTimeout(1_250);
    const openMenuState = await page.evaluate(() => ({
      hidden: document.querySelector('#staggeredMenuPanel')?.getAttribute('aria-hidden'),
      firstLabelVisible: (() => {
        const label = document.querySelector<HTMLElement>('.sm-panel-itemLabel');
        return !!label && label.getBoundingClientRect().height > 0 && getComputedStyle(label).opacity !== '0';
      })(),
    }));
    if (openMenuState.hidden !== 'false' || !openMenuState.firstLabelVisible)
      failures.push(`${viewport.name}: staggered menu did not expose its chapter panel`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      () => document.querySelector('#smToggle')?.getAttribute('aria-expanded') === 'false',
      undefined,
      { timeout: 4_000 },
    );
    if (!(await page.locator('#smToggle').evaluate((button) => document.activeElement === button)))
      failures.push(`${viewport.name}: staggered menu did not restore focus after Escape`);
    await page.screenshot({
      path: `${outputDirectory}/${viewport.name}.png`,
      fullPage: false,
    });

    if (viewport.name === "desktop-1280x720") {
      await page.waitForSelector("#webgl-shell canvas", { timeout: 12_000 });
      const spatialHud = await page.evaluate(() => {
        const shell = document.querySelector<HTMLElement>("#webgl-shell");
        const main = document.querySelector<HTMLElement>("main");
        const action =
          document.querySelector<HTMLButtonElement>(".herocta .btn");
        if (!shell || !main || !action) return null;
        return {
          shellPointerEvents: getComputedStyle(shell).pointerEvents,
          mainPointerEvents: getComputedStyle(main).pointerEvents,
          actionPointerEvents: getComputedStyle(action).pointerEvents,
          headingCharacters: document.querySelectorAll(".spatial-char").length,
          cardMediaMarkers: document.querySelectorAll(
            '[data-webgl-plane="archive-card-media"]',
          ).length,
        };
      });
      if (
        !spatialHud ||
        spatialHud.shellPointerEvents !== "auto" ||
        spatialHud.mainPointerEvents !== "none" ||
        spatialHud.actionPointerEvents !== "auto" ||
        spatialHud.headingCharacters === 0 ||
        spatialHud.cardMediaMarkers === 0
      ) {
        failures.push(
          `${viewport.name}: spatial HUD layering, kinetic headings, or DOM media markers did not initialise`,
        );
      }
      await page.locator(".herocta .btn").first().hover();
      await page.waitForTimeout(120);
      const reticleState = await page.evaluate(() => {
        const reticle = document.querySelector<HTMLElement>("#reticle");
        if (!reticle) return null;
        return {
          active: reticle.classList.contains("on"),
          magnetic: reticle.classList.contains("hot"),
          scale: getComputedStyle(reticle)
            .getPropertyValue("--reticle-scale")
            .trim(),
        };
      });
      if (
        !reticleState ||
        !reticleState.active ||
        !reticleState.magnetic ||
        reticleState.scale !== "1.35"
      )
        failures.push(
          `${viewport.name}: magnetic cursor reticle did not lock to an interactive control`,
        );
      const recoveryState = await page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>(
          "#webgl-shell canvas",
        );
        if (!canvas) return null;
        canvas.dispatchEvent(
          new Event("webglcontextlost", { cancelable: true }),
        );
        return document.documentElement.dataset.webgl || null;
      });
      if (recoveryState !== "recovering")
        failures.push(
          `${viewport.name}: persistent WebGL layer did not expose context-loss recovery state`,
        );
      await page.evaluate(() =>
        document
          .querySelector<HTMLCanvasElement>("#webgl-shell canvas")
          ?.dispatchEvent(new Event("webglcontextrestored")),
      );
      await page.waitForFunction(
        () => document.documentElement.dataset.webgl === "ready",
        { timeout: 6_000 },
      );
    }

    // The guided route is the first-time product path: it must show source-aware
    // stories before users reach the full archive or observatory tools.
    await page.locator("#stories").scrollIntoViewIfNeeded();
    await page.waitForSelector("#storyRail [data-story-chapter]", {
      timeout: 12_000,
    });
    const storyState = await page.evaluate(() => ({
      chapters: document.querySelectorAll("#storyRail [data-story-chapter]").length,
      routeLinks: document.querySelectorAll("#storyRoute [data-story-route]").length,
      storyLabels: document.querySelectorAll("#storyRail .story-story").length,
      evidenceLinks: document.querySelectorAll("#storyRail .story-evidence a").length,
    }));
    if (
      storyState.chapters !== 6 ||
      storyState.routeLinks !== 6 ||
      storyState.storyLabels !== 6 ||
      storyState.evidenceLinks !== 6
    )
      failures.push(
        `${viewport.name}: guided story route is incomplete or missing evidence labels`,
      );
    await page.screenshot({
      path: `${outputDirectory}/${viewport.name}-stories.png`,
      fullPage: false,
    });
    const eagleStoryButton = page.locator('#storyRail [data-story-open="eagle"]');
    await eagleStoryButton.scrollIntoViewIfNeeded();
    await eagleStoryButton.click();
    await page.waitForSelector("#dossier.open");
    await page.waitForFunction(
      () => document.activeElement?.id === "dClose",
      undefined,
      { timeout: 6_000 },
    );
    const dialogState = await page.locator("#dossier").evaluate((dialog) => ({
      modal: dialog.getAttribute("aria-modal"),
      hidden: dialog.getAttribute("aria-hidden"),
    }));
    if (dialogState.modal !== "true" || dialogState.hidden !== "false")
      failures.push(`${viewport.name}: dossier did not enter accessible modal state`);
    await page.locator("#dClose").press("Escape");
    await page.waitForFunction(
      () => !document.querySelector("#dossier")?.classList.contains("open"),
      undefined,
      { timeout: 6_000 },
    );
    if (
      !(await page.locator('#storyRail [data-story-open="eagle"]').evaluate(
        (button) => document.activeElement === button,
      ))
    )
      failures.push(`${viewport.name}: dossier did not restore focus to its opener`);

    // Enter the WebGL section so locally hosted map textures and the render loop
    // are exercised at every viewport as well.
    await page.locator("#observatory").scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () =>
        document.querySelector("#vpLoad")?.classList.contains("gone") === true,
      undefined,
      { timeout: 25_000 },
    );
    await page.waitForTimeout(180);
    await page.screenshot({
      path: `${outputDirectory}/${viewport.name}-observatory.png`,
      fullPage: false,
    });
    const textureCredit = await page.locator("#hudTexture").textContent();
    if (!textureCredit?.includes("NASA"))
      failures.push(
        `${viewport.name}: Observatory texture credit did not render`,
      );
    if (viewport.width === 1280) {
      const nativeContextState = await page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>("#globe");
        if (!canvas) return null;
        canvas.dispatchEvent(
          new Event("webglcontextlost", { cancelable: true }),
        );
        return (
          document.querySelector<HTMLElement>("#vpLoad")?.textContent || null
        );
      });
      if (!nativeContextState?.includes("paused"))
        failures.push(
          `${viewport.name}: Observatory did not expose its native context-loss fallback`,
        );
      await page.evaluate(() =>
        document
          .querySelector<HTMLCanvasElement>("#globe")
          ?.dispatchEvent(new Event("webglcontextrestored")),
      );
      await page.waitForFunction(
        () =>
          document.querySelector("#vpLoad")?.classList.contains("gone") ===
          true,
        undefined,
        { timeout: 6_000 },
      );
    }
    const defaultSurfaceRecords = await page.locator("#sideList").textContent();
    if (
      defaultSurfaceRecords?.includes("\nLuna 2\n") ||
      defaultSurfaceRecords?.includes("\nLunokhod 1\n") ||
      defaultSurfaceRecords?.includes("\nLunokhod 2\n")
    ) {
      failures.push(
        `${viewport.name}: Observatory exposed other-agency records in the NASA-first default view`,
      );
    }

    // The requested report set covers both worlds plus evidence-bearing dossiers
    // at the two review sizes.
    if (viewport.width === 1440 || viewport.width === 390) {
      await page.locator('.bodytoggle [data-b="mars"]').click();
      await page.waitForTimeout(900);
      await page.screenshot({
        path: `${outputDirectory}/${viewport.name}-observatory-mars.png`,
        fullPage: false,
      });
      await page.locator('.bodytoggle [data-b="moon"]').click();
      await page.waitForTimeout(700);
      await page.locator('#sideList [data-id="eagle"]').click();
      await page.waitForSelector("#dossier.open");
      await page.screenshot({
        path: `${outputDirectory}/${viewport.name}-dossier-eagle.png`,
        fullPage: false,
        timeout: 60_000,
      });
      await page
        .locator("#dClose")
        .evaluate<void, void, HTMLButtonElement>((button) => button.click());
    }

    // Verify the NASA-first default and the explicit contextual-records switch.
    const defaultAgency = await page
      .locator("#agencyChips .chip.sel")
      .textContent();
    if (defaultAgency?.trim() !== "NASA records")
      failures.push(
        `${viewport.name}: expected NASA records as the default agency filter`,
      );
    await page.locator('#agencyChips [data-v="other"]').click();
    await page.waitForTimeout(100);
    const contextualResults = await page.locator("#results").textContent();
    if (!contextualResults?.includes("other-agency context records"))
      failures.push(
        `${viewport.name}: Other agencies toggle did not render contextual records`,
      );

    // A context record has a NASA Sources link but withholds unsupported detail.
    await page.locator('.acard[data-id="beagle2"]').click();
    await page.waitForSelector("#dossier.open");
    if (!(await page.locator("#dossier .dossier-source a").count()))
      failures.push(
        `${viewport.name}: dossier is missing its NASA Sources link`,
      );
    if (!(await page.locator("#dossier .unverified-record").count()))
      failures.push(
        `${viewport.name}: context record did not receive an unverified gate`,
      );
    await page
      .locator("#dClose")
      .evaluate<void, void, HTMLButtonElement>((button) => button.click());

    if (viewport.width === 1440 || viewport.width === 390) {
      await page.locator("#timeline").scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await page.screenshot({
        path: `${outputDirectory}/${viewport.name}-timeline.png`,
        fullPage: false,
      });
      await page.locator("#interstellar").scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await page.screenshot({
        path: `${outputDirectory}/${viewport.name}-voyager.png`,
        fullPage: false,
      });
    }
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
  const staticContext = await staticBrowser.newContext({
    javaScriptEnabled: false,
  });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
  const staticItemCount = await staticPage
    .locator(".noscript-summary li")
    .count();
  if (staticItemCount !== 42)
    failures.push(
      `no-JS fallback: expected 42 artefacts, found ${staticItemCount}`,
    );
  const staticChapterCount = await staticPage.locator('.noscript-nav a').count();
  if (staticChapterCount !== 5)
    failures.push(
      `no-JS fallback: expected five chapter links, found ${staticChapterCount}`,
    );
  await staticContext.close();
} finally {
  await staticBrowser.close();
}

// A WebGL-blocked browser must preserve the semantic archive and dossier flow.
const webglFallbackBrowser = await chromium.launch({
  executablePath: await chromiumLambda.executablePath(),
  headless: true,
  args: chromiumLambda.args,
});
try {
  const fallbackContext = await webglFallbackBrowser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  await fallbackContext.addInitScript(`
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      if (args[0] === 'webgl' || args[0] === 'webgl2' || args[0] === 'experimental-webgl') return null;
      return Reflect.apply(originalGetContext, this, args);
    };
  `);
  const fallbackPage = await fallbackContext.newPage();
  await fallbackPage.goto(baseUrl, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  await fallbackPage.waitForFunction(
    () => document.documentElement.dataset.webgl === "unavailable",
    undefined,
    { timeout: 12_000 },
  );
  await fallbackPage.waitForSelector("#grid .acard", { timeout: 12_000 });
  await fallbackPage.locator("#grid .acard").first().click();
  await fallbackPage.waitForSelector("#dossier.open", { timeout: 12_000 });
  const fallbackState = await fallbackPage.evaluate(() => ({
    ambientCanvasCount: document.querySelectorAll("#webgl-shell canvas").length,
    dossierOpen:
      document.querySelector("#dossier")?.classList.contains("open") || false,
  }));
  if (fallbackState.ambientCanvasCount !== 0 || !fallbackState.dossierOpen)
    failures.push(
      "WebGL fallback: expected no ambient canvas and a working Field Guide dossier",
    );
  await fallbackContext.close();
} finally {
  await webglFallbackBrowser.close();
}

// A real touch context verifies the native-scroll and no-reticle fallback rather
// than treating a narrow desktop viewport as equivalent to a coarse pointer.
const touchBrowser = await chromium.launch({
  executablePath: await chromiumLambda.executablePath(),
  headless: true,
  args: chromiumLambda.args,
});
try {
  const touchContext = await touchBrowser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const touchPage = await touchContext.newPage();
  await touchPage.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
  await touchPage.waitForFunction(
    () => document.documentElement.dataset.scrollEngine === "native",
    undefined,
    { timeout: 12_000 },
  );
  const touchState = await touchPage.evaluate(() => {
    const shell = document.querySelector<HTMLElement>("#webgl-shell");
    const reticle = document.querySelector<HTMLElement>("#reticle");
    return {
      shellHidden: shell ? getComputedStyle(shell).display === "none" : false,
      ambientCanvasCount: document.querySelectorAll("#webgl-shell canvas").length,
      reticleActive: reticle?.classList.contains("on") || false,
      scrollEngine: document.documentElement.dataset.scrollEngine,
    };
  });
  if (
    !touchState.shellHidden ||
    touchState.ambientCanvasCount !== 0 ||
    touchState.reticleActive ||
    touchState.scrollEngine !== "native"
  )
    failures.push(
      "touch fallback: expected no ambient renderer, native scrolling, and no magnetic cursor",
    );
  await touchContext.close();
} finally {
  await touchBrowser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  `Visual checks passed at ${viewports.map((viewport) => `${viewport.width}x${viewport.height}`).join(", ")} with zero console errors; no-JS fallback lists all 42 artefacts.`,
);
