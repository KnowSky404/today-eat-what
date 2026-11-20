# Architecture and delivery checklist

- Taro 4 targets H5 and native WeChat from one React page. H5 emits to `dist/` and WeChat to `dist-weapp/`.
- MVP: menu choices -> active flat pairs -> unbiased index -> wheel rotation -> explicit result.
- No app network calls, user identity or external restaurant inventory. Native WeChat sharing opens the app entry route with no menu data.
- Sample data is a first-run seed, not downloaded and not overwritten on each launch.
- Storage key is versioned. Corrupt/unsupported payloads must fail to a safe empty/seed state instead of crashing.
- Layout checkpoints: 320, 375, 768, 1024, 1440, 1920 px; reduced motion; keyboard and touch.
- Build matrix: H5 root, H5 Pages subpath (browser smoke in Chromium and Firefox), and WeChat (built-bundle smoke with mocked native APIs). WeChat release acceptance also requires device testing and manual platform review.
- Cloudflare Worker is **static hosting** for now; do not add backend routes without a documented need.
- Acceptance requires actual CI and Pages/Workers URLs to be checked after owner enables deployments and credentials.
