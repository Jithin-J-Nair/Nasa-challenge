# Lighthouse mobile results

Target: http://127.0.0.1:4173/

| run | performance | accessibility | best practices | SEO | LCP | LCP element |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 76 | 96 | 100 | 100 | 758 ms | `See supplemental observer below` |
| 2 | 76 | 96 | 100 | 100 | 766 ms | `See supplemental observer below` |
| 3 | 76 | 96 | 100 | 100 | 758 ms | `See supplemental observer below` |

Average: **76 Performance**, **96 Accessibility**, **100 Best Practices**, **100 SEO**.

## LCP element

Lighthouse 13.6.0 did not provide its element node for this route. Supplemental Playwright `PerformanceObserver` reported `<img.hero-title-image>` at approximately **532 ms**.

## Failing audits

### Accessibility
- Background and foreground colors do not have a sufficient contrast ratio.
- Heading elements are not in a sequentially-descending order
- Elements with visible text labels do not have matching accessible names.

### SEO
- None

The boot overlay is hidden before it can paint, skipped on repeat visits and reduced motion, and the Observatory remains dynamically imported only when its section approaches the viewport.
