# Lighthouse mobile results

Target: http://127.0.0.1:4173/

| run | performance | accessibility | best practices | SEO | LCP | LCP element |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 98 | 93 | 100 | 92 | 2265 ms | `Boot diagnostic/status <div> — supplemental Playwright observer` |
| 2 | 96 | 93 | 100 | 92 | 2254 ms | `Boot diagnostic/status <div> — supplemental Playwright observer` |
| 3 | 98 | 93 | 100 | 92 | 2261 ms | `Boot diagnostic/status <div> — supplemental Playwright observer` |

Average: **97 Performance**, **93 Accessibility**, **100 Best Practices**, **92 SEO**.

Lighthouse 13.6.0 did not provide its LCP-element audit node for this route. Supplemental Playwright `PerformanceObserver` instrumentation identified the final LCP candidate as the boot diagnostic/status `div` (the `GENERATING MARTIAN SURFACE MODEL …` text), at approximately 2.3 seconds.

The observatory is dynamically imported only when its section approaches the viewport; the initial route’s production chunk excludes Three.js.
