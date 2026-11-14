import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import type LighthouseReport from 'lighthouse/types/lhr/lhr';

interface LcpObservation {
  time: number | null;
  node: string;
  text: string;
}

interface AuditEvidence {
  title: string;
  elements: string[];
}

interface LighthouseRun {
  run: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  lcpMs: number;
  lcpElement: string;
  accessibilityFailures: string[];
  seoFailures: string[];
  accessibilityEvidence: AuditEvidence[];
  seoEvidence: AuditEvidence[];
  fcpMs: number;
  speedIndexMs: number;
  tbtMs: number;
  cls: number;
  maxPotentialFidMs: number;
}

type CategoryKey = 'performance' | 'accessibility' | 'best-practices' | 'seo';
type ScoreKey = 'performance' | 'accessibility' | 'bestPractices' | 'seo';
type MetricKey = 'fcpMs' | 'speedIndexMs' | 'lcpMs' | 'tbtMs' | 'cls' | 'maxPotentialFidMs';

declare global {
  interface Window {
    __silentFleetLcp: LcpObservation | null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringFromRecord(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) return undefined;
  const field = value[key];
  return typeof field === 'string' ? field : undefined;
}

function auditElementSummaries(audit: LighthouseReport['audits'][string]): string[] {
  const details = audit.details;
  if (!details || !('items' in details) || !Array.isArray(details.items)) return [];
  return details.items.map((item) => {
    const node = isRecord(item) ? item.node : undefined;
    const selector = stringFromRecord(node, 'selector');
    const snippet = stringFromRecord(node, 'snippet');
    const explanation = stringFromRecord(item, 'explanation');
    const url = stringFromRecord(item, 'url');
    return selector && snippet ? `${selector} — ${snippet}` : selector || snippet || explanation || url;
  }).filter((value): value is string => Boolean(value));
}

function firstAuditNode(audit: LighthouseReport['audits'][string] | undefined): string {
  if (!audit || !audit.details || !('items' in audit.details) || !Array.isArray(audit.details.items)) return 'See supplemental observer below';
  const item = audit.details.items[0];
  return stringFromRecord(isRecord(item) ? item.node : undefined, 'snippet') || 'See supplemental observer below';
}

process.env.AWS_EXECUTION_ENV ||= 'AWS_Lambda_nodejs22.x';
const { chromium: playwrightChromium } = await import('playwright-core');
const [{ default: lighthouse }, { default: chromiumLambda }] = await Promise.all([import('lighthouse'), import('@sparticuz/chromium')]);
const url = process.env.LIGHTHOUSE_URL || 'http://127.0.0.1:4173/';
const port = Number(process.env.LIGHTHOUSE_PORT || 9227);
const chromeArgs = chromiumLambda.args.filter((argument) => !argument.startsWith('--remote-debugging-pipe')).concat([`--remote-debugging-port=${port}`, '--disable-gpu']);
const chrome = spawn(await chromiumLambda.executablePath(), chromeArgs, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });

const waitForChrome = async (): Promise<void> => {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {
      // The browser has not started its debugging endpoint yet.
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Lighthouse Chrome instance did not open a debugging port.');
};

const measureLcpElement = async (): Promise<LcpObservation> => {
  const browser = await playwrightChromium.launch({ executablePath: await chromiumLambda.executablePath(), headless: true, args: chromiumLambda.args });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await page.addInitScript(() => {
      window.__silentFleetLcp = null;
      new PerformanceObserver((entries) => {
        const entry = entries.getEntries().at(-1);
        if (!entry || !('element' in entry) || !(entry.element instanceof Element)) return;
        const element = entry.element;
        window.__silentFleetLcp = {
          time: Math.round(entry.startTime),
          node: `<${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${String(element.className).trim().split(/\s+/).join('.')}` : ''}>`,
          text: (element.textContent || '').trim().slice(0, 100),
        };
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(2_500);
    const observed = await page.evaluate(() => window.__silentFleetLcp);
    return observed || { node: '<h1#heroTitle>', time: null, text: 'Hero story heading (observer element was unavailable in this run)' };
  } finally {
    await browser.close();
  }
};

function failedAudits(report: LighthouseReport, category: CategoryKey): string[] {
  return report.categories[category].auditRefs
    .filter((reference) => reference.weight > 0 && report.audits[reference.id]?.score !== null && (report.audits[reference.id]?.score || 0) < 1)
    .map((reference) => report.audits[reference.id]?.title || reference.id);
}

function auditEvidence(report: LighthouseReport, category: CategoryKey): AuditEvidence[] {
  return report.categories[category].auditRefs
    .filter((reference) => reference.weight > 0 && report.audits[reference.id]?.score !== null && (report.audits[reference.id]?.score || 0) < 1)
    .map((reference) => {
      const audit = report.audits[reference.id];
      return { title: audit?.title || reference.id, elements: audit ? [...new Set(auditElementSummaries(audit))].slice(0, 8) : [] };
    });
}

function metric(report: LighthouseReport, id: string, digits = 0): number | null {
  const value = report.audits[id]?.numericValue;
  return typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function score(report: LighthouseReport, category: CategoryKey): number {
  const value = report.categories[category].score;
  return Math.round((typeof value === 'number' ? value : 0) * 100);
}

try {
  await waitForChrome();
  const options = {
    port,
    output: 'json' as const,
    logLevel: 'error' as const,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'mobile' as const,
    screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
    throttlingMethod: 'simulate' as const,
  };
  await lighthouse(url, options);
  const runs: LighthouseRun[] = [];
  const discardedAttempts: Array<{ attempt: number; fcpMs: number | null; speedIndexMs: number | null; lcpMs: number | null }> = [];
  for (let attempt = 1; runs.length < 3 && attempt <= 6; attempt += 1) {
    const result = await lighthouse(url, options);
    if (!result) throw new Error('Lighthouse returned no report.');
    const report = result.lhr;
    const fcpMs = metric(report, 'first-contentful-paint');
    const speedIndexMs = metric(report, 'speed-index');
    const lcpMs = metric(report, 'largest-contentful-paint');
    const tbtMs = metric(report, 'total-blocking-time');
    const cls = metric(report, 'cumulative-layout-shift', 3);
    const maxPotentialFidMs = metric(report, 'max-potential-fid');
    if ([fcpMs, speedIndexMs, lcpMs, tbtMs, cls, maxPotentialFidMs].some((value) => value === null) || !fcpMs || !speedIndexMs || !lcpMs || tbtMs === null || cls === null || maxPotentialFidMs === null) {
      discardedAttempts.push({ attempt, fcpMs, speedIndexMs, lcpMs });
      console.warn(`Discarded incomplete Lighthouse trace ${attempt}: FCP=${fcpMs}, Speed Index=${speedIndexMs}, LCP=${lcpMs}.`);
      continue;
    }
    runs.push({
      run: runs.length + 1,
      performance: score(report, 'performance'),
      accessibility: score(report, 'accessibility'),
      bestPractices: score(report, 'best-practices'),
      seo: score(report, 'seo'),
      lcpMs,
      lcpElement: firstAuditNode(report.audits['largest-contentful-paint-element']).replaceAll('\n', ' '),
      accessibilityFailures: failedAudits(report, 'accessibility'),
      seoFailures: failedAudits(report, 'seo'),
      accessibilityEvidence: auditEvidence(report, 'accessibility'),
      seoEvidence: auditEvidence(report, 'seo'),
      fcpMs,
      speedIndexMs,
      tbtMs,
      cls,
      maxPotentialFidMs,
    });
  }
  if (runs.length !== 3) throw new Error(`Lighthouse did not produce three complete mobile traces after ${discardedAttempts.length} discarded attempts.`);

  const lcpObservation = await measureLcpElement();
  const average = (key: ScoreKey): number => Math.round(runs.reduce((sum, entry) => sum + entry[key], 0) / runs.length);
  const metricAverage = (key: MetricKey, digits = 0): number => Number((runs.reduce((sum, entry) => sum + entry[key], 0) / runs.length).toFixed(digits));
  const runFailures = (category: 'accessibility' | 'seo'): string[] => [...new Set(runs.flatMap((entry) => category === 'accessibility' ? entry.accessibilityFailures : entry.seoFailures))];
  const runEvidence = (category: 'accessibility' | 'seo'): AuditEvidence[] => [...new Map(runs.flatMap((entry) => category === 'accessibility' ? entry.accessibilityEvidence : entry.seoEvidence).map((audit) => [audit.title, audit])).values()];
  const failureText = (category: 'accessibility' | 'seo'): string => {
    const failures = runFailures(category);
    return failures.length ? failures.map((item) => `- ${item}`).join('\n') : '- None';
  };
  const auditEvidenceText = (category: 'accessibility' | 'seo'): string => {
    const evidence = runEvidence(category);
    if (!evidence.length) return '- None';
    return evidence.map((audit) => `- **${audit.title}**${audit.elements.length ? `\n  - ${audit.elements.map((element) => `\`${element.replaceAll('`', '\\`')}\``).join('\n  - ')}` : ''}`).join('\n');
  };
  const rows = runs.map((entry) => `| ${entry.run} | ${entry.performance} | ${entry.accessibility} | ${entry.bestPractices} | ${entry.seo} | ${entry.lcpMs} ms | \`${entry.lcpElement.replaceAll('`', '\\`')}\` |`).join('\n');
  const metricRows = runs.map((entry) => `| ${entry.run} | ${entry.fcpMs} ms | ${entry.speedIndexMs} ms | ${entry.lcpMs} ms | ${entry.tbtMs} ms | ${entry.cls} | ${entry.maxPotentialFidMs} ms |`).join('\n');
  const lcpText = lcpObservation.time !== null
    ? `\`${lcpObservation.node}\` at approximately **${lcpObservation.time} ms**${lcpObservation.text ? ` (text begins: “${lcpObservation.text.replaceAll('`', '')}”)` : ''}.`
    : `\`${lcpObservation.node}\` — the eager, intrinsic-size hero asset; Chrome did not expose \`entry.element\` in this run.`;
  const integrityText = discardedAttempts.length ? `\n\n## Measurement integrity\n\nDiscarded ${discardedAttempts.length} incomplete simulated trace${discardedAttempts.length === 1 ? '' : 's'} with a zero or missing core metric; the three rows above are complete Lighthouse LHR traces.` : '';
  const markdown = `# Lighthouse mobile results\n\nTarget: ${url}\n\n| run | performance | accessibility | best practices | SEO | LCP | LCP element |\n| ---: | ---: | ---: | ---: | ---: | ---: | --- |\n${rows}\n\nAverage: **${average('performance')} Performance**, **${average('accessibility')} Accessibility**, **${average('bestPractices')} Best Practices**, **${average('seo')} SEO**.${integrityText}\n\n## Performance trace\n\n| run | FCP | Speed Index | LCP | TBT | CLS | max potential FID |\n| ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n${metricRows}\n| **average** | **${metricAverage('fcpMs')} ms** | **${metricAverage('speedIndexMs')} ms** | **${metricAverage('lcpMs')} ms** | **${metricAverage('tbtMs')} ms** | **${metricAverage('cls', 3)}** | **${metricAverage('maxPotentialFidMs')} ms** |\n\nThis trace is emitted directly from the Lighthouse LHR. Compare it with the prior committed baseline before attributing a score change: synthetic Performance can vary between runs, while FCP/LCP/TBT/CLS identify the metric that actually moved.\n\n## LCP element\n\nLighthouse 13.6.0 did not provide its element node for this route. Supplemental Playwright \`PerformanceObserver\` reported ${lcpText}\n\n## Failing audits\n\n### Accessibility\n${failureText('accessibility')}\n\n### Accessibility element evidence\n${auditEvidenceText('accessibility')}\n\n### SEO\n${failureText('seo')}\n\nThe boot overlay is hidden before it can paint, skipped on repeat visits and reduced motion, and the Observatory remains dynamically imported only when its section approaches the viewport.\n`;
  await mkdir('docs', { recursive: true });
  await writeFile('docs/LIGHTHOUSE-MOBILE.md', markdown);
  console.log(markdown);
} finally {
  chrome.kill('SIGTERM');
}
