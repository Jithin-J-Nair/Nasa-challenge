# Lighthouse mobile results

Target: http://127.0.0.1:5173/

| run | performance | accessibility | best practices | SEO | LCP | LCP element |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 85 | 100 | 100 | 100 | 3166 ms | `See supplemental observer below` |
| 2 | 84 | 100 | 100 | 100 | 3160 ms | `See supplemental observer below` |
| 3 | 68 | 100 | 100 | 100 | 10965 ms | `See supplemental observer below` |

Average: **79 Performance**, **100 Accessibility**, **100 Best Practices**, **100 SEO**.

## Performance trace

| run | FCP | Speed Index | LCP | TBT | CLS | max potential FID |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 755 ms | 1148 ms | 3166 ms | 356 ms | 0.034 | 277 ms |
| 2 | 753 ms | 1135 ms | 3160 ms | 392 ms | 0.035 | 286 ms |
| 3 | 755 ms | 1188 ms | 10965 ms | 325 ms | 0.034 | 257 ms |
| **average** | **754 ms** | **1157 ms** | **5764 ms** | **358 ms** | **0.034** | **273 ms** |

This trace is emitted directly from the Lighthouse LHR. Compare it with the prior committed baseline before attributing a score change: synthetic Performance can vary between runs, while FCP/LCP/TBT/CLS identify the metric that actually moved.

## LCP element

Lighthouse 13.6.0 did not provide its element node for this route. Supplemental Playwright `PerformanceObserver` reported `<img.hero-title-image>` at approximately **172 ms**.

## Failing audits

### Accessibility
- None

### Accessibility element evidence
- None

### SEO
- None

The boot overlay is hidden before it can paint, skipped on repeat visits and reduced motion, and the Observatory remains dynamically imported only when its section approaches the viewport.
