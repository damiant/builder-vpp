# Performance Improvements

## 1. Move OneTrust & GTM Scripts to Async Loading

**Impact:** -500ms to -1000ms First Paint

### Problem

OneTrust and Google Tag Manager scripts are injected synchronously in the `<head>` before the page can render, blocking the entire page from painting until these external scripts load.

### Solution

Move these scripts to load asynchronously after page render:

```html
<!-- Move to end of <body>, after app-root -->
<script>
  // OneTrust - Load async
  var oneTrustId = "0197cd15-913a-717f-a29e-a9d53ff3191a";
  if (!window.location.hostname.startsWith("getstarted.loandepot.com")) {
    oneTrustId += "-test";
  }

  // Load OneTrust OtAutoBlock
  var script1 = document.createElement("script");
  script1.type = "text/javascript";
  script1.async = true;
  script1.src = "https://cdn.cookielaw.org/consent/" + oneTrustId + "/OtAutoBlock.js";
  document.body.appendChild(script1);

  // Load OneTrust SDK
  var script2 = document.createElement("script");
  script2.type = "text/javascript";
  script2.charset = "UTF-8";
  script2.async = true;
  script2.setAttribute("data-document-language", "true");
  script2.setAttribute("data-domain-script", oneTrustId);
  script2.src = "https://cdn.cookielaw.org/scripttemplates/otSDKStub.js";
  document.body.appendChild(script2);

  // Setup OptanonWrapper
  window.OptanonWrapper = function () {};
</script>

<!-- GTM - Load async -->
<script async>
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "GTM-TF5M7SDK");
</script>
```

**Benefits:**

- Removes render-blocking scripts from critical rendering path
- Page becomes interactive 500ms-1000ms faster
- Analytics/consent tools load in background after initial page render

---

## 2. Optimize Font Loading Strategy

**Impact:** -300ms to -500ms First Contentful Paint

### Problem

Loading multiple fonts (Material Icons, DM Sans, Poppins) with multiple weights blocks text rendering. Font files are large (~50-100KB each).

### Solution

**1. Use `font-display: swap` for all fonts**

Ensure all `@font-face` rules use `font-display: swap` to show fallback text immediately.

**2. Preload critical fonts:**

```html
<!-- In <head>, after meta tags -->
<link
  rel="preload"
  as="font"
  href="https://fonts.gstatic.com/s/dmsans/v17/rP2Hp2ywxg089UriCZ2IHSeH.woff2"
  type="font/woff2"
  crossorigin
/>
<link
  rel="preload"
  as="font"
  href="https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLFj_Z1xlFQ.woff2"
  type="font/woff2"
  crossorigin
/>
```

**3. Limit font weights:**

Only load the weights you actually use (typically 400, 500, 600, 700).

```html
@import
url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
```

**4. Move font imports to CSS:**

Instead of multiple `<style>` tags, use a single `@import` in your main CSS file.

**Benefits:**

- Preload tells browser to fetch fonts early, in parallel with HTML parsing
- `font-display: swap` shows text immediately with fallback font
- Limiting weights reduces font file sizes by 40-60%
- Reduces number of HTTP requests

---

## 3. Remove Unused Bootstrap CSS

**Impact:** -50KB to -150KB bundle size

### Problem

Loading full Bootstrap (196KB+) when only a small portion is used adds unnecessary CSS to parse and render.

### Solution

**Option A: Use PurgeCSS / Tree-shaking:**

- Configure your build tool to remove unused Bootstrap classes
- In Angular, use `ng build --prod` with optimization enabled

**Option B: Use Bootstrap components selectively:**

- Import only needed Bootstrap modules instead of the full CSS

**Option C: Replace with utility-first CSS:**

- Consider migrating to Tailwind CSS for better tree-shaking
- Generate only CSS for classes you actually use

**Implementation:**

```html
<!-- Modern approach: Load CSS with defer for non-critical styles -->
<link href="bootstrap-optimized.min.css" rel="stylesheet" />
<!-- OR use critical CSS inlining for above-the-fold styles -->
<style>
  /* Only critical Bootstrap classes used on first paint */
</style>
<link href="bootstrap-rest.min.css" rel="stylesheet" media="print" onload="this.media='all'" />
```

**Benefits:**

- Bootstrap.css is 196KB minified - often 70-80% unused
- Reduces CSS parsing/rendering time
- Faster downloads on slow connections
- Typical savings: 50-150KB depending on usage

---

## 4. Add Resource Hints for Third-Party Services

**Impact:** -100ms to -200ms on third-party script load

### Problem

No DNS pre-resolution for heavy third-party scripts (Google Recaptcha, cookielaw.org, googletagmanager.com).

### Solution

Add these to `<head>` after viewport meta tag:

```html
<!-- DNS prefetch for third-party domains -->
<link rel="dns-prefetch" href="https://cdn.cookielaw.org" />
<link rel="dns-prefetch" href="https://www.google.com" />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />

<!-- Preconnect for critical third-party origins -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

**Benefits:**

- DNS prefetch: 50-300ms savings by resolving domain early
- Preconnect: Additional savings by establishing TCP connection in advance
- Applies to all third-party scripts that load early

---

## 5. Lazy Load Google reCAPTCHA

**Impact:** -35KB deferred

### Problem

Google reCAPTCHA API loads on every page load regardless of whether user interacts with forms.

### Solution

Load reCAPTCHA only when needed (on form render):

```html
<script>
  function loadRecaptcha() {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }

  // Call loadRecaptcha() only when user navigates to form page
  // or when form component mounts
</script>
```

**Benefits:**

- reCAPTCHA API is 35KB+ - not needed on every page
- Defers non-critical script loading
- Improves pages without forms

---

## 6. Inline Critical CSS Above the Fold

**Impact:** -100ms to -300ms LCP (Largest Contentful Paint)

### Problem

CSS is render-blocking. Users see blank page until CSS loads and processes.

### Solution

Identify and inline critical CSS in `<head>`:

```html
<style>
  /* Critical CSS for above-fold content only */
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
  }
  .hero {
    background: linear-gradient(...);
    padding: 40px 20px;
  }
  h1 {
    font-size: 2.5rem;
    line-height: 1.2;
    margin: 0;
  }
  /* ... other critical styles ... */
</style>

<!-- Load remaining CSS async -->
<link rel="stylesheet" href="styles.css" media="print" onload="this.media='all'" />
```

**Benefits:**

- Eliminates render-blocking CSS for above-fold content
- First paint happens 100-300ms faster
- Rest of CSS loads asynchronously

---

## 7. Optimize Application Bundle Loading

**Impact:** Variable (depends on bundle size)

### Problem

Application scripts could benefit from code splitting and lazy loading.

### Solution

**Implement Code Splitting & Lazy Loading:**

```javascript
// In Angular/app code, use lazy-loaded routes:
const routes = [
  {
    path: "dashboard",
    loadChildren: () => import("./dashboard/dashboard.module").then((m) => m.DashboardModule),
  },
  {
    path: "forms",
    loadChildren: () => import("./forms/forms.module").then((m) => m.FormsModule),
  },
];
```

**Build Configuration Optimization:**

```javascript
// In angular.json or build config:
{
  "production": {
    "optimization": true,
    "outputHashing": "all",
    "sourceMap": false,
    "namedChunks": false,
    "lazyModules": ["app/lazy-module"]
  }
}
```

**Benefits:**

- Code splitting reduces initial bundle size by 30-60%
- Lazy loading defers non-critical code
- Faster app initialization

---

## 8. Implement Service Worker Caching

**Impact:** -500ms to -2000ms on repeat visits

### Problem

No caching strategy for static assets. Every visit requires full download.

### Solution

Implement a service worker for offline support and cache management:

```typescript
// service-worker.ts
const CACHE_VERSION = "v1";
const CACHE_NAME = `${CACHE_VERSION}-cache`;
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/polyfills-B6TNHZQ6.js",
  "/main-66UV7QVJ.js",
  "/styles.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
```

**Benefits:**

- Cached assets load instantly on repeat visits
- Works offline or on slow connections
- Typical savings: 500ms-2s per visit after initial load

---

## Implementation Summary

| Issue                      | Effort    | Expected Gain               |
| -------------------------- | --------- | --------------------------- |
| Move OneTrust/GTM to async | 30 min    | -500ms to -1s FCP           |
| Optimize font loading      | 45 min    | -300ms to -500ms FCP        |
| Remove unused Bootstrap    | 1-2 hours | -50KB to -150KB             |
| Add resource hints         | 15 min    | -100ms to -200ms            |
| Lazy load reCAPTCHA        | 20 min    | -35KB deferred              |
| Inline critical CSS        | 1 hour    | -100ms to -300ms LCP        |
| Code splitting             | 2-3 hours | -30% to -60% initial bundle |
| Service Worker             | 2-3 hours | -500ms to -2s repeat visits |

---

## Testing & Measurement

After implementing changes, measure with:

```bash
# Using Lighthouse CLI
npm install -g lighthouse
lighthouse https://getstarted.loandepot.com --view
```

Monitor these Core Web Vitals:

- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
