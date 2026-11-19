# Architecture and delivery checklist

- Web first. The Taro build also targets WeChat, but releases require separate mini-program visual and device acceptance.
- MVP: menu choices -> active flat pairs -> unbiased index -> wheel rotation -> explicit result.
- No network calls, user identity, social features or external restaurant inventory.
- Sample data is a first-run seed, not downloaded and not overwritten on each launch.
- Storage key is versioned. Corrupt/unsupported payloads must fail to a safe empty/seed state instead of crashing.
- Layout checkpoints: 320, 375, 768, 1024, 1440, 1920 px; reduced motion; keyboard and touch.
- Build matrix: H5 root, H5 Pages subpath, WeChat Mini Program. CI must guard regressions.
- Cloudflare Worker is **static hosting** for now; do not add backend routes without a documented need.
- Acceptance requires actual CI and Pages/Workers URLs to be checked after owner enables deployments and credentials.
