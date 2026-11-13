# Lighthouse mobile results

Target: http://127.0.0.1:4173/

| run | performance | accessibility | best practices | SEO | LCP | LCP element |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 97 | 100 | 100 | 100 | 2567 ms | `See supplemental observer below` |
| 2 | 98 | 100 | 100 | 100 | 2410 ms | `See supplemental observer below` |
| 3 | 97 | 100 | 100 | 100 | 2558 ms | `See supplemental observer below` |

Average: **97 Performance**, **100 Accessibility**, **100 Best Practices**, **100 SEO**.

## Performance trace

| run | FCP | Speed Index | LCP | TBT | CLS | max potential FID |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 767 ms | 767 ms | 2567 ms | 0 ms | 0.001 | 16 ms |
| 2 | 760 ms | 760 ms | 2410 ms | 0 ms | 0.001 | 16 ms |
| 3 | 758 ms | 806 ms | 2558 ms | 0 ms | 0.001 | 16 ms |
| **average** | **762 ms** | **778 ms** | **2512 ms** | **0 ms** | **0.001** | **16 ms** |

This trace is emitted directly from the Lighthouse LHR. Compare it with the prior committed baseline before attributing a score change: synthetic Performance can vary between runs, while FCP/LCP/TBT/CLS identify the metric that actually moved.

## LCP element

Lighthouse 13.6.0 did not provide its element node for this route. Supplemental Playwright `PerformanceObserver` reported `<img.hero-title-image>` at approximately **660 ms**.

## Failing audits

### Accessibility
- None

### Accessibility element evidence
- None

### SEO
- None

The boot overlay is hidden before it can paint, skipped on repeat visits and reduced motion, and the Observatory remains dynamically imported only when its section approaches the viewport.
