# Performance Recommendations for getstarted.loandepot.com

## Executive Summary

Performance analysis of https://getstarted.loandepot.com/ reveals significant opportunities for optimization. While the site achieves a fast LCP of 187ms and excellent CLS of 0.00, it loads **4.6 MB of third-party scripts** across 78 network requests, with substantial main thread blocking time from tracking and analytics scripts.

**Current Metrics:**

- LCP: 187 ms ✅ (Good)
- CLS: 0.00 ✅ (Excellent)
- TTFB: 0.9 ms ✅ (Excellent)
- Total Page Weight: ~4.8 MB ❌
- Network Requests: 78 ❌
- Third-Party Script Execution: 175 ms ❌

---

## Top 10 Performance Improvements

### 1. **Enable HTML Compression (Critical)**

**Issue:** The root HTML document (106 KB) is served **without compression** (gzip or brotli).

**Impact:**

- Wasted bytes: 71.1 KB
- Potential savings: ~70-80% file size reduction
- Failed compression check in Document Latency audit

**Solution:**

```nginx
# Enable Brotli or Gzip compression in Azure CDN/Front Door
Content-Encoding: br  # or gzip
```

**Expected Improvement:** Reduce HTML transfer from 106 KB → ~25-30 KB

---

### 2. **Reduce Third-Party Script Bloat (Critical)**

**Issue:** Loading 4.6 MB of third-party JavaScript from 16+ vendors.

**Breakdown by vendor:**

- Google Tag Manager: 1.8 MB
- Google CDN (reCAPTCHA): 1.2 MB
- OneTrust/Optanon: 1 MB
- TikTok Pixel: 770.7 KB
- Facebook Pixel: 602.9 kB
- Braze: 261.5 kB
- JSDelivr (Bootstrap): 224.3 kB
- LeadID/lidstatic: 169.6 kB
- Bing Ads: 133.4 kB
- Google Fonts: 125.5 kB
- Reddit Pixel: 100.1 kB

**Solutions:**

1. **Audit necessity**: Question whether all tracking pixels are essential
2. **Lazy load non-critical scripts**: Defer TikTok, Reddit, Braze until after page load
3. **Use GTM to consolidate**: Manage all pixels through GTM Server-Side Tagging (reduce client-side load)
4. **Implement Consent Mode v2**: Only load tracking scripts after user consent
5. **Use Partytown**: Offload third-party scripts to a web worker

**Expected Improvement:** Reduce JavaScript by 2-3 MB, improve TTI by 1-2 seconds

---

### 3. **Optimize Third-Party Main Thread Blocking (High Priority)**

**Issue:** Third-party scripts block the main thread for **175ms total**.

**Main culprits:**

- lidstatic.com (LeadID): **99 ms** (56% of blocking time)
- Google Tag Manager: 33 ms
- OneTrust: 10 ms
- Facebook Pixel: 9 ms
- TikTok: 8 ms

**Solutions:**

1. **Defer LeadID initialization**: Load after page interactive
2. **Use `async` or `defer`**: Ensure all scripts use non-blocking loading
3. **Code-split GTM**: Only load essential tags on initial page load
4. **Lazy load consent management**: Show banner after FCP

**Expected Improvement:** Reduce main thread blocking by ~100-150ms, improve TTI

---

### 4. **Eliminate Render-Blocking CSS (Medium Priority)**

**Issue:** Bootstrap CSS (from CDN) is render-blocking, though impact is minimal (62 μs download).

**Current:**

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"
/>
```

**Solutions:**

1. **Inline critical CSS**: Extract and inline above-the-fold Bootstrap styles
2. **Defer non-critical CSS**: Use `media="print" onload="this.media='all'"` trick
3. **Self-host Bootstrap**: Serve from same origin to reduce DNS lookup
4. **Use only needed components**: Extract only required Bootstrap modules (reduces ~50%)

**Expected Improvement:** Remove render-blocking resource, marginally improve FCP

---

### 5. **Optimize Network Dependency Chain (Medium Priority)**

**Issue:** Critical path latency of **192ms** through cascading requests.

**Critical chain:**

```
index.html (131ms)
  └─ main-66UV7QVJ.js (2ms)
      └─ builder.io API /leadsource (192ms) ← LONGEST CHAIN
      └─ builder.io API /page (172ms)
```

**Problems:**

- Content fetched at runtime via Builder.io API calls
- Sequential dependency: HTML → JS → API → Content
- 192ms added to critical path

**Solutions:**

1. **Preconnect to Builder.io**: Add `<link rel="preconnect" href="https://cdn.builder.io">`
2. **Prefetch API responses**: Use `<link rel="prefetch">` for known API calls
3. **Static Site Generation (SSG)**: Pre-render Builder.io content at build time
4. **Edge caching**: Cache Builder.io API responses at CDN edge
5. **Inline initial content**: Embed critical page content in HTML

**Expected Improvement:** Reduce critical path by 150-200ms, faster content display

---

### 6. **Remove Unused Preconnect Hints (Low Priority)**

**Issue:** Unused preconnect to `fonts.googleapis.com` (fonts loaded from `fonts.gstatic.com`).

**Current:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com/" />
<link rel="preconnect" href="https://fonts.gstatic.com/" />
```

**Solution:**

```html
<!-- Remove this -->
<link rel="preconnect" href="https://fonts.googleapis.com/" />

<!-- Keep this -->
<link rel="preconnect" href="https://fonts.gstatic.com/" />

<!-- Add these -->
<link rel="preconnect" href="https://cdn.builder.io" crossorigin />
<link rel="preconnect" href="https://www.googletagmanager.com" />
```

**Expected Improvement:** Prevent wasted connection, free up browser connection slots

---

### 7. **Reduce Element Render Delay (Medium Priority)**

**Issue:** 99.5% of LCP time (186ms out of 187ms) is render delay, not network time.

**LCP Element:** Cookie banner button (`#ot-sdk-btn`)

**Root causes:**

- JavaScript execution blocking rendering
- OneTrust cookie banner initialization
- Multiple scripts executing before paint

**Solutions:**

1. **Reduce JavaScript execution**: Defer all non-critical scripts
2. **Show content before cookie banner**: Render page first, overlay banner after
3. **Simplify cookie banner**: Reduce OneTrust initialization complexity
4. **Use `content-visibility: auto`**: For off-screen content
5. **Optimize fonts**: Use `font-display: swap` to prevent FOIT

**Expected Improvement:** Reduce LCP render delay to <100ms

---

### 8. **Consolidate and Defer Tracking Pixels (High Priority)**

**Issue:** Multiple tracking pixels making 20+ redundant requests.

**Tracking pixels identified:**

- Facebook Pixel: 4 requests
- TikTok Pixel: 11 requests
- Bing Ads: 3 requests
- Reddit Pixel: 2 requests
- Google Analytics: 3 requests

**Solutions:**

1. **Server-Side Tracking**: Implement GTM Server-Side to proxy all pixels
2. **Batch events**: Queue events and send in batches, not real-time
3. **Lazy load pixels**: Defer loading until after `window.onload`
4. **Use Consent Mode**: Only fire pixels after user consent
5. **Consider alternatives**: Use single analytics platform (e.g., GA4) with server-side forwarding

**Expected Improvement:** Reduce requests by 15-20, save ~1-2 MB, improve privacy

---

### 9. **Optimize Font Loading Strategy (Medium Priority)**

**Issue:** Google Fonts (DM Sans) loaded at runtime adds to critical path.

**Current setup:**

- Font loaded from `fonts.gstatic.com` (125.5 kB)
- Blocks rendering until font available

**Solutions:**

1. **Self-host fonts**: Download and serve from own CDN
2. **Use `font-display: swap`**: Prevent invisible text (FOIT)
3. **Preload critical fonts**:
   ```html
   <link rel="preload" href="/fonts/dmsans.woff2" as="font" type="font/woff2" crossorigin />
   ```
4. **Use variable fonts**: Reduce number of font files
5. **Subset fonts**: Include only required characters (Latin only = ~40% size reduction)

**Expected Improvement:** Reduce CLS, eliminate font-related render blocking

---

### 10. **Implement Resource Hints and Priority Hints (Low Priority)**

**Issue:** Missing strategic resource hints for critical resources.

**Current state:**

- No `dns-prefetch` for third-party origins
- No `preload` for critical scripts/styles
- No `fetchpriority` hints

**Recommended additions:**

```html
<!-- DNS Prefetch for third parties -->
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
<link rel="dns-prefetch" href="https://cdn.cookielaw.org" />
<link rel="dns-prefetch" href="https://create.leadid.com" />

<!-- Preconnect for critical origins -->
<link rel="preconnect" href="https://cdn.builder.io" crossorigin />
<link rel="preconnect" href="https://www.googletagmanager.com" />

<!-- Preload critical resources -->
<link rel="preload" href="/main-66UV7QVJ.js" as="script" />
<link rel="preload" href="/styles-HYSYGPG2.css" as="style" />

<!-- Priority hints -->
<script src="/main-66UV7QVJ.js" fetchpriority="high"></script>
<img src="/hero-image.jpg" fetchpriority="high" />
```

**Expected Improvement:** Reduce connection setup time by 100-300ms for third parties

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)

1. ✅ Enable HTML compression (Recommendation #1)
2. ✅ Remove unused preconnect (Recommendation #6)
3. ✅ Add resource hints (Recommendation #10)
4. ✅ Optimize font loading (Recommendation #9)

### Phase 2: High Impact (1-2 weeks)

5. ✅ Reduce third-party scripts (Recommendation #2)
6. ✅ Defer tracking pixels (Recommendation #8)
7. ✅ Optimize main thread blocking (Recommendation #3)

### Phase 3: Structural Changes (2-4 weeks)

8. ✅ Optimize Builder.io integration (Recommendation #5)
9. ✅ Reduce render delay (Recommendation #7)
10. ✅ Address render-blocking CSS (Recommendation #4)

---

## Monitoring and Validation

After implementing improvements, monitor:

1. **Core Web Vitals**: Track LCP, CLS, FID/INP in Google Search Console
2. **Real User Monitoring**: Use Cloudflare RUM or Google Analytics 4
3. **Lighthouse CI**: Automate performance testing in deployment pipeline
4. **WebPageTest**: Test from multiple locations and devices
5. **Chrome DevTools Performance Panel**: Regular profiling

**Target Metrics:**

- LCP: <187ms ✅ (maintain current)
- CLS: <0.00 ✅ (maintain current)
- FID/INP: <100ms (measure)
- Total Blocking Time: <300ms (currently ~175ms)
- Total Page Weight: <2 MB (currently 4.8 MB)
- Network Requests: <40 (currently 78)

---

## Additional Observations

### Positive Aspects ✅

- **Excellent server response time**: TTFB of 0.9ms is outstanding
- **No redirects**: Direct navigation to final URL
- **HTTP/2 enabled**: Multiplexing active for all resources
- **Good caching headers**: Immutable cache on CDN resources
- **Fast LCP element**: Text-based LCP is good choice (no image loading)

### Areas of Concern ⚠️

- **Privacy compliance**: 16+ tracking scripts may violate GDPR/CCPA without proper consent
- **Single point of failure**: Heavy reliance on Builder.io API for content
- **Cookie banner as LCP**: Suboptimal UX to have cookie dialog as largest paint
- **No service worker**: Missing opportunity for offline support and caching
- **Azure CDN configuration**: Missing compression hints in response headers

---

## Conclusion

The site has **excellent foundation performance** (TTFB, LCP, CLS) but is severely impacted by third-party script bloat. By implementing these 10 recommendations, you can expect:

- **50-70% reduction in page weight** (4.8 MB → 1.5-2 MB)
- **40-50% fewer network requests** (78 → 35-40)
- **2-3x faster Time to Interactive**
- **Improved privacy compliance**
- **Better mobile performance** (3G/4G networks)

**Estimated ROI:**

- Development effort: 40-80 hours
- Performance improvement: 100-200% (TTI)
- Conversion rate impact: +2-5% (industry benchmarks for 1-second improvement)

---

_Analysis performed: December 15, 2025_  
_Tool: Chrome DevTools Performance Insights_  
_Test location: Desktop, unthrottled_
