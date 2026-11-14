# Lighthouse mobile results

Target: http://127.0.0.1:4173/

| run | performance | accessibility | best practices | SEO | LCP | LCP element |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 100 | 100 | 100 | 100 | 907 ms | `See supplemental observer below` |
| 2 | 100 | 100 | 100 | 100 | 909 ms | `See supplemental observer below` |
| 3 | 100 | 100 | 100 | 100 | 904 ms | `See supplemental observer below` |

Average: **100 Performance**, **100 Accessibility**, **100 Best Practices**, **100 SEO**.

## Performance trace

| run | FCP | Speed Index | LCP | TBT | CLS | max potential FID |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 907 ms | 1033 ms | 907 ms | 0 ms | 0.001 | 16 ms |
| 2 | 909 ms | 1001 ms | 909 ms | 0 ms | 0.001 | 16 ms |
| 3 | 904 ms | 1018 ms | 904 ms | 0 ms | 0.001 | 16 ms |
| **average** | **907 ms** | **1017 ms** | **907 ms** | **0 ms** | **0.001** | **16 ms** |

This trace is emitted directly from the Lighthouse LHR. Compare it with the prior committed baseline before attributing a score change: synthetic Performance can vary between runs, while FCP/LCP/TBT/CLS identify the metric that actually moved.

## LCP element

Lighthouse 13.6.0 did not provide its element node for this route. Supplemental Playwright `PerformanceObserver` reported `<h1#heroTitle.hero-title>` at approximately **396 ms** (text begins: “What remains still speaks.”).

## Failing audits

### Accessibility
- None

### Accessibility element evidence
- None

### SEO
- None

The boot overlay is hidden before it can paint, skipped on repeat visits and reduced motion, and the Observatory remains dynamically imported only when its section approaches the viewport.
