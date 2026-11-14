# Lighthouse mobile results

Target: http://127.0.0.1:4173/

| run | performance | accessibility | best practices | SEO | LCP | LCP element |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 100 | 100 | 100 | 100 | 912 ms | `See supplemental observer below` |
| 2 | 100 | 100 | 100 | 100 | 916 ms | `See supplemental observer below` |
| 3 | 100 | 100 | 100 | 100 | 906 ms | `See supplemental observer below` |

Average: **100 Performance**, **100 Accessibility**, **100 Best Practices**, **100 SEO**.

## Performance trace

| run | FCP | Speed Index | LCP | TBT | CLS | max potential FID |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 912 ms | 1041 ms | 912 ms | 0 ms | 0.001 | 16 ms |
| 2 | 916 ms | 1062 ms | 916 ms | 0 ms | 0.001 | 16 ms |
| 3 | 906 ms | 1055 ms | 906 ms | 0 ms | 0.001 | 16 ms |
| **average** | **911 ms** | **1053 ms** | **911 ms** | **0 ms** | **0.001** | **16 ms** |

This trace is emitted directly from the Lighthouse LHR. Compare it with the prior committed baseline before attributing a score change: synthetic Performance can vary between runs, while FCP/LCP/TBT/CLS identify the metric that actually moved.

## LCP element

Lighthouse 13.6.0 did not provide its element node for this route. Supplemental Playwright `PerformanceObserver` reported `<p.hero-lede>` at approximately **184 ms** (text begins: “Enter a living map of hardware left on the Moon, Mars, and the long dark beyond—then follow every cl”).

## Failing audits

### Accessibility
- None

### Accessibility element evidence
- None

### SEO
- None

The boot overlay is hidden before it can paint, skipped on repeat visits and reduced motion, and the Observatory remains dynamically imported only when its section approaches the viewport.
