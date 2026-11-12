# Lighthouse mobile results

Target: http://127.0.0.1:4174/

| run | performance | accessibility | best practices | SEO | LCP | LCP element |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 98 | 100 | 100 | 100 | 2414 ms | `See supplemental observer below` |
| 2 | 98 | 100 | 100 | 100 | 2406 ms | `See supplemental observer below` |
| 3 | 98 | 100 | 100 | 100 | 2411 ms | `See supplemental observer below` |

Average: **98 Performance**, **100 Accessibility**, **100 Best Practices**, **100 SEO**.

## Performance trace

| run | FCP | Speed Index | LCP | TBT | CLS | max potential FID |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 764 ms | 764 ms | 2414 ms | 0 ms | 0.001 | 16 ms |
| 2 | 756 ms | 756 ms | 2406 ms | 0 ms | 0.001 | 16 ms |
| 3 | 761 ms | 761 ms | 2411 ms | 0 ms | 0.001 | 16 ms |
| **average** | **760 ms** | **760 ms** | **2410 ms** | **0 ms** | **0.001** | **16 ms** |

This trace is emitted directly from the Lighthouse LHR. Compare it with the prior committed baseline before attributing a score change: synthetic Performance can vary between runs, while FCP/LCP/TBT/CLS identify the metric that actually moved.

## LCP element

Lighthouse 13.6.0 did not provide its element node for this route. Supplemental Playwright `PerformanceObserver` reported `<img.hero-title-image>` at approximately **388 ms**.

## Failing audits

### Accessibility
- None

### Accessibility element evidence
- None

### SEO
- None

The boot overlay is hidden before it can paint, skipped on repeat visits and reduced motion, and the Observatory remains dynamically imported only when its section approaches the viewport.
