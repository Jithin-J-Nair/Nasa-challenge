# Lighthouse mobile results

Target: http://127.0.0.1:4173/

| run | performance | accessibility | best practices | SEO | LCP | LCP element |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 100 | 100 | 100 | 100 | 902 ms | `See supplemental observer below` |
| 2 | 100 | 100 | 100 | 100 | 905 ms | `See supplemental observer below` |
| 3 | 100 | 100 | 100 | 100 | 908 ms | `See supplemental observer below` |

Average: **100 Performance**, **100 Accessibility**, **100 Best Practices**, **100 SEO**.

## Performance trace

| run | FCP | Speed Index | LCP | TBT | CLS | max potential FID |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 902 ms | 1009 ms | 902 ms | 0 ms | 0.005 | 16 ms |
| 2 | 905 ms | 975 ms | 905 ms | 0 ms | 0.005 | 16 ms |
| 3 | 908 ms | 980 ms | 908 ms | 0 ms | 0.005 | 16 ms |
| **average** | **905 ms** | **988 ms** | **905 ms** | **0 ms** | **0.005** | **16 ms** |

This trace is emitted directly from the Lighthouse LHR. Compare it with the prior committed baseline before attributing a score change: synthetic Performance can vary between runs, while FCP/LCP/TBT/CLS identify the metric that actually moved.

## LCP element

Lighthouse 13.6.0 did not provide its element node for this route. Supplemental Playwright `PerformanceObserver` reported `<h1#heroTitle.hero-title>` at approximately **444 ms** (text begins: “What remains still speaks.”).

## Failing audits

### Accessibility
- None

### Accessibility element evidence
- None

### SEO
- None

The boot overlay is hidden before it can paint, skipped on repeat visits and reduced motion, and the Observatory remains dynamically imported only when its section approaches the viewport.
