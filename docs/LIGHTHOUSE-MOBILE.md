# Lighthouse mobile results

Target: http://127.0.0.1:4174/

| run | performance | accessibility | best practices | SEO | LCP | LCP element |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 98 | 100 | 100 | 100 | 2408 ms | `See supplemental observer below` |
| 2 | 98 | 100 | 100 | 100 | 2422 ms | `See supplemental observer below` |
| 3 | 98 | 100 | 100 | 100 | 2406 ms | `See supplemental observer below` |

Average: **98 Performance**, **100 Accessibility**, **100 Best Practices**, **100 SEO**.

## Measurement integrity

Discarded 1 incomplete simulated trace with a zero or missing core metric; the three rows above are complete Lighthouse LHR traces.

## Performance trace

| run | FCP | Speed Index | LCP | TBT | CLS | max potential FID |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 758 ms | 758 ms | 2408 ms | 0 ms | 0.001 | 16 ms |
| 2 | 772 ms | 862 ms | 2422 ms | 0 ms | 0.001 | 16 ms |
| 3 | 756 ms | 756 ms | 2406 ms | 0 ms | 0.001 | 16 ms |
| **average** | **762 ms** | **792 ms** | **2412 ms** | **0 ms** | **0.001** | **16 ms** |

This trace is emitted directly from the Lighthouse LHR. Compare it with the prior committed baseline before attributing a score change: synthetic Performance can vary between runs, while FCP/LCP/TBT/CLS identify the metric that actually moved.

## LCP element

Lighthouse 13.6.0 did not provide its element node for this route. Supplemental Playwright `PerformanceObserver` reported `<img.hero-title-image>` at approximately **628 ms**.

## Failing audits

### Accessibility
- None

### Accessibility element evidence
- None

### SEO
- None

The boot overlay is hidden before it can paint, skipped on repeat visits and reduced motion, and the Observatory remains dynamically imported only when its section approaches the viewport.
