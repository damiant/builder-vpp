# Top 10 Performance Improvements

## Current Performance Baseline

**Metrics:**
- LCP: 187 ms (Good)
- CLS: 0.00 (Excellent)
- TTFB: 0.9 ms (Excellent)
- Total Page Weight: 4.8 MB
- Network Requests: 78
- Third-Party Script Execution: 175 ms
- Main Thread Blocking: 175 ms

---

## 1. Reduce Third-Party Script Bloat

**Impact:** Reduce page weight by 2-3 MB, improve TTI by 1-2 seconds

**Problem:**
Loading 4.6 MB of third-party JavaScript from 16+ vendors across 78 network requests.

**Breakdown by vendor:**
- Google Tag Manager: 1.8 MB
- Google CDN (reCAPTCHA): 1.2 MB
- OneTrust/Optanon: 1 MB
- TikTok Pixel: 770.7 KB
- Facebook Pixel: 602.9 KB
- Braze: 261.5 KB
- JSDelivr (Bootstrap): 224.3 KB
- LeadID/lidstatic: 169.6 KB
- Bing Ads: 133.4 KB
- Google Fonts: 125.5 KB
- Reddit Pixel: 100.1 KB

**Solutions:**
- Audit necessity of all tracking pixels
- Move OneTrust & GTM scripts to async loading (end of `<body>`)
- Lazy load non-critical scripts (TikTok, Reddit, Braze) until after page load
- Use GTM Server-Side Tagging to consolidate pixels
- Implement Consent Mode v2 to defer scripts until user consent
- Use Partytown to offload third-party scripts to web worker

**Code Example - Async GTM & OneTrust:**
```html
<!-- Move to end of <body> -->
<script>
  // OneTrust - Load async
  var oneTrustId = "0197cd15-913a-717f-a29e-a9d53ff3191a";
  var script1 = document.createElement("script");
  script1.async = true;
  script1.src = "https://cdn.cookielaw.org/consent/" + oneTrustId + "/OtAutoBlock.js";
  document.body.appendChild(script1);
</script>

<script async>
  // GTM - Load async
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s);
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "GTM-TF5M7SDK");
</script>
```

**Expected Results:**
- Page weight: 4.8 MB → 1.5-2 MB
- Network requests: 78 → 35-40
- FCP improvement: 500-1000ms

---

## 2. Enable HTML Compression

**Impact:** Reduce HTML transfer by 71.1 KB (70-80% reduction)

**Problem:**
The root HTML document (106 KB) is served without compression (gzip or brotli).

**Solution:**
```nginx
# Enable Brotli or Gzip compression in Azure CDN/Front Door
Content-Encoding: br  # or gzip
```

**Expected Results:**
- HTML transfer: 106 KB → 25-30 KB
- Faster download on slow connections

---

## 3. Optimize Third-Party Main Thread Blocking

**Impact:** Reduce main thread blocking by 100-150ms

**Problem:**
Third-party scripts block the main thread for 175ms total.

**Main culprits:**
- lidstatic.com (LeadID): 99 ms (56% of blocking time)
- Google Tag Manager: 33 ms
- OneTrust: 10 ms
- Facebook Pixel: 9 ms
- TikTok: 8 ms

**Solutions:**
- Defer LeadID initialization until after page interactive
- Use `async` or `defer` attributes on all script tags
- Code-split GTM to load only essential tags initially
- Lazy load consent management banner after FCP

**Expected Results:**
- Main thread blocking: 175ms → 25-50ms
- Faster TTI (Time to Interactive)

---

## 4. Optimize Network Dependency Chain

**Impact:** Reduce critical path by 150-200ms

**Problem:**
Critical path latency of 192ms through cascading requests:
```
index.html (131ms)
  └─ main-66UV7QVJ.js (2ms)
      └─ builder.io API /leadsource (192ms) ← LONGEST CHAIN
      └─ builder.io API /page (172ms)
```

**Solutions:**
- Add preconnect: `<link rel="preconnect" href="https://cdn.builder.io" crossorigin>`
- Prefetch known API responses
- Implement Static Site Generation (SSG) to pre-render Builder.io content
- Cache Builder.io API responses at CDN edge
- Inline critical initial content in HTML

**Expected Results:**
- Critical path: 192ms → 40-50ms
- Faster content display

---

## 5. Optimize Font Loading Strategy

**Impact:** Reduce FCP by 300-500ms, eliminate font-related render blocking

**Problem:**
Loading multiple fonts (DM Sans, Poppins, Material Icons) with multiple weights blocks text rendering. Fonts total 125.5 KB.

**Solutions:**
- Use `font-display: swap` for all `@font-face` declarations
- Preload critical fonts:
  ```html
  <link rel="preload" as="font" href="https://fonts.gstatic.com/s/dmsans/v17/rP2Hp2ywxg089UriCZ2IHSeH.woff2" type="font/woff2" crossorigin>
  ```
- Limit font weights to only what's used (400, 500, 600, 700)
- Self-host fonts instead of loading from Google Fonts
- Subset fonts to include only required characters (40% size reduction)
- Use variable fonts to reduce number of files

**Expected Results:**
- Font file size reduction: 40-60%
- Text displays immediately with fallback
- Reduced CLS (Cumulative Layout Shift)

---

## 6. Remove Unused Bootstrap CSS

**Impact:** Save 50-150KB bundle size

**Problem:**
Loading full Bootstrap CSS (196KB minified) when only a small portion is used. Currently loaded from CDN as render-blocking resource.

**Solutions:**
- Use PurgeCSS to remove unused Bootstrap classes
- Import only needed Bootstrap modules
- Consider migrating to Tailwind CSS for better tree-shaking
- Inline critical Bootstrap CSS and defer the rest:
  ```html
  <style>/* Critical Bootstrap classes */</style>
  <link href="bootstrap-rest.min.css" rel="stylesheet" media="print" onload="this.media='all'">
  ```

**Expected Results:**
- CSS bundle: 196KB → 46-146KB
- Faster CSS parsing and rendering
- Remove render-blocking resource

---

## 7. Consolidate and Defer Tracking Pixels

**Impact:** Reduce requests by 15-20, save 1-2 MB

**Problem:**
Multiple tracking pixels making 20+ redundant requests:
- Facebook Pixel: 4 requests
- TikTok Pixel: 11 requests
- Bing Ads: 3 requests
- Reddit Pixel: 2 requests
- Google Analytics: 3 requests

**Solutions:**
- Implement GTM Server-Side Tagging to proxy all pixels
- Batch events and send in batches instead of real-time
- Lazy load pixels until after `window.onload`
- Use Consent Mode to only fire pixels after user consent
- Consider single analytics platform (GA4) with server-side forwarding

**Expected Results:**
- Network requests: -15 to -20
- Data transfer: -1 to -2 MB
- Improved privacy compliance

---

## 8. Add Resource Hints and Preconnects

**Impact:** Reduce connection setup time by 100-300ms

**Problem:**
Missing strategic resource hints for critical third-party resources.

**Solution:**
```html
<!-- DNS Prefetch for third parties -->
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
<link rel="dns-prefetch" href="https://cdn.cookielaw.org">
<link rel="dns-prefetch" href="https://create.leadid.com">

<!-- Preconnect for critical origins -->
<link rel="preconnect" href="https://cdn.builder.io" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://www.googletagmanager.com">

<!-- Remove unused preconnect -->
<!-- <link rel="preconnect" href="https://fonts.googleapis.com"> -->

<!-- Preload critical resources -->
<link rel="preload" href="/main-66UV7QVJ.js" as="script">
<link rel="preload" href="/styles-HYSYGPG2.css" as="style">

<!-- Priority hints -->
<script src="/main-66UV7QVJ.js" fetchpriority="high"></script>
```

**Expected Results:**
- DNS resolution: 50-300ms faster
- TCP connection: 100-200ms faster
- Third-party scripts load earlier

---

## 9. Inline Critical CSS Above the Fold

**Impact:** Reduce LCP by 100-300ms

**Problem:**
CSS is render-blocking. Users see blank page until CSS loads and processes. Current render delay is 186ms (99.5% of LCP time).

**Solution:**
```html
<style>
  /* Critical CSS for above-fold content only */
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; }
  .hero { background: linear-gradient(...); padding: 40px 20px; }
  h1 { font-size: 2.5rem; line-height: 1.2; margin: 0; }
</style>

<!-- Load remaining CSS async -->
<link rel="stylesheet" href="styles.css" media="print" onload="this.media='all'">
```

**Additional optimizations:**
- Defer all non-critical scripts
- Show content before cookie banner (render page first, overlay banner after)
- Simplify OneTrust initialization
- Use `content-visibility: auto` for off-screen content

**Expected Results:**
- First Paint: 100-300ms faster
- LCP render delay: 186ms → <100ms
- Better perceived performance

---

## 10. Implement Application Optimization & Caching

**Impact:** Reduce initial bundle by 30-60%, improve repeat visits by 500-2000ms

**Problem:**
No code splitting, no service worker caching strategy. Every visit requires full download.

**Solutions:**

**A. Code Splitting & Lazy Loading:**
```javascript
// Angular lazy-loaded routes
const routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
  }
];
```

**B. Build Configuration:**
```javascript
// angular.json
{
  "production": {
    "optimization": true,
    "outputHashing": "all",
    "sourceMap": false,
    "lazyModules": ["app/lazy-module"]
  }
}
```

**C. Service Worker Caching:**
```typescript
const CACHE_VERSION = 'v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/polyfills-B6TNHZQ6.js',
  '/main-66UV7QVJ.js',
  '/styles.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(STATIC_ASSETS))
  );
});
```

**Expected Results:**
- Initial bundle: 30-60% smaller
- Repeat visits: 500-2000ms faster
- Offline functionality

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)
**Effort:** 2-3 hours  
**Impact:** High

1. Enable HTML compression
2. Add resource hints and preconnects
3. Remove unused preconnect hints
4. Optimize font loading (preload + font-display)

### Phase 2: High Impact (1-2 weeks)
**Effort:** 8-16 hours  
**Impact:** Very High

5. Move third-party scripts to async loading
6. Consolidate and defer tracking pixels
7. Optimize third-party main thread blocking
8. Remove unused Bootstrap CSS

### Phase 3: Structural Changes (2-4 weeks)
**Effort:** 16-32 hours  
**Impact:** Medium-High

9. Optimize Builder.io network dependency chain
10. Inline critical CSS and reduce render delay
11. Implement code splitting
12. Implement service worker caching

---

## Expected Overall Results

**Performance Improvements:**
- Page weight: 4.8 MB → 1.5-2 MB (50-70% reduction)
- Network requests: 78 → 35-40 (40-50% reduction)
- First Contentful Paint: 500-1000ms faster
- Time to Interactive: 2-3x faster
- Main thread blocking: 175ms → 25-50ms (85% reduction)

**Business Impact:**
- Development effort: 40-80 hours
- Performance improvement: 100-200% (TTI)
- Estimated conversion rate lift: +2-5%
- Better mobile performance on 3G/4G networks
- Improved privacy compliance

---

## Monitoring & Validation

**Tools:**
- Chrome DevTools Performance Panel
- Lighthouse CLI: `lighthouse https://getstarted.loandepot.com --view`
- WebPageTest
- Google Search Console (Core Web Vitals)
- Real User Monitoring (Cloudflare RUM or GA4)

**Target Metrics:**
- LCP: <187ms (maintain current excellent score)
- CLS: <0.00 (maintain current excellent score)
- FID/INP: <100ms
- Total Blocking Time: <50ms (currently 175ms)
- Total Page Weight: <2 MB (currently 4.8 MB)
- Network Requests: <40 (currently 78)

---

*Combined analysis from Chrome DevTools Performance Insights and index.html review*  
*Analysis date: December 15, 2025*
