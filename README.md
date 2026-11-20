# 今天吃什么 · Today Eat What

A fun, lightweight, local-first meal roulette. 每天中午不用纠结，转一下决定「店铺 + 菜品」。

## 功能（首版）
- 用等概率随机算法从**已启用的店铺 + 菜品组合**中选择
- 动画转盘 + 文字结果，支持继续抽取
- 内置可编辑的演示菜单（可新增、启停、删除、重置）
- 本地持久化，无需账号、后端或远程 API
- Web 移动端 / 平板 / 大屏响应式布局；预留微信小程序构建

## 技术栈
Taro 4 + React 18 + TypeScript + Vite + Bun；前端使用 Taro 组件和 Taro Storage。

## 开始开发
需要 Bun 1.4.3+。首次安装：

```bash
bun ci
bun run dev:h5
```

常用命令：
```bash
bun run typecheck
bun run test
bun run build:h5
bun run build:weapp
bun run build:pages
bunx playwright install chromium firefox # first time only
bun run smoke:h5 # run after build:pages; verifies both browsers at desktop/mobile widths
bun run build:workers
bun run check:workers # Wrangler dry run; does not publish
```

仓库已提交 `bun.lock`，CI 和 Cloudflare Workers Builds 均可据此安装固定依赖。需要更新依赖时再运行 `bun install` 并提交更新后的锁文件。

## 部署方式
- **GitHub Pages**：保持原有 GitHub Actions 发布流程，构建基准路径 `/today-eat-what/`。
- **Cloudflare Workers**：使用 **Cloudflare Workers Builds（GitHub 连接）**。由 Cloudflare 监听 `main`、执行 `bun run build:workers` 构建根路径 H5，再执行 `bun run deploy:workers` 上传 `dist/` 静态资源；不再通过 GitHub Actions 上传 Worker。详细配置见 [Cloudflare Workers 部署指南](./docs/cloudflare-workers-builds.md)。
- 两套发布互不干扰，构建产物不能混用。Worker 的名称须与 `wrangler.jsonc` 中的 `name`（`today-eat-what`）一致。

## 微信小程序
`bun run build:weapp` 产生 `dist/`，用微信开发者工具打开项目。把 `project.config.json` 的 `touristappid` 换为自己的小程序 AppID 再做发布测试。此次只是跨端初始支持，不代表已通过微信真机或上架审核。

## 数据与隐私
演示数据位于 `src/domain/sample.ts`。菜单仅存于浏览器或小程序本地；不同浏览器、设备、域名之间不会自动同步。浏览器清理站点存储将丢失自定义数据。请勿在演示菜单中添加个人隐私信息。

## 协作与许可证
开发规范见 [AGENTS.md](./AGENTS.md)。仓库原有许可为 [AGPL-3.0](./LICENSE)，本次初始化保持不变。

## H5 白屏回归说明
此前 Taro 4.3.1 的显式 `h5.router.basename: '/'` 配置会造成 `#/pages/index/index` 已切换但 `#app` 为空。现保留 `hash` 模式并使用默认 basename，CI 加入 Playwright Chromium/Firefox 实际加载、抽选及移动端刷新测试，避免仅凭构建成功即判断已上线。
