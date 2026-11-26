# Today Eat What · 晓空今天吃什么

[简体中文](./README.md) · **English**

[![Release](https://img.shields.io/github/v/release/KnowSky404/today-eat-what)](https://github.com/KnowSky404/today-eat-what/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/KnowSky404/today-eat-what/ci.yml?branch=main)](https://github.com/KnowSky404/today-eat-what/actions/workflows/ci.yml)
[![AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](./LICENSE)

A lightweight, local-first meal roulette that picks your next meal from your own list of shops and dishes. It runs without an account or an application backend. Menus and personal notes stay in the current browser or WeChat Mini Program, with no sync across devices or sites.

## Get started

**Web** · [Cloudflare Workers](https://today-eat-what.knowsky.info/) · [GitHub Pages](https://knowsky404.github.io/today-eat-what/)

**WeChat Mini Program** · 晓空今天吃什么 is publicly available. Open WeChat and use **Scan** to scan the Mini Program code below.

<img src="./docs/assets/wechat-miniprogram-code.jpg" width="220" alt="WeChat Mini Program code for 晓空今天吃什么">

Select **Start** (开始随机选择). When the wheel stops, the result shows the dish, shop, district and any saved personal note. Accept the result or spin again.

## Features

- **Uniform random selection.** Each enabled shop-and-dish entry has the same chance. Multiple dishes from the same shop enter the draw separately.
- **Local menu.** Start with 10 editable recommendations from the maintainer. Add, edit, pause, enable or delete entries, or restore the recommended list.
- **Responsive layout.** The Web app adapts to mobile and desktop, and the Mini Program supports touch. Skip the wheel animation to see the result immediately.
- **WeChat sharing.** Share the home page from the Mini Program menu. The share card uses a fixed cover, so your local menu and notes stay on your device.

## Local development

The project uses Taro 4.3.1, React 18, TypeScript and Vite. Install Bun (pinned to 1.4.3 in the repo) and Node.js.

```bash
bun ci
bun run dev:h5
```

For the Mini Program, set `TARO_APP_ID` in `.env.local`, run `bun run build:weapp`, and import `dist-weapp/` into [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html). Automated build checks can run without an AppID.

```bash
bun run check
bun run smoke:weapp
bun run build:pages
bunx playwright install chromium firefox
bun run smoke:h5
bun run build:workers
bun run check:workers
```

`check` runs type checking, unit tests and both platform builds. The H5 smoke test checks the Pages subpath and responsive layout in Chromium and Firefox. `check:workers` validates the Worker deployment configuration.

## Build and deploy

| Platform | Build command | Output and deployment |
| --- | --- | --- |
| GitHub Pages | `bun run build:pages` | GitHub Actions publishes `dist/` from `main` under `/today-eat-what/` |
| Cloudflare Workers | `bun run build:workers` | Workers Builds watches `main` through the native GitHub integration and publishes the root-path `dist/` with `bun run deploy:workers`. See the [deployment guide](./docs/cloudflare-workers-builds.md) |
| WeChat Mini Program | `bun run build:weapp` | Builds to `dist-weapp/`. GitHub Actions builds and tests the app. See the [release checklist](./docs/weapp-release-checklist.md) for developer uploads, review and public release |

## License

Licensed under the [GNU AGPL-3.0](./LICENSE). See [AGENTS.md](./AGENTS.md) for contribution guidelines.
