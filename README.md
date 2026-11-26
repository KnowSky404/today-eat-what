# 晓空今天吃什么 · Today Eat What

**简体中文** · [English](./README.en.md)

[![Release](https://img.shields.io/github/v/release/KnowSky404/today-eat-what)](https://github.com/KnowSky404/today-eat-what/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/KnowSky404/today-eat-what/ci.yml?branch=main)](https://github.com/KnowSky404/today-eat-what/actions/workflows/ci.yml)
[![AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](./LICENSE)

一个轻量的本地选餐转盘，帮你从常吃的店铺和菜品里选出今天的一餐。无需登录，也无需应用后端。菜单和个人备注只存于当前浏览器或微信小程序，不会跨设备或站点同步。

## 开始使用

**Web** · [Cloudflare Workers](https://today-eat-what.knowsky.info/) · [GitHub Pages](https://knowsky404.github.io/today-eat-what/)

**微信小程序**「晓空今天吃什么」已正式上线。打开微信「扫一扫」，扫描下方小程序码。

<img src="./docs/assets/wechat-miniprogram-code.jpg" width="220" alt="晓空今天吃什么微信小程序码">

点击「开始随机选择」，转盘停下后会显示菜品、店铺、区域和已保存的个人备注。你可以接受结果或再抽一次。

## 功能

- **等概率抽选**。每条已启用的店铺与菜品组合都有相同机会。同一家店的多个菜品分别参与抽选。
- **本地菜单**。内置 10 条可编辑的维护者推荐，支持新增、编辑、暂停、启用、删除及恢复推荐清单。
- **响应式布局**。Web 适配手机和桌面，微信小程序支持触控。可跳过旋转动画，直接查看文字结果。
- **微信分享**。通过小程序右上角菜单转发首页。分享卡片采用固定封面，本地菜单和备注留在设备上。

## 本地开发

项目使用 Taro 4.3.1、React 18、TypeScript 和 Vite。请准备 Bun（仓库固定为 1.4.3）和 Node.js。

```bash
bun ci
bun run dev:h5
```

微信端可在 `.env.local` 中设置 `TARO_APP_ID`，执行 `bun run build:weapp` 后，用[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)导入 `dist-weapp/`。自动化构建检查可省略 AppID。

```bash
bun run check
bun run smoke:weapp
bun run build:pages
bunx playwright install chromium firefox
bun run smoke:h5
bun run build:workers
bun run check:workers
```

`check` 运行类型检查、单元测试及两端构建。H5 冒烟测试在 Chromium 和 Firefox 中验证 Pages 子路径及响应式布局，`check:workers` 验证 Worker 的部署配置。

## 构建与部署

| 平台 | 构建命令 | 产物和发布方式 |
| --- | --- | --- |
| GitHub Pages | `bun run build:pages` | GitHub Actions 从 `main` 发布 `dist/`，基准路径为 `/today-eat-what/` |
| Cloudflare Workers | `bun run build:workers` | Workers Builds 通过原生 GitHub 集成监听 `main`，以 `bun run deploy:workers` 发布根路径 `dist/`。参见[部署指南](./docs/cloudflare-workers-builds.md) |
| 微信小程序 | `bun run build:weapp` | 产物为 `dist-weapp/`。GitHub Actions 负责构建和测试，开发版上传、提审和正式发布见[发布清单](./docs/weapp-release-checklist.md) |

## 许可证

本项目采用 [GNU AGPL-3.0](./LICENSE) 许可证。协作约定见 [AGENTS.md](./AGENTS.md)。
