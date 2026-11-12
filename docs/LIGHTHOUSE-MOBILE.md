# Lighthouse mobile results

Target: http://127.0.0.1:5173/

| run | performance | accessibility | best practices | SEO | LCP | LCP element |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 84 | 100 | 100 | 100 | 3178 ms | `See supplemental observer below` |
| 2 | 84 | 100 | 100 | 100 | 3156 ms | `See supplemental observer below` |
| 3 | 81 | 100 | 100 | 100 | 3322 ms | `See supplemental observer below` |

Average: **83 Performance**, **100 Accessibility**, **100 Best Practices**, **100 SEO**.

## Performance trace

| run | FCP | Speed Index | LCP | TBT | CLS | max potential FID |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 759 ms | 1250 ms | 3178 ms | 388 ms | 0.034 | 246 ms |
| 2 | 752 ms | 1211 ms | 3156 ms | 404 ms | 0.034 | 251 ms |
| 3 | 757 ms | 1044 ms | 3322 ms | 457 ms | 0.035 | 271 ms |
| **average** | **756 ms** | **1168 ms** | **3219 ms** | **416 ms** | **0.034** | **256 ms** |

This trace is emitted directly from the Lighthouse LHR. Compare it with the prior committed baseline before attributing a score change: synthetic Performance can vary between runs, while FCP/LCP/TBT/CLS identify the metric that actually moved.

## LCP element

Lighthouse 13.6.0 did not provide its element node for this route. Supplemental Playwright `PerformanceObserver` reported `<img.hero-title-image>` at approximately **204 ms**.

## Failing audits

### Accessibility
- None

### Accessibility element evidence
- None

### SEO
- None

The boot overlay is hidden before it can paint, skipped on repeat visits and reduced motion, and the Observatory remains dynamically imported only when its section approaches the viewport.
